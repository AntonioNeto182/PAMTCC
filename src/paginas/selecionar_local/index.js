import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';

const mapaHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; touch-action: none; }
    .popup-confirm { text-align: center; }
    .popup-confirm button {
      margin: 4px; padding: 6px 14px; border: none; border-radius: 6px;
      font-weight: bold; color: #fff;
    }
    .btn-confirmar { background: #ff4b4b; }
    .btn-cancelar { background: #999; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { tap: true }).setView([-23.5478, -46.6361], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let marcadorAtual = null;

    function criarPopup(lat, lng) {
      const div = document.createElement('div');
      div.className = 'popup-confirm';
      div.innerHTML =
        '<p>Deseja criar nova denúncia?</p>' +
        '<button class="btn-confirmar">Confirmar</button>' +
        '<button class="btn-cancelar">Cancelar</button>';

      div.querySelector('.btn-confirmar').onclick = function () {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          tipo: 'confirmar', lat: lat, lng: lng
        }));
      };

      div.querySelector('.btn-cancelar').onclick = function () {
        if (marcadorAtual) {
          map.removeLayer(marcadorAtual);
          marcadorAtual = null;
        }
      };

      return div;
    }

    map.on('click', function (e) {
      if (marcadorAtual) {
        map.removeLayer(marcadorAtual);
      }

      marcadorAtual = L.marker(e.latlng).addTo(map);
      marcadorAtual.bindPopup(criarPopup(e.latlng.lat, e.latlng.lng)).openPopup();
    });
  </script>
</body>
</html>
`;

export default function SelecionarLocal() {
  const navigation = useNavigation();

  async function buscarEndereco(lat, lng) {
    try {
      const resposta = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'SIMAV-App/1.0' } }
      );

      const dados = await resposta.json();
      const endereco = dados.address || {};

      const rua = endereco.road || endereco.pedestrian || '';
      const numero = endereco.house_number ? `, ${endereco.house_number}` : '';
      const bairro = endereco.suburb || endereco.neighbourhood || endereco.quarter || '';

      return {
        endereco: `${rua}${numero}`.trim() || 'Endereço não identificado',
        bairro: bairro || 'Bairro não identificado',
      };
    } catch (erro) {
      console.error('Erro ao buscar endereço:', erro);
      return { endereco: '', bairro: '' };
    }
  }

  async function handleMessage(event) {
    try {
      const dados = JSON.parse(event.nativeEvent.data);

      if (dados.tipo === 'confirmar') {
        const { endereco, bairro } = await buscarEndereco(dados.lat, dados.lng);

        navigation.navigate('RegistrarDenuncia', {
          latitude: dados.lat,
          longitude: dados.lng,
          endereco,
          bairro,
        });
      }
    } catch (erro) {
      console.error('Erro ao processar mensagem do mapa:', erro);
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        style={{ flex: 1 }}
        originWhitelist={['*']}
        source={{ html: mapaHtml }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});