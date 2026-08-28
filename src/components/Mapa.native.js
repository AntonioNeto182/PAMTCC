import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

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
    .popup-denuncia .carregando { font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    // tap:false evita o bug do Leaflet que trava o toque em marcadores
    // após um gesto de pinça (zoom) em WebViews mobile.
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

    const marcadores = [];

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

    function atualizarTamanhoDosMarcadores() {
      const tamanho = tamanhoPorZoom(map.getZoom());
      marcadores.forEach(m => m.setIcon(criarIcone(tamanho, m.corTipo)));
    }

    function carregarMarcadores(denuncias) {
      const tamanhoInicial = tamanhoPorZoom(map.getZoom());

      denuncias.forEach(d => {
        const cor = corPorTipo(d.tipo);

        const marcador = L.marker([d.latitude, d.longitude], {
          icon: criarIcone(tamanhoInicial, cor),
        }).addTo(map);

        marcador.corTipo = cor;

        marcador.on('click', function () {
          const container = document.createElement('div');
          container.innerHTML = '<p class="carregando">Carregando...</p>';
          marcador.bindPopup(container).openPopup();
          window._containerAtual = container;

          window.ReactNativeWebView.postMessage(JSON.stringify({
            tipo: 'pedirDetalhes',
            id: d.id_denuncia,
          }));
        });

        marcadores.push(marcador);
      });
    }

    function preencherPopup(dados) {
      if (!window._containerAtual) return;

      let html = '<div class="popup-denuncia">';
      html += '<p class="tipo" style="color:' + corPorTipo(dados.tipo) + '">' + (dados.tipo || 'Sem tipo') + '</p>';
      html += '<p class="descricao">' + (dados.descricao || 'Sem descrição informada') + '</p>';

      if (dados.imagemUrl) {
        html += '<img src="' + dados.imagemUrl + '" />';
      }

      html += '</div>';
      window._containerAtual.innerHTML = html;
    }

    map.on('zoomend', atualizarTamanhoDosMarcadores);
  </script>
</body>
</html>
`;

export default function Mapa() {
  const webviewRef = useRef(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    async function buscarDenuncias() {
      try {
        const resposta = await fetch(`${API_BASE_URL}/denuncias/listar_mapa.php`);
        const denuncias = await resposta.json();

        if (webviewRef.current) {
          webviewRef.current.injectJavaScript(`
            carregarMarcadores(${JSON.stringify(denuncias)});
            true;
          `);
        }
      } catch (erro) {
        console.error('Erro ao buscar denúncias:', erro);
      }
    }

    if (carregado) {
      buscarDenuncias();
    }
  }, [carregado]);

  async function handleMessage(event) {
    try {
      const dados = JSON.parse(event.nativeEvent.data);

      if (dados.tipo === 'pedirDetalhes') {
        const resposta = await fetch(`${API_BASE_URL}/denuncias/detalhes.php?id=${dados.id}`);
        const detalhes = await resposta.json();

        const imagemUrl = detalhes.imagem
          ? `${API_BASE_URL}/uploads/${detalhes.imagem}`
          : null;

        webviewRef.current.injectJavaScript(`
          preencherPopup(${JSON.stringify({ ...detalhes, imagemUrl })});
          true;
        `);
      }
    } catch (erro) {
      console.error('Erro ao processar mensagem do mapa:', erro);
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
        onMessage={handleMessage}
        onLoadEnd={() => setCarregado(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});