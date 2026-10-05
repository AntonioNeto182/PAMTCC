import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import api from '../../services/api';
import { useFotoPerfil } from '../../hooks/useFotoPerfil';
import GraficoPizza from '../../components/GraficoPizza';
import MenuLateral from '../../components/MenuLateral';
import { styles } from './styles';
import Logo from '../../../assets/icons/logo.png';

const PERIODOS = [
  { chave: 'semana', rotulo: 'Última semana', comparacao: 'à semana anterior' },
  { chave: 'mes', rotulo: 'Último mês', comparacao: 'ao mês anterior' },
  { chave: 'trimestre', rotulo: 'Último trimestre', comparacao: 'ao trimestre anterior' },
];

const CORES_FATIAS = ['#1a73e8', '#ff9f1a', '#43a047', '#8e44ad'];
const COR_OUTROS = '#bdbdbd';
const MAX_FATIAS = 4;

function montarFatias(tipos) {
  const total = tipos.reduce((soma, t) => soma + t.total, 0);
  if (!total) return [];

  const principais = tipos.slice(0, MAX_FATIAS);
  const restante = tipos.slice(MAX_FATIAS).reduce((soma, t) => soma + t.total, 0);

  const lista = principais.map((t, i) => ({ ...t, cor: CORES_FATIAS[i] }));
  if (restante > 0) lista.push({ nome: 'Outros', total: restante, cor: COR_OUTROS });

  return lista.map((t) => ({ ...t, percentual: Math.round((t.total / total) * 100) }));
}

function Variacao({ valor, comparacao }) {
  if (valor === null || valor === undefined) {
    return <Text style={styles.variacaoTexto}>Sem base de comparação no período anterior</Text>;
  }

  const subiu = valor > 0;
  const igual = valor === 0;
  const cor = igual ? '#888' : subiu ? '#ff7b39' : '#43a047';

  return (
    <View style={styles.variacaoLinha}>
      {!igual && <Ionicons name={subiu ? 'caret-up' : 'caret-down'} size={22} color={cor} />}
      <Text style={[styles.variacaoNumero, { color: cor }]}>
        {subiu ? '+' : ''}{valor}%
      </Text>
      <Text style={styles.variacaoTexto}>em relação {comparacao}</Text>
    </View>
  );
}

export default function Estatisticas() {
  const navigation = useNavigation();
  const { fotoUri, aoFalhar } = useFotoPerfil();

  const [menuAberto, setMenuAberto] = useState(false);
  const [periodo, setPeriodo] = useState('semana');
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);

      api
        .get('/estatisticas/resumo.php', { params: { periodo } })
        .then(({ data }) => {
          if (!ativo) return;
          setDados(data);
          setErro(false);
        })
        .catch((e) => {
          console.error('Erro ao carregar estatísticas:', e);
          if (ativo) setErro(true);
        })
        .finally(() => {
          if (ativo) setCarregando(false);
        });

      return () => {
        ativo = false;
      };
    }, [periodo])
  );

  const fatias = useMemo(() => montarFatias(dados?.tipos ?? []), [dados]);
  const maiorBairro = dados?.bairros?.[0]?.total ?? 0;
  const comparacao = PERIODOS.find((p) => p.chave === periodo).comparacao;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuAberto(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerLogo}>
          <Image source={Logo} style={styles.headerLogoImage} />
          <Text style={styles.headerLogoText}>SIMAV</Text>
        </View>

        <TouchableOpacity
          style={[styles.profileButton, fotoUri && styles.profileButtonFoto]}
          onPress={() => navigation.navigate('Perfil')}
        >
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.profileImagem} onError={aoFalhar} />
          ) : (
            <Ionicons name="person" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.visaoArea}>
          <View style={styles.visaoContainer}>
            <View style={[styles.visaoOpcao, styles.visaoOpcaoAtiva]}>
              <Text style={[styles.visaoTexto, styles.visaoTextoAtivo]}>Visão geral</Text>
            </View>
            <TouchableOpacity
              style={styles.visaoOpcao}
              onPress={() => navigation.navigate('Inicio', { abrirMapa: Date.now() })}
            >
              <Text style={styles.visaoTexto}>Mapa de calor</Text>
            </TouchableOpacity>
          </View>
        </View>

        <LinearGradient
          colors={['#ff7b39', '#ff4b4b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.resumoCard}
        >
          <View style={styles.resumoItem}>
            <Text style={styles.resumoRotulo}>Nº de denúncias</Text>
            <Text style={styles.resumoNumero}>{dados?.totais.denuncias ?? '–'}</Text>
          </View>
          <View style={styles.resumoDivisor} />
          <View style={styles.resumoItem}>
            <Text style={styles.resumoRotulo}>Focos confirmados</Text>
            <Text style={styles.resumoNumero}>{dados?.totais.focos ?? '–'}</Text>
          </View>
          <View style={styles.resumoDivisor} />
          <View style={styles.resumoItem}>
            <Text style={styles.resumoRotulo}>Casos reportados</Text>
            <Text style={styles.resumoNumero}>{dados?.totais.casos ?? '–'}</Text>
          </View>
        </LinearGradient>

        <Text style={styles.tituloCentral}>Estatísticas Detalhadas</Text>

        <View style={styles.periodoContainer}>
          {PERIODOS.map((p) => {
            const ativo = p.chave === periodo;
            return (
              <TouchableOpacity
                key={p.chave}
                style={[styles.periodoOpcao, ativo && styles.periodoOpcaoAtiva]}
                onPress={() => setPeriodo(p.chave)}
              >
                <Text style={[styles.periodoTexto, ativo && styles.periodoTextoAtivo]}>
                  {p.rotulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {carregando && <ActivityIndicator style={styles.loading} color="#ff4b4b" />}
        {erro && !carregando && (
          <Text style={styles.erroTexto}>Não foi possível carregar as estatísticas.</Text>
        )}

        {dados && (
          <>
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Denúncias Recentes</Text>
              <Variacao valor={dados.variacao_denuncias} comparacao={comparacao} />
            </View>

            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Tipos de Focos</Text>

              {fatias.length === 0 ? (
                <Text style={styles.vazioTexto}>Nenhuma denúncia no período.</Text>
              ) : (
                <View style={styles.pizzaLinha}>
                  <GraficoPizza
                    dados={fatias.map((f) => ({ valor: f.total, cor: f.cor }))}
                    tamanho={150}
                  />

                  <View style={styles.legenda}>
                    {fatias.map((f) => (
                      <View key={f.nome} style={styles.legendaItem}>
                        <View style={[styles.legendaCor, { backgroundColor: f.cor }]} />
                        <Text style={styles.legendaTexto} numberOfLines={1}>
                          {f.nome} - {f.percentual}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Casos por bairro</Text>

              {dados.bairros.length === 0 ? (
                <Text style={styles.vazioTexto}>Nenhum caso reportado no período.</Text>
              ) : (
                <View style={styles.barrasArea}>
                  {dados.bairros.map((b) => (
                    <View key={b.nome} style={styles.barraLinha}>
                      <Text style={styles.barraNome} numberOfLines={1}>{b.nome}</Text>

                      <View style={styles.barraTrilho}>
                        <LinearGradient
                          colors={['#ff4b4b', '#ffb42a']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[
                            styles.barra,
                            { width: `${Math.max(8, (b.total / maiorBairro) * 100)}%` },
                          ]}
                        />
                        <Text style={styles.barraValor}>{b.total}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <MenuLateral
        visible={menuAberto}
        onClose={() => setMenuAberto(false)}
        ativo="estatisticas"
      />
    </SafeAreaView>
  );
}