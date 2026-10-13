import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { cores } from '../../estilos/social';

const gerarHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body { height: 100%; margin: 0; padding: 0; }
    #map { height: 100%; width: 100%; background: #f6f6f6; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
    }).setView([-24.4979, -47.8447], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const COR_NORMAL      = '#1a73e8';
    const COR_SELECIONADA = '#27ae60';
    const ORDEM_NIVEL     = { setor: 0, bairro: 1, distrito: 2, cidade: 3 };

    let camadas = [];   // [{ id_regiao, nome, nivel, layer }]
    let pins = [];
    let idSelecionada = null;
    let marcador = null;

    function avisar(msg) {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }

    // ===================== REGIÕES =====================

    function aplicarDestaque() {
      camadas.forEach(function (c) {
        const sel = c.id_regiao === idSelecionada;
        c.layer.setStyle({
          color:       sel ? COR_SELECIONADA : COR_NORMAL,
          fillColor:   sel ? COR_SELECIONADA : COR_NORMAL,
          fillOpacity: sel ? 0.3 : 0.1,
          weight:      sel ? 3 : 1.2,
        });
      });
    }

    function desenharRegioes(regioes) {
      camadas.forEach(function (c) { map.removeLayer(c.layer); });
      camadas = [];
      if (marcador) { map.removeLayer(marcador); marcador = null; }

      if (!regioes || regioes.length === 0) return;

      const bounds = [];

      regioes.forEach(function (r) {
        let geo;
        try { geo = JSON.parse(r.geojson); } catch (e) { return; }

        const layer = L.geoJSON(geo, {
          style: {
            color: COR_NORMAL,
            weight: 1.2,
            fillColor: COR_NORMAL,
            fillOpacity: 0.1,
          },
        }).addTo(map);

        camadas.push({ id_regiao: r.id_regiao, nome: r.nome, nivel: r.nivel, layer });
        bounds.push(layer.getBounds());
      });

      if (bounds.length > 0) {
        const grupo = L.featureGroup(bounds.map(function (b) { return L.rectangle(b); }));
        map.fitBounds(grupo.getBounds(), { padding: [30, 30] });
      }
    }

    function definirRegioes(regioes, idSel) {
      desenharRegioes(regioes);
      idSelecionada = idSel || null;
      aplicarDestaque();
    }

    // ===================== SELEÇÃO =====================

    function pontoEmPoligono(latlng, anel) {
      const x = latlng.lng;
      const y = latlng.lat;
      let dentro = false;

      for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
        const xi = anel[i].lng, yi = anel[i].lat;
        const xj = anel[j].lng, yj = anel[j].lat;

        const intersecta = ((yi > y) !== (yj > y))
          && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

        if (intersecta) dentro = !dentro;
      }
      return dentro;
    }

    function selecionarRegiao(latlng) {
      let encontrada = null;

      camadas.forEach(function (c) {
        const contem = c.layer.getLayers().some(function (l) {
          const aneis = l.getLatLngs();
          return aneis.some(function (anel) { return pontoEmPoligono(latlng, anel); });
        });
        if (!contem) return;
        if (!encontrada || ORDEM_NIVEL[c.nivel] < ORDEM_NIVEL[encontrada.nivel]) {
          encontrada = c;
        }
      });

      if (!encontrada) {
        idSelecionada = null;
        aplicarDestaque();
        if (marcador) { map.removeLayer(marcador); marcador = null; }
        avisar({ tipo: 'regiao', id_regiao: null, nome: null });
        return;
      }

      idSelecionada = encontrada.id_regiao;
      aplicarDestaque();

      if (marcador) map.removeLayer(marcador);
      marcador = L.circleMarker(latlng, {
        radius: 6,
        color: '#fff',
        weight: 3,
        fillColor: COR_SELECIONADA,
        fillOpacity: 1,
      }).addTo(map);

      avisar({ tipo: 'regiao', id_regiao: encontrada.id_regiao, nome: encontrada.nome });
    }

    // ===================== PINS =====================

    function definirPins(denuncias) {
      pins.forEach(function (p) { map.removeLayer(p); });
      pins = [];

      (denuncias || []).forEach(function (d) {
        let cor = '#1a73e8';
        if (d.status === 'resolvida') cor = '#27ae60';
        else if (d.status === 'rejeitada') cor = '#c0392b';

        const m = L.circleMarker([d.latitude, d.longitude], {
          radius: 5,
          color: '#fff',
          weight: 1.5,
          fillColor: cor,
          fillOpacity: 0.9,
        }).addTo(map);

        pins.push(m);
      });
    }

    function ocultarPins() {
      pins.forEach(function (p) { map.removeLayer(p); });
      pins = [];
    }

    // ===================== EVENTOS =====================

    map.on('click', function (e) {
      selecionarRegiao(e.latlng);
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({ tipo: 'pronto' }));
  </script>
</body>
</html>
`;

export default function SeletorRegiao({ onSelecionar, altura = 320 }) {
  const webviewRef = useRef(null);
  const [carregando, setCarregando] = useState(true);
  const [regiao, setRegiao] = useState(null);
  const [telaCheia, setTelaCheia] = useState(false);
  const [mostrarPins, setMostrarPins] = useState(false);

  // Refs para o carregamento inicial respeitar o estado atual
  const regiaoRef = useRef(regiao);
  regiaoRef.current = regiao;
  const pinsRef = useRef(mostrarPins);
  pinsRef.current = mostrarPins;

  const carregarTudo = useCallback(async () => {
    try {
      const { data } = await api.get('/regioes/geometrias.php');
      const idSel = regiaoRef.current?.id_regiao ?? null;

      webviewRef.current?.injectJavaScript(
        `definirRegioes(${JSON.stringify(data.itens)}, ${idSel === null ? 'null' : idSel}); true;`
      );

      if (pinsRef.current) {
        const resp = await api.get('/denuncias/listar_mapa.php');
        webviewRef.current?.injectJavaScript(
          `definirPins(${JSON.stringify(resp.data)}); true;`
        );
      }
    } catch (erro) {
      console.error('Erro ao carregar regiões:', erro);
    } finally {
      setCarregando(false);
    }
  }, []);

  async function alternarPins() {
    const novo = !mostrarPins;
    setMostrarPins(novo);

    if (!novo) {
      webviewRef.current?.injectJavaScript('ocultarPins(); true;');
      return;
    }

    try {
      const { data } = await api.get('/denuncias/listar_mapa.php');
      webviewRef.current?.injectJavaScript(
        `definirPins(${JSON.stringify(data)}); true;`
      );
    } catch (erro) {
      console.error('Erro ao carregar pins:', erro);
    }
  }

  function handleMessage(event) {
    try {
      const dados = JSON.parse(event.nativeEvent.data);

      if (dados.tipo === 'pronto') {
        carregarTudo();
        return;
      }

      if (dados.tipo === 'regiao') {
        const nova = dados.id_regiao ? { id_regiao: dados.id_regiao, nome: dados.nome } : null;
        setRegiao(nova);
        onSelecionar?.(nova);
      }
    } catch (erro) {
      console.error('Erro ao processar mensagem:', erro);
    }
  }

  function renderMapa() {
    return (
      <View style={{ flex: 1, backgroundColor: '#eee' }}>
        <WebView
          ref={webviewRef}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          source={{ html: gerarHtml() }}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMessage}
        />

        {/* ---------- Controles top-right ---------- */}
        <View style={styles.controles}>
          <TouchableOpacity
            style={[styles.botao, mostrarPins && styles.botaoAtivo]}
            onPress={alternarPins}
            hitSlop={6}
          >
            <Ionicons
              name="location"
              size={18}
              color={mostrarPins ? '#fff' : '#333'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botao}
            onPress={() => setTelaCheia((v) => !v)}
            hitSlop={6}
          >
            <Ionicons
              name={telaCheia ? 'contract-outline' : 'expand-outline'}
              size={18}
              color="#333"
            />
          </TouchableOpacity>
        </View>

        {carregando && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={cores.laranja} />
          </View>
        )}

        {/* ---------- Chip da região selecionada ---------- */}
        {regiao && (
          <View style={styles.chip}>
            <Ionicons name="location" size={14} color="#fff" />
            <Text style={styles.chipTexto} numberOfLines={1}>{regiao.nome}</Text>
          </View>
        )}

        {/* ---------- Instrução quando nada selecionado ---------- */}
        {!regiao && !carregando && (
          <View style={styles.instrucao}>
            <Ionicons name="finger-print-outline" size={14} color="#666" />
            <Text style={styles.instrucaoTexto}>Toque no mapa para escolher uma região</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <>
      {!telaCheia && (
        <View style={{ height: altura, borderRadius: 12, overflow: 'hidden' }}>
          {renderMapa()}
        </View>
      )}

      <Modal
        visible={telaCheia}
        animationType="slide"
        onRequestClose={() => setTelaCheia(false)}
        statusBarTranslucent
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          {telaCheia && renderMapa()}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },

  controles: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
  },
  botao: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  botaoAtivo: {
    backgroundColor: cores.laranja,
  },

  chip: {
    position: 'absolute',
    top: 10,
    left: 10,
    maxWidth: '55%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  chipTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
    flexShrink: 1,
  },

  instrucao: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  instrucaoTexto: {
    marginLeft: 6,
    fontSize: 11,
    color: '#666',
  },
});