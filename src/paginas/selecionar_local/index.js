import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../../services/api';
import { PINS_CSS, PINS_JS } from '../../components/mapaPins';

const CENTRO_REGISTRO = [-24.4979, -47.8447];
const TEMPO_MAX_GPS_MS = 5000;
const ATRASO_REVELAR_MS = 350;

const gerarHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body { height: 100%; margin: 0; padding: 0; }
    #map { height: 100%; width: 100%; }
    .popup-confirm { text-align: center; }
    .popup-confirm button {
      margin: 4px; padding: 6px 14px; border: none; border-radius: 6px;
      font-weight: bold; color: #fff;
    }
    .btn-confirmar { background: #ff4b4b; }
    .btn-cancelar { background: #999; }
    .pin-usuario {
      width: 20px; height: 20px;
      background: #1a73e8;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(26,115,232,0.3);
    }
    ${PINS_CSS}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const CFG = ${JSON.stringify({ apiUrl: api.defaults.baseURL, raioToquePx: 30 })};

    // Zoom no canto superior direito: o canto esquerdo fica livre para o botão de voltar
    const map = L.map('map', { tap: false, zoomControl: false, minZoom: 3, maxZoom: 19 })
      .setView(${JSON.stringify(CENTRO_REGISTRO)}, 14);
    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    ${PINS_JS}

    let marcadorAtual = null;
    let marcadorUsuario = null;
    let posicaoUsuario = null;
    let pins = [];

    function avisar(mensagem) {
      window.ReactNativeWebView.postMessage(JSON.stringify(mensagem));
    }

    function iconeUsuario() {
      return L.divIcon({
        className: '',
        html: '<div class="pin-usuario"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
    }

    function definirLocalizacaoUsuario(lat, lng, centralizar) {
      posicaoUsuario = [lat, lng];

      if (marcadorUsuario) {
        marcadorUsuario.setLatLng(posicaoUsuario);
      } else {
        marcadorUsuario = L.marker(posicaoUsuario, {
          icon: iconeUsuario(),
          zIndexOffset: 1000,
          interactive: false,
        }).addTo(map);
      }

      if (centralizar) map.setView(posicaoUsuario, 16);
    }

    function recentralizarNoUsuario() {
      if (!posicaoUsuario) return;
      map.flyTo(posicaoUsuario, 16, { duration: 1.2 });
    }

    function removerMarcadorAtual() {
      if (marcadorAtual) {
        map.removeLayer(marcadorAtual);
        marcadorAtual = null;
      }
    }

    function criarPopup(lat, lng) {
      const div = document.createElement('div');
      div.className = 'popup-confirm';
      div.innerHTML =
        '<p>Deseja criar nova denúncia?</p>' +
        '<button class="btn-confirmar">Confirmar</button>' +
        '<button class="btn-cancelar">Cancelar</button>';

      div.querySelector('.btn-confirmar').onclick = function () {
        avisar({ tipo: 'confirmar', lat: lat, lng: lng });
      };
      div.querySelector('.btn-cancelar').onclick = removerMarcadorAtual;

      return div;
    }

    // Chamada pelo React Native com a lista de denúncias
    function definirDenuncias(denuncias) {
      pins.forEach(function (m) { map.removeLayer(m); });
      pins = [];

      const tamanho = tamanhoPorZoom(map.getZoom());

      agruparPorLocal(denuncias).forEach(function (grupo) {
        const marcador = criarMarcadorGrupo(grupo, tamanho, function (g) {
          avisar({ tipo: 'corroborar', id_local: g.id_local });
        });
        pins.push(marcador.addTo(map));
      });
    }

    // Toque perto de um pin existente abre o pin (corroborar) em vez de sobrepor outro
    function pinProximo(latlng) {
      const alvo = map.latLngToContainerPoint(latlng);
      let melhor = null;
      let menor = CFG.raioToquePx;

      pins.forEach(function (m) {
        const d = alvo.distanceTo(map.latLngToContainerPoint(m.getLatLng()));
        if (d <= menor) { melhor = m; menor = d; }
      });

      return melhor;
    }

    map.on('click', function (e) {
      removerMarcadorAtual();

      const existente = pinProximo(e.latlng);
      if (existente) {
        existente.openPopup();
        return;
      }

      marcadorAtual = L.marker(e.latlng).addTo(map);
      marcadorAtual.bindPopup(criarPopup(e.latlng.lat, e.latlng.lng)).openPopup();
    });

    map.on('zoomend', function () {
      const tamanho = tamanhoPorZoom(map.getZoom());
      pins.forEach(function (m) { reiconarMarcador(m, tamanho); });
    });
  </script>
</body>
</html>
`;

const mapaHtml = gerarHtml();

const comTimeout = (promessa, ms) =>
  Promise.race([promessa, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

export default function SelecionarLocal() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const webviewRef = useRef(null);
  const posicaoRef = useRef(null);
  const corroborandoRef = useRef(false);

  const [webviewPronto, setWebviewPronto] = useState(false);
  const [gpsResolvido, setGpsResolvido] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const [localizacaoPronta, setLocalizacaoPronta] = useState(false);

  const carregarDenuncias = useCallback(async () => {
    try {
      const { data } = await api.get('/denuncias/listar_mapa.php');
      webviewRef.current?.injectJavaScript(`definirDenuncias(${JSON.stringify(data)}); true;`);
    } catch (erro) {
      console.error('Erro ao carregar denúncias:', erro);
    }
  }, []);

  useEffect(() => {
    if (webviewPronto) carregarDenuncias();
  }, [webviewPronto, carregarDenuncias]);

  // GPS começa na montagem, em paralelo ao carregamento do WebView
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

  // Revela o mapa só com WebView e GPS prontos: sem "pulo" de posição
  useEffect(() => {
    if (!webviewPronto || !gpsResolvido) return;

    const coords = posicaoRef.current;

    if (coords) {
      webviewRef.current?.injectJavaScript(
        `definirLocalizacaoUsuario(${Number(coords.latitude)}, ${Number(coords.longitude)}, true); true;`
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

  function voltar() {
    if (typeof navigation.popTo === 'function') navigation.popTo('Inicio');
    else navigation.navigate('Inicio');
  }

  function recentralizar() {
    webviewRef.current?.injectJavaScript('recentralizarNoUsuario(); true;');
  }

  async function corroborar(idLocal) {
    if (corroborandoRef.current) return;
    corroborandoRef.current = true;

    try {
      const salvo = await AsyncStorage.getItem('usuario');
      const usuario = salvo ? JSON.parse(salvo) : null;

      if (!usuario?.id_usuario) {
        Alert.alert('Atenção', 'Faça login para corroborar uma denúncia.');
        return;
      }

      await api.post('/denuncias/corroborar.php', {
        id_local: idLocal,
        id_usuario: usuario.id_usuario,
      });

      Alert.alert('Obrigado!', 'Sua corroboração foi registrada.');
    } catch (erro) {
      Alert.alert(
        'Atenção',
        erro.response?.data?.message ?? 'Não foi possível registrar a corroboração.'
      );
    } finally {
      corroborandoRef.current = false;
      carregarDenuncias(); // atualiza contadores e reabilita o botão
    }
  }

  // Navega na hora; o endereço é resolvido na tela seguinte
  function handleMessage(event) {
    try {
      const dados = JSON.parse(event.nativeEvent.data);

      if (dados.tipo === 'confirmar') {
        navigation.navigate('RegistrarDenuncia', {
          latitude: dados.lat,
          longitude: dados.lng,
        });
      } else if (dados.tipo === 'corroborar') {
        corroborar(Number(dados.id_local));
      }
    } catch (erro) {
      console.error('Erro ao processar mensagem do mapa:', erro);
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.container}
        originWhitelist={['*']}
        source={{ html: mapaHtml }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onLoadEnd={() => setWebviewPronto(true)}
      />

      {!visivel && (
        <View style={styles.carregandoMapa}>
          <ActivityIndicator size="large" color="#ff4b4b" />
        </View>
      )}

      <TouchableOpacity
        style={[styles.botaoVoltar, { top: insets.top + 12 }]}
        onPress={voltar}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={22} color="#333" />
      </TouchableOpacity>

      {visivel && localizacaoPronta && (
        <TouchableOpacity style={styles.botaoRecentralizar} onPress={recentralizar}>
          <Ionicons name="locate" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const sombra = {
  elevation: 4,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  carregandoMapa: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f6f6f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoVoltar: {
    position: 'absolute',
    left: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
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
    ...sombra,
  },
});