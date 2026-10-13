import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Mapa from '../../components/Mapa';
import MenuLateral from '../../components/MenuLateral';
import DetalhesDenuncia from '../../components/DetalhesDenuncia';
import { useFotoPerfil } from '../../hooks/useFotoPerfil';
import { useSessao } from '../../hooks/useSessao';
import { styles } from './styles';
import Logo from '../../components/Logo';

const filtros = ['Casos', 'Focos', 'Regiões', 'Alertas'];

const STATUS_PILLS = [
  { chave: 'pendente',   rotulo: 'Pendente',    cor: '#f39c12' },
  { chave: 'em_analise', rotulo: 'Em análise',  cor: '#3498db' },
  { chave: 'vistoriada', rotulo: 'Vistoriada',  cor: '#9b59b6' },
  { chave: 'resolvida',  rotulo: 'Resolvida',   cor: '#27ae60' },
  { chave: 'rejeitada',  rotulo: 'Rejeitada',   cor: '#c0392b' },
];

const STATUS_PADRAO = ['pendente', 'em_analise', 'vistoriada'];

export default function Inicio() {
  const navigation = useNavigation();
  const route = useRoute();
  const { fotoUri, aoFalhar } = useFotoPerfil();
  const { pode } = useSessao();

  const focar = route.params?.focarDenuncia ?? null;
  const abrirMapa = route.params?.abrirMapa ?? null;

  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [resultados, setResultados] = useState(null);
  const [filtroAtivo, setFiltroAtivo] = useState('Casos');
  const [mostrarDenuncias, setMostrarDenuncias] = useState(
    Boolean(focar || abrirMapa)
  );
  const [menuAberto, setMenuAberto] = useState(false);

  const [statusFiltro, setStatusFiltro] = useState(STATUS_PADRAO);
  const [moderando, setModerando] = useState(null);
  const [detalhando, setDetalhando] = useState(null);

  const podeModerar = pode('denuncia.moderar');

  useEffect(() => {
    if (focar || abrirMapa) setMostrarDenuncias(true);
  }, [focar?.ts, abrirMapa]);

  // Debounce: só aplica a busca no mapa 350ms após parar de digitar.
  // Evita recalcular a cada tecla em bases grandes.
  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaAplicada(busca.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [busca]);

  // Quando a busca é limpa, some com o contador
  useEffect(() => {
    if (busca.trim().length === 0) setResultados(null);
  }, [busca]);

  function togglarStatus(chave) {
    setStatusFiltro((atual) =>
      atual.includes(chave) ? atual.filter((c) => c !== chave) : [...atual, chave]
    );
  }

  const filtroParaMapa = useMemo(
    () => (statusFiltro.length === STATUS_PILLS.length ? null : statusFiltro),
    [statusFiltro]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuAberto(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerLogo}>
          <Logo style={styles.headerLogoImage} />
          <Text style={styles.headerLogoText}>SIMAV</Text>
        </View>

        <TouchableOpacity
          style={[styles.profileButton, fotoUri && { overflow: 'hidden' }]}
          onPress={() => navigation.navigate('Perfil')}
        >
          {fotoUri ? (
            <Image
              source={{ uri: fotoUri }}
              style={{ width: '100%', height: '100%' }}
              onError={aoFalhar}
            />
          ) : (
            <Ionicons name="person" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* ---------- CTAs ---------- */}
      <View style={styles.ctaArea}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => setMostrarDenuncias((atual) => !atual)}
        >
          <LinearGradient
            colors={['#ff7b39', '#ff4b4b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              {mostrarDenuncias ? 'Ocultar denúncias' : 'Ver denúncias'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('SelecionarLocal')}
        >
          <LinearGradient
            colors={['#ff7b39', '#ff4b4b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Registrar denúncia</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ---------- Barra de busca fina ---------- */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderRadius: 10,
          height: 36,
          marginHorizontal: 16,
          marginTop: 14,
          marginBottom: buscaAplicada ? 4 : 8,
          paddingHorizontal: 10,
          borderWidth: 1,
          borderColor: '#e5e5e5',
        }}
      >
        <Ionicons name="search" size={15} color="#999" />
        <TextInput
          style={{
            flex: 1,
            marginLeft: 6,
            fontSize: 13,
            color: '#333',
            paddingVertical: 0,
          }}
          placeholder="´Filtrar denúncias por endereço, bairro, autor ou tipo"
          placeholderTextColor="#aaa"
          value={busca}
          onChangeText={setBusca}
          returnKeyType="search"
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')} hitSlop={8}>
            <Ionicons name="close-circle" size={15} color="#bbb" />
          </TouchableOpacity>
        )}
      </View>

      {/* Contador de resultados — aparece só com busca ativa */}
      {buscaAplicada.length > 0 && resultados !== null && (
        <Text
          style={{
            marginHorizontal: 16,
            marginBottom: 6,
            fontSize: 11,
            color: resultados === 0 ? '#c0392b' : '#666',
            fontWeight: '600',
          }}
        >
          {resultados === 0
            ? 'Nenhuma denúncia encontrada'
            : `${resultados} denúncia${resultados > 1 ? 's' : ''} encontrada${resultados > 1 ? 's' : ''}`}
        </Text>
      )}

      {/* ---------- Bloco de filtros (só com denúncias visíveis) ---------- */}
      {mostrarDenuncias && (
        <View style={{ marginBottom: 6 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {STATUS_PILLS.map((s) => {
              const ativo = statusFiltro.includes(s.chave);
              return (
                <TouchableOpacity
                  key={s.chave}
                  onPress={() => togglarStatus(s.chave)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    height: 28,
                    borderRadius: 14,
                    marginRight: 6,
                    backgroundColor: ativo ? s.cor : '#fff',
                    borderWidth: 1,
                    borderColor: ativo ? s.cor : '#e0e0e0',
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      marginRight: 5,
                      backgroundColor: ativo ? '#fff' : s.cor,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: ativo ? '#fff' : '#333',
                    }}
                  >
                    {s.rotulo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ---------- Filtros de categoria ---------- */}
      <View style={styles.filtrosArea}>
        {filtros.map((filtro) => {
          const ativo = filtro === filtroAtivo;

          return (
            <TouchableOpacity
              key={filtro}
              style={[styles.filtroPill, ativo && styles.filtroPillAtivo]}
              onPress={() => setFiltroAtivo(filtro)}
            >
              <Text
                style={[styles.filtroTexto, ativo && styles.filtroTextoAtivo]}
              >
                {filtro}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.mapa}>
        <Mapa
          mostrarDenuncias={mostrarDenuncias}
          focar={focar}
          statusFiltro={filtroParaMapa}
          busca={buscaAplicada}
          podeModerar={podeModerar}
          onModerar={(id) => setModerando(id)}
          onDetalhes={(id) => setDetalhando(id)}
          onBuscaResultado={setResultados}
        />
      </View>

      <MenuLateral
        visible={menuAberto}
        onClose={() => setMenuAberto(false)}
        ativo="mapa"
      />

      <DetalhesDenuncia
        idDenuncia={moderando}
        modo="moderacao"
        onClose={() => setModerando(null)}
        onMudou={() => {}}
      />

      <DetalhesDenuncia
        idDenuncia={detalhando}
        onClose={() => setDetalhando(null)}
        onMudou={() => {}}
      />
    </SafeAreaView>
  );
}