import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import api from '../../services/api';
import { mensagemDeErro } from '../../services/denuncias';
import { tempoRelativo } from '../../services/formatadores';
import Avatar from '../../components/Avatar';
import TelaPainel from '../../components/TelaPainel';
import { Carregando, Metrica, Vazio } from '../../components/ui';
import { styles } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

export default function Reputacao() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      api
        .get('/reputacao/resumo.php')
        .then(({ data }) => setDados(data))
        .catch((erro) => Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar a reputação.')))
        .finally(() => setCarregando(false));
    }, [])
  );

  const r = dados?.reputacao;
  const faixa = r ? r.proximo_nivel - r.base_nivel : 1;
  const progresso = r ? Math.min(1, Math.max(0, (r.pontos - r.base_nivel) / faixa)) : 0;

  return (
    <TelaPainel titulo="Reputação" ativo="reputacao">
      {carregando || !dados ? (
        <Carregando />
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          <View style={[styles.card, { marginTop: 14 }]}>
            <Text style={social.meta}>Seu nível</Text>
            <Text style={{ fontSize: 34, fontWeight: 'bold', color: cores.laranja }}>Nível {r.nivel}</Text>
            <Text style={social.corpo}>
              {r.pontos} pontos · {r.posicao}º no ranking
            </Text>

            <View style={social.barra}>
              <View style={[social.barraPreenchida, { width: `${Math.round(progresso * 100)}%` }]} />
            </View>
            <Text style={social.meta}>
              {r.faltam > 0 ? `Faltam ${r.faltam} pontos para o nível ${r.nivel + 1}` : 'Nível máximo da faixa atual'}
            </Text>
          </View>

          <View style={social.metricas}>
            <Metrica valor={r.denuncias_confirmadas} rotulo="Denúncias confirmadas" />
            <Metrica valor={r.denuncias_rejeitadas} rotulo="Denúncias rejeitadas" />
            <Metrica valor={r.contribuicoes_validadas} rotulo="Contribuições validadas" />
            <Metrica valor={r.pontos} rotulo="Pontos" />
          </View>

          <Text style={styles.secao}>Ranking</Text>
          {dados.ranking.length === 0 && <Vazio icone="trophy-outline" texto="O ranking aparece quando alguém pontuar." />}
          {dados.ranking.map((p, idx) => (
            <View key={p.id_usuario} style={[styles.card, p.eu && { borderWidth: 1.5, borderColor: cores.laranja }]}>
              <View style={social.linha}>
                <Text style={{ width: 28, fontSize: 16, fontWeight: 'bold', color: idx < 3 ? cores.laranja : '#999' }}>{idx + 1}º</Text>
                <Avatar nome={p.nome} foto={p.foto_perfil} tamanho={38} />
                <View style={social.linhaTexto}>
                  <Text style={social.nome} numberOfLines={1}>{p.nome}{p.eu ? ' (você)' : ''}</Text>
                  <Text style={social.meta}>Nível {p.nivel}</Text>
                </View>
                <Text style={{ fontWeight: 'bold', color: cores.texto }}>{p.pontos} pts</Text>
              </View>
            </View>
          ))}

          <Text style={styles.secao}>Últimos eventos</Text>
          {dados.eventos.length === 0 && <Vazio icone="time-outline" texto="Seus pontos aparecem aqui." />}
          {dados.eventos.map((e) => (
            <View key={e.id_evento} style={styles.card}>
              <View style={social.linha}>
                <View style={social.linhaTexto}>
                  <Text style={social.nome}>{e.descricao ?? e.tipo.replace(/_/g, ' ')}</Text>
                  <Text style={social.meta}>
                    {tempoRelativo(e.created_at)}
                    {e.id_denuncia ? ` · denúncia #${e.id_denuncia}` : ''}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: e.pontos >= 0 ? cores.verde : cores.perigo }}>
                  {e.pontos > 0 ? `+${e.pontos}` : e.pontos}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </TelaPainel>
  );
}
