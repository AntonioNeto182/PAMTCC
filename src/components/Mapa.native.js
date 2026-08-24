import React, { useEffect, useState } from "react";
import { WebView } from "react-native-webview";

const API_URL = "http://192.168.0.127/api/denuncias/listar.php";

export default function Mapa() {
  const [denuncias, setDenuncias] = useState([]);

  useEffect(() => {
    async function carregar() {
  try {
    const resposta = await fetch('http://192.168.0.127/simav_api/denuncias/listar_mapa.php');
    const texto = await resposta.text();
    console.log('RESPOSTA CRUA:', texto);
    const dados = JSON.parse(texto);
    setDenuncias(dados);
  } catch (erro) {
    console.error('Erro ao buscar denúncias:', erro);
  }
}
    carregar();
  }, []);

  const marcadoresJs = denuncias
    .map(
      (d) => `L.marker([${d.latitude}, ${d.longitude}])
    .addTo(map)
    .bindPopup(${JSON.stringify(`${d.tipo} — ${d.status}`)})
    .on('click', function() {
      window.ReactNativeWebView.postMessage(${d.id_denuncia});
    });`,
    )
    .join("\n");

  const html = `<!DOCTYPE html>
  <html><head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>html, body, #map { height: 100%; margin: 0; }</style>
  </head><body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const map = L.map('map').setView([-23.5478, -46.6361], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      ${marcadoresJs}
    </script>
  </body></html>`;

  return (
    <WebView
      style={{ flex: 1 }}
      originWhitelist={["*"]}
      source={{ html }}
      javaScriptEnabled
      onMessage={(event) => {
        const idDenuncia = event.nativeEvent.data;
        navigation.navigate("DetalhesDenuncia", { id: idDenuncia });
      }}
    />
  );
}
