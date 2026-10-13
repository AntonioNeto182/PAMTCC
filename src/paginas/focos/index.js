import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import api from '../../services/api';
import { abrirNoMapa, mensagemDeErro } from '../../services/denuncias';
import { formatarData } from '../../services/formatadores';
import { useSessao } from '../../hooks/useSessao';
import TelaPainel from '../../components/TelaPainel';
import { Botao, BotaoMini, Campo, Carregando, Folha, Pills, Selo, Vazio } from '../../components/ui';
import { styles } from '../../estilos/painel';
import { social } from '../../estilos/social';

const COR = { ativo: '#c0392b', eliminado: '#27ae60', monitorado: '#f39c12' };

export default function Focos() {
  const navigation = useNavigation();
  const { pode } = useSessao();

  const [itens, setItens] = useState([]);
  const [statusFoco, setStatusFoco] = useState([]);
  const [arboviroses, setArboviroses] = useState([]);
  const [filtro, setFiltro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [edicao, setEdicao] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api
      .get('/denuncias/dominios.php')
      .then(({ data }) => {
        setStatusFoco(data.status_foco);
        setArboviroses(data.arboviroses);
      })
      .catch(() => {});
  }, []);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get('/focos/listar.php', { params: { status: filtro ?? undefined } });
      setItens(data);
    } catch (erro) {
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar os focos.'));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [filtro]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function salvar() {
    setSalvando(true);
    try {
      await api.post('/focos/atualizar.php', {
        id_foco: edicao.id_foco,
        id_status: edicao.id_status,
        id_arbovirose: edicao.id_arbovirose,
        observacao: edicao.observacao,
      });
      setEdicao(null);
      await carregar();
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível atualizar o foco.'));
    } finally {
      setSalvando(false);
    }
  }

  async function verNoMapa(f) {
    try {
      const { data } = await api.get('/denuncias/detalhes.php', { params: { id: f.id_denuncia } });
      abrirNoMapa(navigation, data);
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível abrir a denúncia.'));
    }
  }

  return (
    <TelaPainel titulo="Focos" ativo="focos">
      <Pills
        itens={[{ chave: null, rotulo: 'Todos' }, ...statusFoco.map((s) => ({ chave: s.id_status, rotulo: s.nome }))]}
        ativo={filtro}
        onChange={(c) => { setCarregando(true); setFiltro(c); }}
      />

      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(i) => String(i.id_foco)}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregar(); }} />}
          ListEmptyComponent={<Vazio icone="bug-outline" texto="Nenhum foco encontrado." />}
          renderItem={({ item: f }) => (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                <Text style={styles.cardTitulo}>{f.arbovirose ?? 'Arbovirose não definida'}</Text>
                <Selo texto={f.status} cor={COR[f.status]} />
              </View>
              <Text style={social.meta}>{[f.endereco, f.bairro].filter(Boolean).join(' — ')}</Text>
              {!!f.observacao && <Text style={social.corpo}>{f.observacao}</Text>}
              <Text style={social.meta}>
                Identificado em {formatarData(f.data_identificacao)}
                {f.data_eliminacao ? ` · eliminado em ${formatarData(f.data_eliminacao)}` : ''} · denúncia #{f.id_denuncia}
              </Text>

              <View style={social.botaoLinha}>
                <BotaoMini titulo="Ver no mapa" variante="contorno" onPress={() => verNoMapa(f)} />
                {pode('foco.editar') && (
                  <BotaoMini
                    titulo="Editar"
                    onPress={() => setEdicao({
                      id_foco: f.id_foco,
                      id_status: f.id_status,
                      id_arbovirose: arboviroses.find((a) => a.nome === f.arbovirose)?.id_arbovirose ?? null,
                      observacao: f.observacao ?? '',
                    })}
                  />
                )}
              </View>
            </View>
          )}
        />
      )}

      <Folha visivel={Boolean(edicao)} titulo="Editar foco" onClose={() => setEdicao(null)}>
        {edicao && (
          <>
            <Text style={styles.label}>Status</Text>
            <Pills
              itens={statusFoco.map((s) => ({ chave: s.id_status, rotulo: s.nome }))}
              ativo={edicao.id_status}
              onChange={(c) => setEdicao((e) => ({ ...e, id_status: c }))}
            />

            <Text style={styles.label}>Arbovirose</Text>
            <Pills
              itens={[{ chave: null, rotulo: 'Indefinida' }, ...arboviroses.map((a) => ({ chave: a.id_arbovirose, rotulo: a.nome }))]}
              ativo={edicao.id_arbovirose}
              onChange={(c) => setEdicao((e) => ({ ...e, id_arbovirose: c }))}
            />

            <Campo
              rotulo="Observação"
              value={edicao.observacao}
              onChangeText={(v) => setEdicao((e) => ({ ...e, observacao: v }))}
              multiline
              maxLength={500}
              style={{ minHeight: 80 }}
            />

            <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
          </>
        )}
      </Folha>
    </TelaPainel>
  );
}
