import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { abrirNoMapa, mensagemDeErro, urlImagem } from '../../services/denuncias';
import { tempoRelativo } from '../../services/formatadores';
import TelaPainel from '../../components/TelaPainel';
import { Carregando, Selo, Vazio } from '../../components/ui';
import { styles } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

export default function Favoritos() {
  const navigation = useNavigation();

  const [itens, setItens] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const buscar = useCallback(async (alvo = 1) => {
    try {
      const { data } = await api.get('/favoritos/listar.php', { params: { pagina: alvo } });
      setItens((atual) => (alvo === 1 ? data.itens : [...atual, ...data.itens]));
      setTemMais(data.tem_mais);
      setPagina(alvo);
    } catch (erro) {
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar os favoritos.'));
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

  async function alternarAviso(d, valor) {
    setItens((atual) => atual.map((i) => (i.id_denuncia === d.id_denuncia ? { ...i, notificar: valor } : i)));
    try {
      await api.post('/favoritos/alternar.php', { id_denuncia: d.id_denuncia, notificar: valor });
    } catch (erro) {
      setItens((atual) => atual.map((i) => (i.id_denuncia === d.id_denuncia ? { ...i, notificar: !valor } : i)));
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível alterar o aviso.'));
    }
  }

  function remover(d) {
    Alert.alert('Remover dos favoritos', 'Você deixará de acompanhar esta denúncia.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/favoritos/alternar.php', { id_denuncia: d.id_denuncia });
            setItens((atual) => atual.filter((i) => i.id_denuncia !== d.id_denuncia));
          } catch (erro) {
            Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível remover.'));
          }
        },
      },
    ]);
  }

  return (
    <TelaPainel titulo="Denúncias favoritas" ativo="favoritos">
      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(i) => String(i.id_denuncia)}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); buscar(1); }} />}
          onEndReached={() => temMais && buscar(pagina + 1)}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<Vazio icone="star-outline" texto="Favorite uma denúncia para acompanhar as novidades dela." />}
          renderItem={({ item: d }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => abrirNoMapa(navigation, d)}>
              <View style={social.linha}>
                {d.imagem ? <Image source={{ uri: urlImagem(d.imagem) }} style={social.cartaoImagem} /> : null}

                <View style={[social.linhaTexto, !d.imagem && { marginLeft: 0 }]}>
                  <View style={styles.cardTopo}>
                    <Text style={styles.cardTitulo} numberOfLines={1}>{d.tipo}</Text>
                    <Selo texto={d.status} cor={d.status_cor} />
                  </View>
                  <Text style={social.corpo} numberOfLines={2}>{d.descricao}</Text>
                  <Text style={social.meta} numberOfLines={1}>
                    {[d.endereco, d.bairro].filter(Boolean).join(' — ')}
                  </Text>
                  <Text style={social.meta}>
                    {d.votos} up · favoritada {tempoRelativo(d.favoritada_em)}
                  </Text>
                </View>
              </View>

              <View style={[social.linha, { justifyContent: 'space-between', marginTop: 10 }]}>
                <View style={social.linha}>
                  <Switch
                    value={d.notificar}
                    onValueChange={(v) => alternarAviso(d, v)}
                    trackColor={{ true: cores.laranja }}
                  />
                  <Text style={[social.meta, { marginLeft: 6 }]}>Avisar novidades</Text>
                </View>

                <TouchableOpacity onPress={() => remover(d)} hitSlop={10}>
                  <Ionicons name="star" size={22} color={cores.laranja} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </TelaPainel>
  );
}
