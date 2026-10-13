import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { mensagemDeErro } from '../../services/denuncias';
import { useSessao } from '../../hooks/useSessao';
import TelaPainel from '../../components/TelaPainel';
import { Botao, Campo, Carregando, Folha, Pills, Selo, Vazio } from '../../components/ui';
import { styles } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

const COR_RISCO = { baixo: '#27ae60', moderado: '#f39c12', alto: '#e67e22', critico: '#c0392b' };
const NIVEIS = ['cidade', 'distrito', 'bairro', 'setor'].map((n) => ({ chave: n, rotulo: n }));

const FORM_VAZIO = {
  id_regiao: null,
  nome: '',
  descricao: '',
  nivel: 'bairro',
  area_wkt: '',
  centro_lat: '',
  centro_lng: '',
  ativo: true,
};

export default function Regioes() {
  const navigation = useNavigation();
  const { pode } = useSessao();

  const [itens, setItens] = useState([]);
  const [podeEditar, setPodeEditar] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [calculando, setCalculando] = useState(false);

  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get('/regioes/listar.php', { params: { todas: 1 } });
      setItens(data.itens);
      setPodeEditar(data.pode_editar);
    } catch (erro) {
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar as regiões.'));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function interesse(r, acao, extra = {}) {
    try {
      await api.post('/regioes/interesse.php', { id_regiao: r.id_regiao, acao, ...extra });
      await carregar();
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível atualizar.'));
    }
  }

  async function recalcular() {
    setCalculando(true);
    try {
      await api.post('/admin/calcular_risco.php');
      await carregar();
    } catch (erro) {
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível recalcular o risco.'));
    } finally {
      setCalculando(false);
    }
  }

  function editar(r) {
    setForm({
      id_regiao: r.id_regiao,
      nome: r.nome,
      descricao: r.descricao ?? '',
      nivel: r.nivel,
      area_wkt: '',
      centro_lat: String(r.centro_lat),
      centro_lng: String(r.centro_lng),
      ativo: r.ativo,
    });
  }

  async function salvar() {
    if (!form.nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome da região.');
      return;
    }
    if (!form.id_regiao && !form.area_wkt.trim()) {
      Alert.alert('Atenção', 'Informe a área (POLYGON) da nova região.');
      return;
    }

    setSalvando(true);
    try {
      await api.post('/regioes/salvar.php', form);
      setForm(null);
      await carregar();
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível salvar a região.'));
    } finally {
      setSalvando(false);
    }
  }

  function excluir() {
    Alert.alert('Excluir região', `Excluir "${form.nome}"? Alertas e acompanhamentos dela também serão removidos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/regioes/salvar.php', { acao: 'excluir', id_regiao: form.id_regiao });
            setForm(null);
            await carregar();
          } catch (erro) {
            Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível excluir.'));
          }
        },
      },
    ]);
  }

  const campo = (chave) => (valor) => setForm((f) => ({ ...f, [chave]: valor }));

  return (
    <TelaPainel titulo="Regiões e risco" ativo="regioes">
      {(podeEditar || pode('configuracao.editar')) && (
        <View style={{ paddingHorizontal: 20, flexDirection: 'row' }}>
          {podeEditar && (
            <View style={{ flex: 1, marginRight: 8 }}>
              <Botao titulo="Nova região" icone="add" onPress={() => setForm({ ...FORM_VAZIO })} />
            </View>
          )}
          {pode('configuracao.editar') && (
            <View style={{ flex: 1 }}>
              <Botao titulo="Recalcular risco" variante="secundario" carregando={calculando} onPress={recalcular} />
            </View>
          )}
        </View>
      )}

      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(i) => String(i.id_regiao)}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregar(); }} />}
          ListEmptyComponent={<Vazio icone="location-outline" texto="Nenhuma região cadastrada." />}
          renderItem={({ item: r }) => (
            <View style={[styles.card, !r.ativo && { opacity: 0.55 }]}>
              <View style={styles.cardTopo}>
                <View style={{ flex: 1 }}>
                  <Text style={social.nome}>{r.nome}</Text>
                  <Text style={social.meta}>{r.nivel}{r.ativo ? '' : ' · inativa'}</Text>
                </View>
                {r.risco ? <Selo texto={`risco ${r.risco}`} cor={COR_RISCO[r.risco]} /> : <Selo texto="sem cálculo" cor="#bbb" />}
              </View>

              {r.risco && (
                <Text style={social.corpo}>
                  Score {r.score} · {r.denuncias_abertas} denúncias abertas · {r.focos_ativos} focos · {r.casos_recentes} casos (30 d)
                </Text>
              )}

              {r.alertas > 0 && (
                <TouchableOpacity style={[social.linha, { marginTop: 8 }]} onPress={() => navigation.navigate('Alertas', { idRegiao: r.id_regiao })}>
                  <Ionicons name="warning" size={16} color={cores.perigo} />
                  <Text style={[social.acaoInlineTexto, { color: cores.perigo }]}>{r.alertas} alerta(s) vigente(s)</Text>
                </TouchableOpacity>
              )}

              <View style={[social.linha, { justifyContent: 'space-between', marginTop: 10 }]}>
                <View style={social.linha}>
                  <Switch
                    value={r.seguindo}
                    trackColor={{ true: cores.laranja }}
                    onValueChange={(v) => interesse(r, v ? 'seguir' : 'deixar')}
                  />
                  <Text style={[social.meta, { marginLeft: 6 }]}>Acompanhar</Text>
                </View>

                {r.seguindo && (
                  <TouchableOpacity
                    style={social.linha}
                    onPress={() => interesse(r, 'notificar', { notificar_alertas: !r.notificar_alertas })}
                  >
                    <Ionicons name={r.notificar_alertas ? 'notifications' : 'notifications-off-outline'} size={18} color={cores.laranja} />
                    <Text style={[social.acaoInlineTexto, { color: cores.laranja }]}>
                      {r.notificar_alertas ? 'Avisos ligados' : 'Avisos desligados'}
                    </Text>
                  </TouchableOpacity>
                )}

                {podeEditar && (
                  <TouchableOpacity onPress={() => editar(r)} hitSlop={10}>
                    <Ionicons name="create-outline" size={22} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}

      <Folha visivel={Boolean(form)} titulo={form?.id_regiao ? 'Editar região' : 'Nova região'} onClose={() => setForm(null)}>
        {form && (
          <>
            <Campo rotulo="Nome" value={form.nome} onChangeText={campo('nome')} maxLength={100} />
            <Campo rotulo="Descrição" value={form.descricao} onChangeText={campo('descricao')} maxLength={255} />

            <Text style={styles.label}>Nível</Text>
            <Pills itens={NIVEIS} ativo={form.nivel} onChange={campo('nivel')} />

            <Campo
              rotulo="Área (WKT POLYGON, lon lat)"
              value={form.area_wkt}
              onChangeText={campo('area_wkt')}
              multiline
              style={{ minHeight: 90 }}
              autoCapitalize="characters"
              placeholder="POLYGON((-47.95 -24.60, -47.75 -24.60, ..., -47.95 -24.60))"
            />
            <Text style={styles.nota}>
              {form.id_regiao ? 'Deixe em branco para manter a área atual. ' : ''}O primeiro e o último ponto devem ser iguais.
            </Text>

            <View style={social.linhaDupla}>
              <View style={social.colunaMeia}>
                <Campo rotulo="Centro (latitude)" value={form.centro_lat} onChangeText={campo('centro_lat')} keyboardType="numbers-and-punctuation" />
              </View>
              <View style={social.espacoColuna} />
              <View style={social.colunaMeia}>
                <Campo rotulo="Centro (longitude)" value={form.centro_lng} onChangeText={campo('centro_lng')} keyboardType="numbers-and-punctuation" />
              </View>
            </View>

            <View style={styles.linhaSwitch}>
              <Text style={styles.label}>Região ativa</Text>
              <Switch value={form.ativo} onValueChange={campo('ativo')} trackColor={{ true: cores.laranja }} />
            </View>

            <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
            {!!form.id_regiao && <Botao titulo="Excluir região" variante="perigo" onPress={excluir} />}
          </>
        )}
      </Folha>
    </TelaPainel>
  );
}
