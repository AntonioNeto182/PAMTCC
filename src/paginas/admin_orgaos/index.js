import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import api from '../../services/api';
import { mensagemDeErro } from '../../services/denuncias';
import TelaPainel from '../../components/TelaPainel';
import { Botao, BotaoMini, Campo, Carregando, Folha, Pills, Selo, Vazio } from '../../components/ui';
import { styles } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

const ESFERAS = ['municipal', 'estadual', 'federal'].map((e) => ({ chave: e, rotulo: e }));
const VAZIO = { id_orgao: null, nome: '', sigla: '', esfera: 'municipal', contato_email: '' };

export default function AdminOrgaos() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get('/orgaos/listar.php');
      setItens(data.itens);
    } catch (erro) {
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar os órgãos.'));
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

  async function enviar(corpo, sucesso) {
    try {
      await api.post('/orgaos/salvar.php', corpo);
      sucesso?.();
      await carregar();
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível concluir a ação.'));
    }
  }

  async function salvar() {
    if (!form.nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome do órgão.');
      return;
    }
    setSalvando(true);
    await enviar(form, () => setForm(null));
    setSalvando(false);
  }

  function excluir(o) {
    Alert.alert('Excluir órgão', `Excluir "${o.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => enviar({ acao: 'excluir', id_orgao: o.id_orgao }) },
    ]);
  }

  const campo = (chave) => (valor) => setForm((f) => ({ ...f, [chave]: valor }));

  return (
    <TelaPainel titulo="Órgãos públicos" ativo="orgaos">
      <View style={{ paddingHorizontal: 20 }}>
        <Botao titulo="Novo órgão" icone="add" onPress={() => setForm({ ...VAZIO })} />
      </View>

      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(i) => String(i.id_orgao)}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregar(); }} />}
          ListEmptyComponent={<Vazio icone="business-outline" texto="Nenhum órgão cadastrado." />}
          renderItem={({ item: o }) => (
            <View style={[styles.card, !o.ativo && { opacity: 0.6 }]}>
              <View style={styles.cardTopo}>
                <Text style={styles.cardTitulo}>{o.nome}</Text>
                <Selo texto={o.ativo ? 'ativo' : 'inativo'} cor={o.ativo ? cores.verde : '#999'} />
              </View>
              <Text style={social.meta}>
                {[o.sigla, o.esfera, o.contato_email].filter(Boolean).join(' · ')}
              </Text>

              <View style={social.botaoLinha}>
                <BotaoMini titulo="Editar" onPress={() => setForm({ ...o, sigla: o.sigla ?? '', contato_email: o.contato_email ?? '' })} />
                <BotaoMini titulo={o.ativo ? 'Desativar' : 'Ativar'} variante="contorno" onPress={() => enviar({ acao: 'alternar', id_orgao: o.id_orgao })} />
                <BotaoMini titulo="Excluir" variante="perigo" onPress={() => excluir(o)} />
              </View>
            </View>
          )}
        />
      )}

      <Folha visivel={Boolean(form)} titulo={form?.id_orgao ? 'Editar órgão' : 'Novo órgão'} onClose={() => setForm(null)}>
        {form && (
          <>
            <Campo rotulo="Nome *" value={form.nome} onChangeText={campo('nome')} maxLength={150} />
            <Campo rotulo="Sigla" value={form.sigla} onChangeText={campo('sigla')} maxLength={20} autoCapitalize="characters" />
            <Text style={styles.label}>Esfera</Text>
            <Pills itens={ESFERAS} ativo={form.esfera} onChange={campo('esfera')} />
            <Campo rotulo="E-mail de contato" value={form.contato_email} onChangeText={campo('contato_email')} keyboardType="email-address" autoCapitalize="none" maxLength={150} />
            <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
          </>
        )}
      </Folha>
    </TelaPainel>
  );
}
