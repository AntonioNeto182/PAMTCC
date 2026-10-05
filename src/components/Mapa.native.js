import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import api from '../services/api';
import { PINS_CSS, PINS_JS } from './mapaPins';

const CENTRO_REGISTRO = [-24.4979, -47.8447];
const TEMPO_MAX_GPS_MS = 5000;
const ATRASO_REVELAR_MS = 350;

const CONFIG = {
  apiUrl: api.defaults.baseURL,
  // Raio geográfico (m) da zona. Fixo: não depende do zoom, então zonas não se fundem ao afastar.
  raioZonaMetros: 150,
  // Tamanho mínimo do círculo na tela (px), para continuar visível com zoom afastado.
  raioMinimoPx: 8,
  // Zoom aplicado ao focar uma denúncia vinda do perfil.
  zoomFoco: 17,
  // Status que não contam para as zonas (os pins continuam aparecendo).
  statusIgnorados: ['resolvida', 'rejeitada'],
  // Quantidade MÍNIMA de denúncias por nível, em ordem decrescente.
  // O menor "min" também é o mínimo para a zona existir.
  niveis: [
    { min: 16, cor: '#8e24aa', rotulo: 'Área crítica' },
    { min: 11, cor: '#f44336', rotulo: 'Concentração muito alta' },
    { min: 7, cor: '#ff9800', rotulo: 'Alta concentração' },
    { min: 4, cor: '#ffd54f', rotulo: 'Concentração moderada' },
    { min: 2, cor: '#4caf50', rotulo: 'Baixa concentração' },
  ],
};

const gerarHtml = (config) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body { height: 100%; margin: 0; padding: 0; }
    #map { height: 100%; width: 100%; }

    .popup-zona .titulo { font-weight: bold; font-size: 13px; margin: 0 0 4px; }
    .popup-zona .linha { font-size: 12px; color: #444; margin: 0; }

    .pin-usuario {
      width: 20px; height: 20px;
      background: #1a73e8;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(26,115,232,0.3);
    }

    .legenda-zonas {
      position: absolute; bottom: 16px; left: 10px;
      background: rgba(255,255,255,0.95);
      border-radius: 8px; padding: 8px 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      font-family: sans-serif; z-index: 1000; max-width: 170px;
      display: none;
    }
    .legenda-zonas .titulo { font-size: 11px; font-weight: bold; margin-bottom: 5px; color: #222; }
    .legenda-zonas .item { display: flex; align-items: center; margin-bottom: 3px; }
    .legenda-zonas .swatch { width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; flex-shrink: 0; }
    .legenda-zonas .label { font-size: 10px; color: #333; }
    .legenda-zonas .nota { font-size: 9px; color: #777; margin-top: 4px; }

    ${PINS_CSS}
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="legenda-zonas" id="legenda"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const CFG = ${JSON.stringify(config)};

    const map = L.map('map', {
      tap: false,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      maxZoom: 19,
      minZoom: 3,
      bounceAtZoomLimits: false,
    }).setView(${JSON.stringify(CENTRO_REGISTRO)}, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    ${PINS_JS}

    let marcadores = [];
    let circulos = [];
    let marcadorUsuario = null;
    let posicaoUsuario = null;
    let dadosCarregados = false;
    let focoPendente = null;

    const zonasLayer = L.layerGroup().addTo(map);

    function iconeUsuario() {
      return L.divIcon({
        className: '',
        html: '<div class="pin-usuario"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
    }

    // ===================== PINS (AGRUPADOS POR LOCAL) =====================

    function atualizarTamanhoDosMarcadores() {
      const tamanho = tamanhoPorZoom(map.getZoom());
      marcadores.forEach(function (m) { reiconarMarcador(m, tamanho); });
    }

    function limparMarcadores() {
      marcadores.forEach(function (m) { map.removeLayer(m); });
      marcadores = [];
    }

    function desenharMarcadores(denuncias) {
      limparMarcadores();
      const tamanho = tamanhoPorZoom(map.getZoom());

      agruparPorLocal(denuncias).forEach(function (grupo) {
        marcadores.push(criarMarcadorGrupo(grupo, tamanho, null).addTo(map));
      });
    }

    // ===================== FOCO EM UMA DENÚNCIA =====================

    // Só aplica depois que os pins foram desenhados; antes disso fica pendente.
    function aplicarFoco() {
      if (!focoPendente || !dadosCarregados) return;

      const f = focoPendente;
      focoPendente = null;

      const alvo = marcadores.find(function (m) {
        return m.grupo.itens.some(function (i) { return i.id_denuncia === f.id; });
      });

      map.setView([f.latitude, f.longitude], CFG.zoomFoco, { animate: false });
      if (alvo) alvo.openPopup();
    }

    function definirFoco(foco) {
      focoPendente = foco;
      aplicarFoco();
    }

    // ===================== ZONAS (CÍRCULOS) =====================

    function nivelPara(qtd) {
      return CFG.niveis.find(function (n) { return qtd >= n.min; }) || null;
    }

    // Agrupamento por distância em metros: o resultado não depende do zoom.
    // Cada denúncia (inclusive corroborações) conta para a zona.
    function agrupar(denuncias) {
      const zonas = [];

      denuncias.forEach(function (d) {
        const ponto = L.latLng(d.latitude, d.longitude);
        let melhor = null;
        let menor = Infinity;

        zonas.forEach(function (z) {
          const dist = map.distance(z.centro, ponto);
          if (dist <= CFG.raioZonaMetros && dist < menor) { melhor = z; menor = dist; }
        });

        if (melhor) {
          melhor.itens.push(d);
          const n = melhor.itens.length;
          melhor.centro = L.latLng(
            melhor.centro.lat + (ponto.lat - melhor.centro.lat) / n,
            melhor.centro.lng + (ponto.lng - melhor.centro.lng) / n
          );
        } else {
          zonas.push({ centro: ponto, itens: [d] });
        }
      });

      return zonas;
    }

    function limparZonas() {
      zonasLayer.clearLayers();
      circulos = [];
    }

    function ajustarRaios() {
      const metrosPorPx = 156543.03392 * Math.cos(map.getCenter().lat * Math.PI / 180) / Math.pow(2, map.getZoom());
      const minimo = CFG.raioMinimoPx * metrosPorPx;
      circulos.forEach(function (c) { c.setRadius(Math.max(CFG.raioZonaMetros, minimo)); });
    }

    function desenharZonas(denuncias) {
      limparZonas();

      const ativas = denuncias.filter(function (d) {
        return CFG.statusIgnorados.indexOf(d.status) === -1;
      });

      agrupar(ativas).forEach(function (zona) {
        const nivel = nivelPara(zona.itens.length);
        if (!nivel) return;

        const circulo = L.circle(zona.centro, {
          radius: CFG.raioZonaMetros,
          color: nivel.cor,
          fillColor: nivel.cor,
          fillOpacity: 0.35,
          weight: 2,
        }).addTo(zonasLayer);

        const html =
          '<div class="popup-zona">' +
          '<p class="titulo">' + escapar(nivel.rotulo) + '</p>' +
          '<p class="linha">Denúncias na área: ' + zona.itens.length + '</p>' +
          '<p class="linha">Raio: ' + CFG.raioZonaMetros + ' m</p>' +
          '</div>';

        circulo.bindPopup(html);
        circulos.push(circulo);
      });

      ajustarRaios();
    }

    function montarLegenda() {
      const minimo = CFG.niveis[CFG.niveis.length - 1].min;
      let html = '<div class="titulo">Concentração de denúncias</div>';

      CFG.niveis.slice().reverse().forEach(function (nivel) {
        html += '<div class="item"><div class="swatch" style="background:' + nivel.cor + '"></div>' +
          '<div class="label">' + escapar(nivel.rotulo) + '</div></div>';
      });

      html += '<div class="nota">Zona: ' + minimo + '+ denúncias em ' + CFG.raioZonaMetros + ' m</div>';
      document.getElementById('legenda').innerHTML = html;
    }

    montarLegenda();

    // ===================== FUNÇÕES CHAMADAS PELO REACT NATIVE =====================

    function atualizarMarcadores(denuncias) {
      desenharMarcadores(denuncias);
      desenharZonas(denuncias);
      document.getElementById('legenda').style.display = 'block';
      dadosCarregados = true;
      aplicarFoco();
    }

    function ocultarMarcadores() {
      dadosCarregados = false;
      limparMarcadores();
      limparZonas();
      document.getElementById('legenda').style.display = 'none';
    }

    function definirLocalizacaoUsuario(lat, lng, centralizar) {
      posicaoUsuario = [lat, lng];

      if (marcadorUsuario) {
        marcadorUsuario.setLatLng(posicaoUsuario);
      } else {
        marcadorUsuario = L.marker(posicaoUsuario, {
          icon: iconeUsuario(),
          zIndexOffset: 1000,
        }).addTo(map);
      }

      if (centralizar) map.setView(posicaoUsuario, 16);
    }

    function recentralizarNoUsuario() {
      if (!posicaoUsuario) return;
      map.flyTo(posicaoUsuario, 16, { duration: 1.2 });
    }

    // ===================== EVENTOS DO MAPA =====================

    map.on('zoomend', function () {
      atualizarTamanhoDosMarcadores();
      ajustarRaios();
    });
  </script>
</body>
</html>
`;

const comTimeout = (promessa, ms) =>
  Promise.race([promessa, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

export default function Mapa({ mostrarDenuncias, focar = null }) {
  const webviewRef = useRef(null);
  const carregadoRef = useRef(false);
  const posicaoRef = useRef(null);
  const focarRef = useRef(focar);
  focarRef.current = focar;

  const html = useRef(gerarHtml(CONFIG)).current;

  const [webviewPronto, setWebviewPronto] = useState(false);
  const [gpsResolvido, setGpsResolvido] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const [localizacaoPronta, setLocalizacaoPronta] = useState(false);

  // GPS começa já na montagem, em paralelo ao carregamento do WebView
  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const ultima = await Location.getLastKnownPositionAsync();
        if (ultima) {
          posicaoRef.current = ultima.coords;
          return;
        }

        const atual = await comTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          TEMPO_MAX_GPS_MS
        );
        if (atual) posicaoRef.current = atual.coords;
      } catch (erro) {
        console.error('Erro ao obter localização:', erro);
      } finally {
        if (ativo) setGpsResolvido(true);
      }
    })();

    return () => {
      ativo = false;
    };
  }, []);

  // Só revela o mapa quando WebView e GPS estão prontos: sem "pulo" de posição
  useEffect(() => {
    if (!webviewPronto || !gpsResolvido) return;

    const coords = posicaoRef.current;

    if (coords) {
      // Com foco definido, o GPS não pode recentralizar o mapa por cima dele
      const centralizar = !focarRef.current;
      webviewRef.current?.injectJavaScript(
        `definirLocalizacaoUsuario(${Number(coords.latitude)}, ${Number(coords.longitude)}, ${centralizar}); true;`
      );
      setLocalizacaoPronta(true);
    }

    const t = setTimeout(() => setVisivel(true), ATRASO_REVELAR_MS);

    // Refina a posição em segundo plano, sem mover a câmera
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then(({ coords: precisa }) => {
        posicaoRef.current = precisa;
        webviewRef.current?.injectJavaScript(
          `definirLocalizacaoUsuario(${Number(precisa.latitude)}, ${Number(precisa.longitude)}, false); true;`
        );
        setLocalizacaoPronta(true);
      })
      .catch(() => {});

    return () => clearTimeout(t);
  }, [webviewPronto, gpsResolvido]);

  const buscarEExibirDenuncias = useCallback(async () => {
    try {
      const { data } = await api.get('/denuncias/listar_mapa.php');

      webviewRef.current?.injectJavaScript(`
        atualizarMarcadores(${JSON.stringify(data)});
        true;
      `);
    } catch (erro) {
      console.error('Erro ao buscar denúncias:', erro);
    }
  }, []);

  const ocultarDenuncias = useCallback(() => {
    webviewRef.current?.injectJavaScript('ocultarMarcadores(); true;');
  }, []);

  const injetarFoco = useCallback(() => {
    const f = focarRef.current;
    if (!f || !carregadoRef.current) return;

    const foco = {
      id: Number(f.id),
      latitude: Number(f.latitude),
      longitude: Number(f.longitude),
    };

    webviewRef.current?.injectJavaScript(`definirFoco(${JSON.stringify(foco)}); true;`);
  }, []);

  function recentralizar() {
    webviewRef.current?.injectJavaScript('recentralizarNoUsuario(); true;');
  }

  useEffect(() => {
    if (!carregadoRef.current) return;

    if (mostrarDenuncias) buscarEExibirDenuncias();
    else ocultarDenuncias();
  }, [mostrarDenuncias, buscarEExibirDenuncias, ocultarDenuncias]);

  useEffect(() => {
    injetarFoco();
  }, [focar?.ts, injetarFoco]);

  useFocusEffect(
    useCallback(() => {
      if (carregadoRef.current && mostrarDenuncias) buscarEExibirDenuncias();
    }, [mostrarDenuncias, buscarEExibirDenuncias])
  );

  function handleLoadEnd() {
    carregadoRef.current = true;
    setWebviewPronto(true);

    if (mostrarDenuncias) buscarEExibirDenuncias();
    injetarFoco();
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.container}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={handleLoadEnd}
      />

      {!visivel && (
        <View style={styles.carregandoMapa}>
          <ActivityIndicator size="large" color="#ff4b4b" />
        </View>
      )}

      {visivel && localizacaoPronta && (
        <TouchableOpacity style={styles.botaoRecentralizar} onPress={recentralizar}>
          <Ionicons name="locate" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  carregandoMapa: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f6f6f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoRecentralizar: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ff4b4b',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});