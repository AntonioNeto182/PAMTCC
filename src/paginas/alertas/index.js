import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { mensagemDeErro } from '../../services/denuncias';
import { formatarDataHora } from '../../services/formatadores';
import SeletorRegiao from '../../components/SeletorRegiao';
import TelaPainel from '../../components/TelaPainel';
import { Botao, BotaoMini, Campo, Carregando, Folha, Pills, Selo, Vazio } from '../../components/ui';
import { styles } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

const COR = { atencao: '#f39c12', alto: '#e67e22', critico: '#c0392b' };
const NIVEIS = ['atencao', 'alto', 'critico'].map((n) => ({ chave: n, rotulo: n }));

export default function Alertas() {
  const route = useRoute();
  const idRegiao = route.params?.idRegiao ?? null;

  const [itens, setItens] = useState([]);
  const [regioes, setRegioes] = useState([]);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [podeEditar, setPodeEditar] = useState(false);
  const [todos, setTodos] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get('/alertas/listar.php', {
        params: { todos: todos ? 1 : 0, id_regiao: idRegiao ?? undefined },
      });
      setItens(data.itens);
      setPodeEditar(data.pode_editar);
    } catch (erro) {
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar os alertas.'));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [todos, idRegiao]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function abrirForm() {
    try {
      if (!regioes.length) {
        const { data } = await api.get('/regioes/listar.php');
        setRegioes(data.itens);
        setForm({ id_regiao: idRegiao ?? data.itens[0]?.id_regiao ?? null, nivel: 'atencao', titulo: '', descricao: '' });
      } else {
        setForm({ id_regiao: idRegiao ?? regioes[0].id_regiao, nivel: 'atencao', titulo: '', descricao: '' });
      }
    } catch (erro) {
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar as regiões.'));
    }
  }

  async function criar() {
    if (!form.id_regiao || !form.titulo.trim()) {
      Alert.alert('Atenção', 'Escolha a região e informe o título.');
      return;
    }

    setSalvando(true);
    try {
      const { data } = await api.post('/alertas/salvar.php', form);
      setForm(null);
      Alert.alert('Alerta criado', `${data.avisados} pessoa(s) foram avisadas.`);
      await carregar();
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível criar o alerta.'));
    } finally {
      setSalvando(false);
    }
  }

  function encerrar(a) {
    Alert.alert('Encerrar alerta', `Encerrar "${a.titulo}" agora?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Encerrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/alertas/salvar.php', { acao: 'encerrar', id_alerta: a.id_alerta });
            await carregar();
          } catch (erro) {
            Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível encerrar.'));
          }
        },
      },
    ]);
  }

  const campo = (chave) => (valor) => setForm((f) => ({ ...f, [chave]: valor }));

  return (
    <TelaPainel titulo="Alertas" ativo="alertas">
      {podeEditar && (
        <View style={{ paddingHorizontal: 20 }}>
          <Botao titulo="Novo alerta" icone="add" onPress={abrirForm} />
          <Pills
            itens={[{ chave: 'vigentes', rotulo: 'Vigentes' }, { chave: 'todos', rotulo: 'Histórico' }]}
            ativo={todos ? 'todos' : 'vigentes'}
            onChange={(c) => setTodos(c === 'todos')}
          />
        </View>
      )}

      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(i) => String(i.id_alerta)}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregar(); }} />}
          ListEmptyComponent={<Vazio icone="shield-checkmark-outline" texto="Nenhum alerta vigente." />}
          renderItem={({ item: a }) => (
            <View style={[styles.card, !a.vigente && { opacity: 0.6 }]}>
              <View style={styles.cardTopo}>
                <Text style={styles.cardTitulo}>{a.titulo}</Text>
                <Selo texto={a.nivel} cor={COR[a.nivel]} />
              </View>
              <Text style={social.meta}>{a.regiao}</Text>
              {!!a.descricao && <Text style={social.corpo}>{a.descricao}</Text>}
              <Text style={social.meta}>
                {formatarDataHora(a.inicio_em)}
                {a.fim_em ? ` → ${formatarDataHora(a.fim_em)}` : ' · sem data de término'}
              </Text>

              {podeEditar && a.vigente && (
                <View style={social.botaoLinha}>
                  <BotaoMini titulo="Encerrar" variante="perigo" onPress={() => encerrar(a)} />
                </View>
              )}
            </View>
          )}
        />
      )}

      <Folha
        visivel={Boolean(form)}
        titulo="Novo alerta"
        onClose={() => {
          setForm(null);
          setMostrarMapa(false);
        }}
      >
        {form && (
          <>
            <View style={[social.linha, { justifyContent: 'space-between', marginTop: 14 }]}>
              <Text style={[styles.label, { marginTop: 0 }]}>Região</Text>
              <TouchableOpacity
                style={social.linha}
                onPress={() => setMostrarMapa((v) => !v)}
              >
                <Ionicons
                  name={mostrarMapa ? 'list-outline' : 'map-outline'}
                  size={16}
                  color={cores.laranja}
                />
                <Text style={[social.acaoInlineTexto, { color: cores.laranja, marginLeft: 4 }]}>
                  {mostrarMapa ? 'Ver lista' : 'Escolher no mapa'}
                </Text>
              </TouchableOpacity>
            </View>

            {mostrarMapa ? (
              <SeletorRegiao
                altura={280}
                onSelecionar={(r) => {
                  if (r) campo('id_regiao')(r.id_regiao);
                }}
              />
            ) : (
              <Pills
                itens={regioes.map((r) => ({ chave: r.id_regiao, rotulo: r.nome }))}
                ativo={form.id_regiao}
                onChange={campo('id_regiao')}
              />
            )}

            {form.id_regiao && (
              <Text style={[social.meta, { marginTop: 6 }]}>
                Região selecionada: {regioes.find((r) => r.id_regiao === form.id_regiao)?.nome ?? '(no mapa)'}
              </Text>
            )}

            <Text style={styles.label}>Nível</Text>
            <Pills itens={NIVEIS} ativo={form.nivel} onChange={campo('nivel')} />

            <Campo rotulo="Título" value={form.titulo} onChangeText={campo('titulo')} maxLength={150} />
            <Campo
              rotulo="Descrição (opcional)"
              value={form.descricao}
              onChangeText={campo('descricao')}
              maxLength={500}
              multiline
              style={{ minHeight: 80 }}
            />

            <Text style={styles.nota}>Quem acompanha a região com avisos ligados receberá uma notificação.</Text>
            <Botao titulo="Publicar alerta" onPress={criar} carregando={salvando} />
          </>
        )}
      </Folha>
    </TelaPainel>
  );
}