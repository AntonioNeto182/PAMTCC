import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import api from '../../services/api';
import { mensagemDeErro } from '../../services/denuncias';
import { dataParaApi, formatarData, mascararData } from '../../services/formatadores';
import { useSessao } from '../../hooks/useSessao';
import TelaPainel from '../../components/TelaPainel';
import { Botao, Campo, Carregando, Folha, Pills, Vazio } from '../../components/ui';
import { styles } from '../../estilos/painel';
import { social } from '../../estilos/social';

const ORIGENS = ['denuncia', 'unidade_saude', 'vigilancia', 'outro'].map((o) => ({ chave: o, rotulo: o.replace('_', ' ') }));
const SEXOS = [{ chave: 'F', rotulo: 'Feminino' }, { chave: 'M', rotulo: 'Masculino' }, { chave: 'O', rotulo: 'Outro' }];

const novoForm = () => ({
  id_arbovirose: null,
  nome_paciente: '',
  idade: '',
  sexo: 'O',
  telefone: '',
  data_inicio_sintomas: '',
  data_notificacao: mascararData(new Date().toLocaleDateString('pt-BR').replace(/\D/g, '')),
  data_confirmacao: '',
  origem: 'unidade_saude',
  observacao: '',
});

export default function Casos() {
  const { pode } = useSessao();

  const [itens, setItens] = useState([]);
  const [arboviroses, setArboviroses] = useState([]);
  const [filtro, setFiltro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api
      .get('/denuncias/dominios.php')
      .then(({ data }) => setArboviroses(data.arboviroses))
      .catch(() => {});
  }, []);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get('/casos/listar.php', { params: { id_arbovirose: filtro ?? undefined } });
      setItens(data);
    } catch (erro) {
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar os casos.'));
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
    const notificacao = dataParaApi(form.data_notificacao);
    const sintomas = form.data_inicio_sintomas ? dataParaApi(form.data_inicio_sintomas) : '';
    const confirmacao = form.data_confirmacao ? dataParaApi(form.data_confirmacao) : '';

    if (!form.id_arbovirose || !form.nome_paciente.trim() || !notificacao) {
      Alert.alert('Atenção', 'Informe arbovirose, paciente e a data de notificação (DD/MM/AAAA).');
      return;
    }
    if ((form.data_inicio_sintomas && !sintomas) || (form.data_confirmacao && !confirmacao)) {
      Alert.alert('Atenção', 'Use o formato DD/MM/AAAA nas datas.');
      return;
    }

    setSalvando(true);
    try {
      await api.post('/casos/criar.php', {
        ...form,
        data_notificacao: notificacao,
        data_inicio_sintomas: sintomas,
        data_confirmacao: confirmacao,
      });
      setForm(null);
      await carregar();
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível registrar o caso.'));
    } finally {
      setSalvando(false);
    }
  }

  const campo = (chave) => (valor) => setForm((f) => ({ ...f, [chave]: valor }));
  const data = (chave) => (valor) => setForm((f) => ({ ...f, [chave]: mascararData(valor) }));

  return (
    <TelaPainel titulo="Casos epidemiológicos" ativo="casos">
      {pode('caso.editar') && (
        <View style={{ paddingHorizontal: 20 }}>
          <Botao titulo="Registrar caso" icone="add" onPress={() => setForm(novoForm())} />
        </View>
      )}

      <Pills
        itens={[{ chave: null, rotulo: 'Todos' }, ...arboviroses.map((a) => ({ chave: a.id_arbovirose, rotulo: a.nome }))]}
        ativo={filtro}
        onChange={(c) => { setCarregando(true); setFiltro(c); }}
      />

      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(i) => String(i.id_caso)}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregar(); }} />}
          ListEmptyComponent={<Vazio icone="medkit-outline" texto="Nenhum caso registrado." />}
          renderItem={({ item: c }) => (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                <Text style={styles.cardTitulo}>{c.nome_paciente}</Text>
                <Text style={social.meta}>{c.arbovirose}</Text>
              </View>
              <Text style={social.meta}>
                {[c.idade != null ? `${c.idade} anos` : null, c.sexo, c.bairro].filter(Boolean).join(' · ')}
              </Text>
              <Text style={social.corpo}>
                Notificado em {formatarData(c.data_notificacao)}
                {c.data_inicio_sintomas ? ` · sintomas desde ${formatarData(c.data_inicio_sintomas)}` : ''}
                {c.data_confirmacao ? ` · confirmado em ${formatarData(c.data_confirmacao)}` : ''}
              </Text>
              <Text style={social.meta}>Origem: {String(c.origem).replace('_', ' ')}{c.id_denuncia ? ` · denúncia #${c.id_denuncia}` : ''}</Text>
              {!!c.observacao && <Text style={social.corpo}>{c.observacao}</Text>}
            </View>
          )}
        />
      )}

      <Folha visivel={Boolean(form)} titulo="Registrar caso" onClose={() => setForm(null)}>
        {form && (
          <>
            <Text style={styles.label}>Arbovirose</Text>
            <Pills
              itens={arboviroses.map((a) => ({ chave: a.id_arbovirose, rotulo: a.nome }))}
              ativo={form.id_arbovirose}
              onChange={campo('id_arbovirose')}
            />

            <Campo rotulo="Paciente" value={form.nome_paciente} onChangeText={campo('nome_paciente')} maxLength={150} />

            <View style={social.linhaDupla}>
              <View style={social.colunaMeia}>
                <Campo rotulo="Idade" value={form.idade} onChangeText={(v) => campo('idade')(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={3} />
              </View>
              <View style={social.espacoColuna} />
              <View style={social.colunaMeia}>
                <Campo rotulo="Telefone" value={form.telefone} onChangeText={campo('telefone')} keyboardType="phone-pad" maxLength={20} />
              </View>
            </View>

            <Text style={styles.label}>Sexo</Text>
            <Pills itens={SEXOS} ativo={form.sexo} onChange={campo('sexo')} />

            <Campo rotulo="Início dos sintomas" value={form.data_inicio_sintomas} onChangeText={data('data_inicio_sintomas')} keyboardType="number-pad" placeholder="DD/MM/AAAA" maxLength={10} />
            <Campo rotulo="Data de notificação *" value={form.data_notificacao} onChangeText={data('data_notificacao')} keyboardType="number-pad" placeholder="DD/MM/AAAA" maxLength={10} />
            <Campo rotulo="Data de confirmação" value={form.data_confirmacao} onChangeText={data('data_confirmacao')} keyboardType="number-pad" placeholder="DD/MM/AAAA" maxLength={10} />

            <Text style={styles.label}>Origem</Text>
            <Pills itens={ORIGENS} ativo={form.origem} onChange={campo('origem')} />

            <Campo rotulo="Observação" value={form.observacao} onChangeText={campo('observacao')} multiline maxLength={500} style={{ minHeight: 80 }} />

            <Text style={styles.nota}>Dado clínico sensível: visível apenas a quem tem permissão de casos.</Text>
            <Botao titulo="Salvar caso" onPress={salvar} carregando={salvando} />
          </>
        )}
      </Folha>
    </TelaPainel>
  );
}
