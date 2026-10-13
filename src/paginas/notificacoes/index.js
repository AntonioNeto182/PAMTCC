import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { abrirNoMapa, mensagemDeErro } from '../../services/denuncias';
import { tempoRelativo } from '../../services/formatadores';
import TelaPainel from '../../components/TelaPainel';
import { Carregando, Vazio } from '../../components/ui';
import { styles } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

const ICONES = {
  denuncia_status: 'flag-outline',
  corroboracao_nova: 'arrow-up-circle-outline',
  atualizacao_nova: 'refresh-circle-outline',
  comentario_novo: 'chatbubble-outline',
  vistoria_realizada: 'search-outline',
  foco_confirmado: 'bug-outline',
  foco_eliminado: 'checkmark-circle-outline',
  amizade_solicitada: 'person-add-outline',
  amizade_aceita: 'people-outline',
  alerta_regiao: 'warning-outline',
  sistema: 'information-circle-outline',
};

export default function Notificacoes() {
  const navigation = useNavigation();

  const [itens, setItens] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const buscar = useCallback(async (alvo = 1) => {
    try {
      const { data } = await api.get('/notificacoes/listar.php', { params: { pagina: alvo } });
      setItens((atual) => (alvo === 1 ? data.itens : [...atual, ...data.itens]));
      setTemMais(data.tem_mais);
      setNaoLidas(data.nao_lidas);
      setPagina(alvo);
    } catch (erro) {
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar as notificações.'));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      buscar(1);
    }, [buscar])
  );

  async function marcar(acao, id) {
    try {
      await api.post('/notificacoes/marcar.php', { acao, id_notificacao: id });
      await buscar(1);
    } catch (erro) {
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível atualizar.'));
    }
  }

  async function abrir(n) {
    if (!n.lida) {
      setItens((atual) => atual.map((i) => (i.id_notificacao === n.id_notificacao ? { ...i, lida: true } : i)));
      setNaoLidas((v) => Math.max(0, v - 1));
      api.post('/notificacoes/marcar.php', { acao: 'lida', id_notificacao: n.id_notificacao }).catch(() => {});
    }

    if (n.id_amizade) {
      navigation.navigate('Amigos');
      return;
    }

    if (n.id_denuncia) {
      try {
        const { data } = await api.get('/denuncias/detalhes.php', { params: { id: n.id_denuncia } });
        abrirNoMapa(navigation, data);
      } catch (erro) {
        Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível abrir a denúncia.'));
      }
    }
  }

  function confirmarExclusao(n) {
    Alert.alert('Excluir notificação', 'Deseja excluir esta notificação?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => marcar('excluir', n.id_notificacao) },
    ]);
  }

  return (
    <TelaPainel titulo="Notificações" ativo="notificacoes">
      <View style={[social.linha, { paddingHorizontal: 20, marginTop: 8, justifyContent: 'space-between' }]}>
        <Text style={social.meta}>{naoLidas ? `${naoLidas} não lida(s)` : 'Tudo em dia'}</Text>

        <View style={social.linha}>
          <TouchableOpacity disabled={!naoLidas} onPress={() => marcar('todas_lidas')}>
            <Text style={[social.acaoInlineTexto, { color: naoLidas ? cores.laranja : '#bbb' }]}>Marcar todas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 16 }} onPress={() => marcar('limpar_lidas')}>
            <Text style={[social.acaoInlineTexto, { color: cores.perigo }]}>Limpar lidas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(i) => String(i.id_notificacao)}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => {
                setAtualizando(true);
                buscar(1);
              }}
            />
          }
          onEndReached={() => temMais && buscar(pagina + 1)}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<Vazio icone="notifications-off-outline" texto="Você não tem notificações." />}
          renderItem={({ item: n }) => (
            <TouchableOpacity
              style={[styles.card, !n.lida && { borderLeftWidth: 4, borderLeftColor: cores.laranja }]}
              onPress={() => abrir(n)}
              onLongPress={() => confirmarExclusao(n)}
              activeOpacity={0.8}
            >
              <View style={social.linha}>
                <Ionicons name={ICONES[n.tipo] ?? 'notifications-outline'} size={26} color={n.lida ? '#aaa' : cores.laranja} />

                <View style={social.linhaTexto}>
                  <Text style={[social.nome, n.lida && { fontWeight: '600', color: '#666' }]}>{n.titulo}</Text>
                  <Text style={social.corpo}>{n.mensagem}</Text>
                  <Text style={social.meta}>{tempoRelativo(n.created_at)}</Text>
                </View>

                <TouchableOpacity onPress={() => confirmarExclusao(n)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={18} color="#bbb" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </TelaPainel>
  );
}
