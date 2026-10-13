import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import api from '../../services/api';
import { mensagemDeErro } from '../../services/denuncias';
import { formatarDataHora } from '../../services/formatadores';
import TelaPainel from '../../components/TelaPainel';
import { Carregando, Vazio } from '../../components/ui';
import { styles } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

const CAMPOS = {
  descricao: 'Descrição',
  id_tipo: 'Tipo',
  id_local: 'Local',
  prioridade: 'Prioridade',
  id_denuncia_principal: 'Denúncia principal',
};

const resumir = (v) => (v == null || v === '' ? '—' : String(v).length > 120 ? `${String(v).slice(0, 120)}…` : String(v));

export default function Auditoria() {
  const [itens, setItens] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const buscar = useCallback(async (alvo = 1) => {
    try {
      const { data } = await api.get('/admin/auditoria.php', { params: { pagina: alvo } });
      setItens((atual) => (alvo === 1 ? data.itens : [...atual, ...data.itens]));
      setTemMais(data.tem_mais);
      setPagina(alvo);
    } catch (erro) {
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar a auditoria.'));
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

  return (
    <TelaPainel titulo="Auditoria de denúncias" ativo="auditoria">
      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(i) => String(i.id_auditoria)}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); buscar(1); }} />}
          onEndReached={() => temMais && buscar(pagina + 1)}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<Vazio icone="receipt-outline" texto="Nenhuma alteração registrada." />}
          renderItem={({ item: a }) => (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                <Text style={styles.cardTitulo}>
                  {CAMPOS[a.campo_alterado] ?? a.campo_alterado} · denúncia #{a.id_denuncia}
                </Text>
              </View>
              <Text style={[social.corpo, { color: cores.perigo }]}>− {resumir(a.valor_anterior)}</Text>
              <Text style={[social.corpo, { color: cores.verde, marginTop: 2 }]}>+ {resumir(a.valor_novo)}</Text>
              <Text style={social.meta}>
                {a.usuario} · {formatarDataHora(a.created_at)}
              </Text>
            </View>
          )}
        />
      )}
    </TelaPainel>
  );
}
