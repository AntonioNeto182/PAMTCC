import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import api from '../services/api';
import { mensagemDeErro, votar } from '../services/denuncias';
import { PINS_CSS, PINS_JS } from './mapaPins';

const CENTRO_REGISTRO = [-24.4979, -47.8447];
const TEMPO_MAX_GPS_MS = 5000;
const ATRASO_REVELAR_MS = 350;

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

    /* ---------- Legenda colapsável ---------- */
    .legenda-wrap {
      position: absolute; bottom: 16px; left: 10px;
      z-index: 1000; font-family: sans-serif;
      display: none;
    }
    .legenda-painel {
      background: rgba(255,255,255,0.95);
      border-radius: 8px; padding: 8px 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      max-width: 170px;
      margin-bottom: 6px;
    }
    .legenda-wrap.colapsada .legenda-painel { display: none; }
    .legenda-painel .titulo { font-size: 11px; font-weight: bold; margin-bottom: 5px; color: #222; }
    .legenda-painel .item { display: flex; align-items: center; margin-bottom: 3px; }
    .legenda-painel .swatch { width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; flex-shrink: 0; }
    .legenda-painel .label { font-size: 10px; color: #333; }
    .legenda-painel .nota { font-size: 9px; color: #777; margin-top: 4px; }

    .legenda-toggle {
      width: 38px; height: 38px;
      border-radius: 19px;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: 15px; font-weight: bold; color: #ff4b4b;
      user-select: none;
      transition: transform 0.15s;
    }
    .legenda-toggle:active { transform: scale(0.92); }

    ${PINS_CSS}
  </style>
</head>
<body>
  <div id="map"></div>

  <div class="legenda-wrap colapsada" id="legenda-wrap">
    <div class="legenda-painel" id="legenda"></div>
    <div class="legenda-toggle" id="legenda-toggle">
      <span id="legenda-icone">▲</span>
    </div>
  </div>

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
    let denunciasCache = [];
    let statusVisiveis = null;
    // Texto de busca aplicado (já normalizado). Vazio = sem filtro textual.
    let buscaTexto = '';

    const zonasLayer = L.layerGroup().addTo(map);

    function iconeUsuario() {
      return L.divIcon({
        className: '',
        html: '<div class="pin-usuario"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
    }

    // ===================== LEGENDA COLAPSÁVEL =====================

    let legendaExpandida = false;

    function alternarLegenda() {
      legendaExpandida = !legendaExpandida;
      const wrap = document.getElementById('legenda-wrap');
      const icone = document.getElementById('legenda-icone');
      if (legendaExpandida) {
        wrap.classList.remove('colapsada');
        icone.textContent = '▼';
      } else {
        wrap.classList.add('colapsada');
        icone.textContent = '▲';
      }
    }

    document.getElementById('legenda-toggle').addEventListener('click', alternarLegenda);

    // ===================== PINS =====================

    function atualizarTamanhoDosMarcadores() {
      const tamanho = tamanhoPorZoom(map.getZoom());
      marcadores.forEach(function (m) { reiconarMarcador(m, tamanho); });
    }

    function atualizarVisibilidadePins() {
      const mostrarPins = map.getZoom() >= CFG.zoomMinimoPins;

      marcadores.forEach(function (m) {
        const estaNoMapa = map.hasLayer(m);
        if (mostrarPins && !estaNoMapa) m.addTo(map);
        if (!mostrarPins && estaNoMapa) map.removeLayer(m);
      });
    }

    function normalizar(t) {
      return String(t == null ? '' : t)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }

    function passaFiltro(d) {
      if (statusVisiveis !== null && statusVisiveis.indexOf(d.status) === -1) return false;

      if (buscaTexto.length > 0) {
        const alvo = normalizar(
          [d.endereco, d.bairro, d.cidade, d.autor, d.tipo]
            .filter(Boolean)
            .join(' ')
        );
        if (alvo.indexOf(buscaTexto) === -1) return false;
      }

      return true;
    }

    function limparMarcadores() {
      marcadores.forEach(function (m) { map.removeLayer(m); });
      marcadores = [];
    }

    function desenharMarcadores(denuncias) {
      limparMarcadores();
      const tamanho = tamanhoPorZoom(map.getZoom());

      denuncias
        .filter(passaFiltro)
        .forEach(function (d) {
          marcadores.push(criarMarcador(d, tamanho).addTo(map));
        });
    }

    // ===================== FOCO =====================

    function aplicarFoco() {
      if (!focoPendente || !dadosCarregados) return;

      const f = focoPendente;
      focoPendente = null;

      const alvo = marcadores.find(function (m) {
        return m.denuncia && m.denuncia.id_denuncia === f.id;
      });

      map.setView([f.latitude, f.longitude], CFG.zoomFoco, { animate: false });
      atualizarVisibilidadePins();

      if (alvo) alvo.openPopup();
    }

    function definirFoco(foco) {
      focoPendente = foco;
      aplicarFoco();
    }

    // ===================== ZONAS =====================

    function nivelPara(qtd) {
      return CFG.niveis.find(function (n) { return qtd >= n.min; }) || null;
    }

    function raioAgrupamentoAtual() {
      const zoom = map.getZoom();
      if (zoom >= 14) return CFG.raioZonaMetros;
      if (zoom >= 12) return CFG.raioZonaMetros * 4;
      if (zoom >= 10) return CFG.raioZonaMetros * 20;
      if (zoom >= 8)  return CFG.raioZonaMetros * 80;
      return CFG.raioZonaMetros * 300;
    }

    function agrupar(denuncias, raio) {
      const zonas = [];

      denuncias.forEach(function (d) {
        const ponto = L.latLng(d.latitude, d.longitude);
        let melhor = null;
        let menor = Infinity;

        zonas.forEach(function (z) {
          const dist = map.distance(z.centro, ponto);
          if (dist <= raio && dist < menor) { melhor = z; menor = dist; }
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

    function ajustarRaios(raio) {
      const metrosPorPx = 156543.03392 * Math.cos(map.getCenter().lat * Math.PI / 180) / Math.pow(2, map.getZoom());
      const minimo = CFG.raioMinimoPx * metrosPorPx;
      circulos.forEach(function (c) { c.setRadius(Math.max(raio, minimo)); });
    }

    function desenharZonas(denuncias) {
      limparZonas();

      const ativas = denuncias.filter(function (d) {
        return CFG.statusIgnorados.indexOf(d.status) === -1 && passaFiltro(d);
      });

      const raio = raioAgrupamentoAtual();
      const mostrandoApenasZonas = map.getZoom() < CFG.zoomMinimoPins;

      agrupar(ativas, raio).forEach(function (zona) {
        const nivel = nivelPara(zona.itens.length);
        if (!nivel) return;

        const circulo = L.circle(zona.centro, {
          radius: raio,
          color: nivel.cor,
          fillColor: nivel.cor,
          fillOpacity: 0.35,
          weight: 2,
        }).addTo(zonasLayer);

        const rotuloQtd = mostrandoApenasZonas ? 'Denúncias na região' : 'Denúncias na área';

        const html =
          '<div class="popup-zona">' +
          '<p class="titulo">' + escapar(nivel.rotulo) + '</p>' +
          '<p class="linha">' + rotuloQtd + ': ' + zona.itens.length + '</p>' +
          '<p class="linha">Raio: ' + Math.round(raio) + ' m</p>' +
          '</div>';

        circulo.bindPopup(html);
        circulos.push(circulo);
      });

      ajustarRaios(raio);
    }

    function montarLegenda() {
      const minimo = CFG.niveis[CFG.niveis.length - 1].min;
      let html = '<div class="titulo">Concentração de denúncias</div>';

      CFG.niveis.slice().reverse().forEach(function (nivel) {
        html += '<div class="item"><div class="swatch" style="background:' + nivel.cor + '"></div>' +
          '<div class="label">' + escapar(nivel.rotulo) + '</div></div>';
      });

      html += '<div class="nota">Zona: ' + minimo + '+ denúncias. Afaste o mapa para ver a concentração regional.</div>';
      document.getElementById('legenda').innerHTML = html;
    }

    montarLegenda();

    // ===================== FUNÇÕES CHAMADAS PELO REACT NATIVE =====================

    function atualizarMarcadores(denuncias) {
      denunciasCache = denuncias;
      desenharMarcadores(denuncias);
      atualizarVisibilidadePins();
      desenharZonas(denuncias);
      document.getElementById('legenda-wrap').style.display = 'block';
      dadosCarregados = true;
      aplicarFoco();

      // Reaplica busca e status (o cache acabou de ser trocado)
      const visiveis = denuncias.filter(passaFiltro).length;
      avisar({ tipo: 'busca_resultado', total: visiveis });
    }

    function ocultarMarcadores() {
      dadosCarregados = false;
      denunciasCache = [];
      limparMarcadores();
      limparZonas();
      document.getElementById('legenda-wrap').style.display = 'none';
    }

    function definirStatusVisiveis(nomes) {
      statusVisiveis = nomes;
      if (!dadosCarregados || denunciasCache.length === 0) return;

      desenharMarcadores(denunciasCache);
      atualizarVisibilidadePins();
      desenharZonas(denunciasCache);
    }

    function definirBusca(texto) {
      buscaTexto = normalizar(texto).trim();

      if (!dadosCarregados || denunciasCache.length === 0) {
        avisar({ tipo: 'busca_resultado', total: 0 });
        return;
      }

      desenharMarcadores(denunciasCache);
      atualizarVisibilidadePins();
      desenharZonas(denunciasCache);

      // Reporta quantas denúncias sobraram (pins visíveis com filtro aplicado)
      const visiveis = denunciasCache.filter(passaFiltro).length;
      avisar({ tipo: 'busca_resultado', total: visiveis });
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

    map.on('zoomend', function () {
      atualizarTamanhoDosMarcadores();
      atualizarVisibilidadePins();

      if (denunciasCache.length > 0) {
        desenharZonas(denunciasCache);
      }
    });
  </script>
</body>
</html>
`;

const comTimeout = (promessa, ms) =>
  Promise.race([promessa, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

export default function Mapa({
  mostrarDenuncias,
  focar = null,
  statusFiltro = null,
  busca = '',
  podeModerar = false,
  onModerar = null,
  onDetalhes = null,
  onBuscaResultado = null,
}) {
  const webviewRef = useRef(null);
  const carregadoRef = useRef(false);
  const posicaoRef = useRef(null);
  const focarRef = useRef(focar);
  focarRef.current = focar;

  const html = useRef(gerarHtml({
    apiUrl: api.defaults.baseURL,
    podeModerar,
    raioZonaMetros: 150,
    zoomMinimoPins: 13,
    raioMinimoPx: 8,
    zoomFoco: 17,
    statusIgnorados: ['resolvida', 'rejeitada'],
    niveis: [
      { min: 16, cor: '#8e24aa', rotulo: 'Área crítica' },
      { min: 11, cor: '#f44336', rotulo: 'Concentração muito alta' },
      { min: 7, cor: '#ff9800', rotulo: 'Alta concentração' },
      { min: 4, cor: '#ffd54f', rotulo: 'Concentração moderada' },
      { min: 2, cor: '#4caf50', rotulo: 'Baixa concentração' },
    ],
  })).current;

  const [webviewPronto, setWebviewPronto] = useState(false);
  const [gpsResolvido, setGpsResolvido] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const [localizacaoPronta, setLocalizacaoPronta] = useState(false);

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

  useEffect(() => {
    if (!webviewPronto || !gpsResolvido) return;

    const coords = posicaoRef.current;

    if (coords) {
      const centralizar = !focarRef.current;
      webviewRef.current?.injectJavaScript(
        `definirLocalizacaoUsuario(${Number(coords.latitude)}, ${Number(coords.longitude)}, ${centralizar}); true;`
      );
      setLocalizacaoPronta(true);
    }

    const t = setTimeout(() => setVisivel(true), ATRASO_REVELAR_MS);

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

  useEffect(() => {
    if (!carregadoRef.current) return;
    const json = statusFiltro === null ? 'null' : JSON.stringify(statusFiltro);
    webviewRef.current?.injectJavaScript(`definirStatusVisiveis(${json}); true;`);
  }, [statusFiltro]);

  useEffect(() => {
    if (!carregadoRef.current) return;
    webviewRef.current?.injectJavaScript(`definirBusca(${JSON.stringify(busca)}); true;`);
  }, [busca]);

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

  async function tratarVoto(id) {
    try {
      const resposta = await votar(id);
      webviewRef.current?.injectJavaScript(
        `atualizarDenuncia(${Number(id)}, ${JSON.stringify({
          votos: resposta.votos,
          votou: resposta.votou,
        })}); true;`
      );
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível registrar o voto.'));
      // Reabilita o botão Up (patch vazio = só reconstrói o popup)
      webviewRef.current?.injectJavaScript(`atualizarDenuncia(${Number(id)}, {}); true;`);
    }
  }

  function handleMessage(event) {
    try {
      const dados = JSON.parse(event.nativeEvent.data);

      switch (dados.tipo) {
        case 'moderar':
          if (onModerar) onModerar(Number(dados.id_denuncia));
          return;

        case 'detalhes':
          if (onDetalhes) onDetalhes(Number(dados.id_denuncia));
          return;

        case 'votar':
          tratarVoto(Number(dados.id_denuncia));
          return;

        case 'busca_resultado':
          if (onBuscaResultado) onBuscaResultado(Number(dados.total));
          return;
      }
    } catch (erro) {
      console.error('Erro ao processar mensagem do mapa:', erro);
    }
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

    const json = statusFiltro === null ? 'null' : JSON.stringify(statusFiltro);
    webviewRef.current?.injectJavaScript(`definirStatusVisiveis(${json}); true;`);
    webviewRef.current?.injectJavaScript(`definirBusca(${JSON.stringify(busca)}); true;`);
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
        onMessage={handleMessage}
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