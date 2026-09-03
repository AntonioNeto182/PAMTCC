import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const API_BASE_URL = 'http://192.168.0.127/simav_api';

const mapaHtmlBase = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body { height: 100%; margin: 0; padding: 0; }
    #map { height: 100%; width: 100%; }

    .popup-denuncia { max-width: 200px; }
    .popup-denuncia .tipo { font-weight: bold; font-size: 14px; margin: 0 0 4px; }
    .popup-denuncia .descricao { font-size: 12px; color: #444; margin: 0 0 6px; max-height: 60px; overflow-y: auto; }
    .popup-denuncia img { width: 100%; border-radius: 6px; margin-top: 4px; }

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
      position: absolute;
      bottom: 16px;
      left: 10px;
      background: rgba(255,255,255,0.95);
      border-radius: 8px;
      padding: 8px 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      font-family: sans-serif;
      z-index: 1000;
      max-width: 160px;
    }
    .legenda-zonas .item {
      display: flex;
      align-items: center;
      margin-bottom: 3px;
    }
    .legenda-zonas .swatch {
      width: 12px; height: 12px;
      border-radius: 3px;
      margin-right: 6px;
      flex-shrink: 0;
    }
    .legenda-zonas .label {
      font-size: 10px;
      color: #333;
    }
    .legenda-zonas .titulo {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 5px;
      color: #222;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <div class="legenda-zonas" id="legenda">
    <div class="titulo">Concentração de denúncias</div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const API_URL = "${API_BASE_URL}";

    const map = L.map('map', {
      tap: false,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      maxZoom: 19,
      minZoom: 3,
      bounceAtZoomLimits: false,
    }).setView([-23.5478, -46.6361], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    let marcadores = [];
    let marcadorUsuario = null;
    let posicaoUsuario = null;
    let denunciasAtuais = [];
    let exibindoDenuncias = false;

    const zonasLayer = L.layerGroup().addTo(map);

    const PALETA_CORES = [
      '#ff4b4b', '#ff9f1a', '#1a73e8', '#8e44ad',
      '#16a085', '#e91e63', '#795548', '#607d8b'
    ];

    function corPorTipo(tipo) {
      if (!tipo) return PALETA_CORES[0];
      let hash = 0;
      for (let i = 0; i < tipo.length; i++) {
        hash = tipo.charCodeAt(i) + ((hash << 5) - hash);
      }
      return PALETA_CORES[Math.abs(hash) % PALETA_CORES.length];
    }

    // ===================== PINS DE DENÚNCIA =====================

    function tamanhoPorZoom(zoom) {
      const min = 24;
      const max = 48;
      const escala = (zoom - map.getMinZoom()) / (map.getMaxZoom() - map.getMinZoom());
      return Math.round(max - escala * (max - min));
    }

    function criarIcone(tamanho, cor) {
      const largura = tamanho;
      const altura = Math.round(tamanho * 1.4);

      const svg =
        '<svg width="' + largura + '" height="' + altura + '" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M12 0C5.4 0 0 5.6 0 12.4 0 21 12 34 12 34S24 21 24 12.4C24 5.6 18.6 0 12 0Z" fill="' + cor + '" stroke="#fff" stroke-width="1.5"/>' +
        '<circle cx="12" cy="12" r="5" fill="#fff"/>' +
        '</svg>';

      return L.divIcon({
        className: '',
        html: svg,
        iconSize: [largura, altura],
        iconAnchor: [largura / 2, altura],
        popupAnchor: [0, -altura],
      });
    }

    function iconeUsuario() {
      return L.divIcon({
        className: '',
        html: '<div class="pin-usuario"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
    }

    function atualizarTamanhoDosMarcadores() {
      const tamanho = tamanhoPorZoom(map.getZoom());
      marcadores.forEach(m => m.setIcon(criarIcone(tamanho, m.corTipo)));
    }

    function montarHtmlPopup(d) {
      let html = '<div class="popup-denuncia">';
      html += '<p class="tipo" style="color:' + corPorTipo(d.tipo) + '">' + (d.tipo || 'Sem tipo') + '</p>';
      html += '<p class="descricao">' + (d.descricao && d.descricao.length ? d.descricao : 'Sem descrição informada') + '</p>';

      if (d.imagem) {
        html += '<img src="' + API_URL + '/uploads/' + d.imagem + '" />';
      }

      html += '</div>';
      return html;
    }

    function limparMarcadores() {
      marcadores.forEach(m => map.removeLayer(m));
      marcadores = [];
    }

    function desenharMarcadores(denuncias) {
      limparMarcadores();
      const tamanhoAtual = tamanhoPorZoom(map.getZoom());

      denuncias.forEach(d => {
        const cor = corPorTipo(d.tipo);
        const marcador = L.marker([d.latitude, d.longitude], {
          icon: criarIcone(tamanhoAtual, cor),
        }).addTo(map);

        marcador.corTipo = cor;
        marcador.bindPopup(montarHtmlPopup(d));
        marcadores.push(marcador);
      });
    }

    // ===================== ZONAS DE DENSIDADE =====================

    // Escala de classificação: [limiteSuperior, corRGB, rótulo]
    const ESCALA = [
      { max: 5,        cor: [76, 175, 80],   label: 'Baixa concentração' },
      { max: 15,       cor: [255, 213, 79],  label: 'Concentração moderada' },
      { max: 30,       cor: [255, 152, 0],   label: 'Alta concentração' },
      { max: 50,       cor: [244, 67, 54],   label: 'Concentração muito alta' },
      { max: Infinity, cor: [142, 36, 170],  label: 'Área crítica' },
    ];

    const TETO_VISUAL = 70; // acima disso, cor já satura totalmente no roxo

    function classificar(densidade) {
      for (let i = 0; i < ESCALA.length; i++) {
        if (densidade <= ESCALA[i].max) return ESCALA[i];
      }
      return ESCALA[ESCALA.length - 1];
    }

    // Interpolação contínua de cor ao longo da escala, para transição progressiva
    function corInterpolada(densidade) {
      const pontos = [0, 5, 15, 30, 50, TETO_VISUAL];
      const cores = [ESCALA[0].cor, ESCALA[0].cor, ESCALA[1].cor, ESCALA[2].cor, ESCALA[3].cor, ESCALA[4].cor];

      const d = Math.min(densidade, TETO_VISUAL);

      for (let i = 0; i < pontos.length - 1; i++) {
        if (d >= pontos[i] && d <= pontos[i + 1]) {
          const t = (pontos[i + 1] - pontos[i]) === 0 ? 0 : (d - pontos[i]) / (pontos[i + 1] - pontos[i]);
          const c1 = cores[i];
          const c2 = cores[i + 1];
          const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
          const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
          const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
          return 'rgb(' + r + ',' + g + ',' + b + ')';
        }
      }
      const ultima = cores[cores.length - 1];
      return 'rgb(' + ultima[0] + ',' + ultima[1] + ',' + ultima[2] + ')';
    }

    // Tamanho da célula da grade (em metros), menor conforme o zoom aumenta
    function tamanhoCelulaMetros(zoom) {
      const base = 4000; // metros, referência no zoom 12
      const escala = Math.pow(2, zoom - 12);
      let tamanho = base / escala;
      return Math.max(60, Math.min(4000, tamanho));
    }

    function limparZonas() {
      zonasLayer.clearLayers();
    }

    function calcularZonas(denuncias) {
      if (denuncias.length < 2) return [];

      const zoom = map.getZoom();
      const cellM = tamanhoCelulaMetros(zoom);

      const centerLat = map.getCenter().lat;
      const mPorGrauLat = 111320;
      const mPorGrauLng = 111320 * Math.cos(centerLat * Math.PI / 180);

      const cellDegLat = cellM / mPorGrauLat;
      const cellDegLng = cellM / mPorGrauLng;

      const grade = {};

      denuncias.forEach(d => {
        const cx = Math.floor(d.longitude / cellDegLng);
        const cy = Math.floor(d.latitude / cellDegLat);
        const chave = cx + '_' + cy;

        if (!grade[chave]) grade[chave] = { cx, cy, itens: [] };
        grade[chave].itens.push(d);
      });

      const areaM2 = cellM * cellM;
      const areaUnidades = areaM2 / 10000; // densidade por 10.000 m²

      const zonas = [];

      Object.values(grade).forEach(cel => {
        if (cel.itens.length < 2) return; // zona só existe com 2+ denúncias próximas

        const densidade = cel.itens.length / areaUnidades;

        const sul = cel.cy * cellDegLat;
        const norte = sul + cellDegLat;
        const oeste = cel.cx * cellDegLng;
        const leste = oeste + cellDegLng;

        zonas.push({
          bounds: [[sul, oeste], [norte, leste]],
          count: cel.itens.length,
          densidade,
          areaM2,
        });
      });

      return zonas;
    }

    function desenharZonas() {
      limparZonas();

      if (!exibindoDenuncias || denunciasAtuais.length < 2) return;

      const zonas = calcularZonas(denunciasAtuais);

      zonas.forEach(zona => {
        const cor = corInterpolada(zona.densidade);
        const classe = classificar(zona.densidade);

        // Opacidade também progressiva, mais intensa quanto maior a densidade
        const opacidade = Math.min(0.75, 0.25 + (zona.densidade / TETO_VISUAL) * 0.5);

        const retangulo = L.rectangle(zona.bounds, {
          color: cor,
          weight: 1,
          fillColor: cor,
          fillOpacity: opacidade,
          stroke: false,
        }).addTo(zonasLayer);

        const areaTexto = zona.areaM2 >= 1000000
          ? (zona.areaM2 / 1000000).toFixed(2) + ' km²'
          : Math.round(zona.areaM2) + ' m²';

        const html =
          '<div class="popup-zona">' +
          '<p class="titulo">' + classe.label + '</p>' +
          '<p class="linha">Denúncias na área: ' + zona.count + '</p>' +
          '<p class="linha">Densidade: ' + zona.densidade.toFixed(1) + ' / 10.000 m²</p>' +
          '<p class="linha">Área analisada: ' + areaTexto + '</p>' +
          '</div>';

        retangulo.bindPopup(html);
      });
    }

    function montarLegenda() {
      const legenda = document.getElementById('legenda');
      let html = '<div class="titulo">Concentração de denúncias</div>';

      ESCALA.forEach(nivel => {
        const cor = 'rgb(' + nivel.cor[0] + ',' + nivel.cor[1] + ',' + nivel.cor[2] + ')';
        html += '<div class="item"><div class="swatch" style="background:' + cor + '"></div>' +
          '<div class="label">' + nivel.label + '</div></div>';
      });

      legenda.innerHTML = html;
    }

    montarLegenda();

    // ===================== FUNÇÕES CHAMADAS PELO REACT NATIVE =====================

    function atualizarMarcadores(denuncias) {
      denunciasAtuais = denuncias;
      exibindoDenuncias = true;
      desenharMarcadores(denuncias);
      desenharZonas();

      const legenda = document.getElementById('legenda');
      legenda.style.display = 'block';
    }

    function ocultarMarcadores() {
      exibindoDenuncias = false;
      denunciasAtuais = [];
      limparMarcadores();
      limparZonas();

      const legenda = document.getElementById('legenda');
      legenda.style.display = 'none';
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

      if (centralizar) {
        map.setView(posicaoUsuario, 16);
      }
    }

    function recentralizarNoUsuario() {
      if (!posicaoUsuario) return;
      map.flyTo(posicaoUsuario, 16, { duration: 1.2 });
    }

    // ===================== EVENTOS DO MAPA =====================

    let debounceZoom = null;

    function recalcularNoZoomOuMovimento() {
      atualizarTamanhoDosMarcadores();

      if (debounceZoom) clearTimeout(debounceZoom);
      debounceZoom = setTimeout(() => {
        desenharZonas();
      }, 150);
    }

    map.on('zoomend', recalcularNoZoomOuMovimento);
    map.on('moveend', function () {
      if (debounceZoom) clearTimeout(debounceZoom);
      debounceZoom = setTimeout(() => {
        desenharZonas();
      }, 150);
    });
  </script>
</body>
</html>
`;

export default function Mapa({ mostrarDenuncias }) {
  const webviewRef = useRef(null);
  const carregadoRef = useRef(false);
  const [localizacaoPronta, setLocalizacaoPronta] = useState(false);

  async function pedirLocalizacaoECentralizar(centralizar) {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.warn('Permissão de localização negada.');
      return;
    }

    try {
      const posicao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      webviewRef.current?.injectJavaScript(`
        definirLocalizacaoUsuario(${posicao.coords.latitude}, ${posicao.coords.longitude}, ${centralizar});
        true;
      `);

      setLocalizacaoPronta(true);
    } catch (erro) {
      console.error('Erro ao obter localização:', erro);
    }
  }

  async function buscarEExibirDenuncias() {
    try {
      const resposta = await fetch(`${API_BASE_URL}/denuncias/listar_mapa.php`);
      const denuncias = await resposta.json();

      webviewRef.current?.injectJavaScript(`
        atualizarMarcadores(${JSON.stringify(denuncias)});
        true;
      `);
    } catch (erro) {
      console.error('Erro ao buscar denúncias:', erro);
    }
  }

  function ocultarDenuncias() {
    webviewRef.current?.injectJavaScript(`
      ocultarMarcadores();
      true;
    `);
  }

  function recentralizar() {
    webviewRef.current?.injectJavaScript(`
      recentralizarNoUsuario();
      true;
    `);
  }

  useEffect(() => {
    if (!carregadoRef.current) return;

    if (mostrarDenuncias) {
      buscarEExibirDenuncias();
    } else {
      ocultarDenuncias();
    }
  }, [mostrarDenuncias]);

  useFocusEffect(
    useCallback(() => {
      if (carregadoRef.current && mostrarDenuncias) {
        buscarEExibirDenuncias();
      }
    }, [mostrarDenuncias])
  );

  function handleLoadEnd() {
    carregadoRef.current = true;
    pedirLocalizacaoECentralizar(true);

    if (mostrarDenuncias) {
      buscarEExibirDenuncias();
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        source={{ html: mapaHtmlBase }}
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={handleLoadEnd}
      />

      {localizacaoPronta && (
        <TouchableOpacity style={styles.botaoRecentralizar} onPress={recentralizar}>
          <Ionicons name="locate" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

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