import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { mensagemDeErro } from '../../services/denuncias';
import { formatarData, tempoRelativo } from '../../services/formatadores';
import Avatar from '../../components/Avatar';
import TelaPainel from '../../components/TelaPainel';
import { Botao, BotaoMini, Campo, Carregando, Folha, Pills, Selo, Vazio } from '../../components/ui';
import { styles } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

const PAPEL_COR = { cidadao: '#3498db', agente: '#16a085', administrador: '#8e44ad' };

const FILTROS_ATIVO = [
  { chave: null, rotulo: 'Todos' },
  { chave: '1',  rotulo: 'Ativos' },
  { chave: '0',  rotulo: 'Inativos' },
];

export default function AdminUsuarios() {
  const [itens, setItens] = useState([]);
  const [papeis, setPapeis] = useState([]);
  const [podeEditar, setPodeEditar] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [filtroPapel, setFiltroPapel] = useState(null);
  const [filtroAtivo, setFiltroAtivo] = useState(null);

  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const buscar = useCallback(
    async (alvo = 1) => {
      try {
        const { data } = await api.get('/admin/usuarios.php', {
          params: {
            busca: buscaAplicada || undefined,
            id_papel: filtroPapel ?? undefined,
            ativo: filtroAtivo ?? undefined,
            pagina: alvo,
          },
        });
        setItens((atual) => (alvo === 1 ? data.itens : [...atual, ...data.itens]));
        setPapeis(data.papeis);
        setPodeEditar(data.pode_editar);
        setTemMais(data.tem_mais);
        setPagina(alvo);
      } catch (erro) {
        Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar os usuários.'));
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [buscaAplicada, filtroPapel, filtroAtivo]
  );

  useFocusEffect(
    useCallback(() => {
      buscar(1);
    }, [buscar])
  );

  function aplicarBusca() {
    setCarregando(true);
    setBuscaAplicada(busca.trim());
  }

  async function enviar(corpo, sucesso) {
    try {
      await api.post('/admin/usuarios.php', corpo);
      sucesso?.();
      await buscar(1);
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível concluir a ação.'));
    }
  }

  function alternarAtivo(u) {
    Alert.alert(
      u.ativo ? 'Desativar usuário' : 'Ativar usuário',
      u.ativo
        ? `Desativar "${u.nome}"? A conta perde acesso imediatamente.`
        : `Ativar "${u.nome}" novamente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: u.ativo ? 'Desativar' : 'Ativar',
          style: u.ativo ? 'destructive' : 'default',
          onPress: () => enviar({ acao: 'alternar_ativo', id_usuario: u.id_usuario }),
        },
      ]
    );
  }

  async function salvar() {
    if (!form.nome.trim() || !form.email.trim()) {
      Alert.alert('Atenção', 'Nome e e-mail são obrigatórios.');
      return;
    }
    setSalvando(true);
    await enviar(
      {
        acao: 'editar',
        id_usuario: form.id_usuario,
        nome: form.nome.trim(),
        email: form.email.trim(),
        id_papel: form.id_papel,
      },
      () => setForm(null)
    );
    setSalvando(false);
  }

  return (
    <TelaPainel titulo="Usuários" ativo="usuarios">
      <View style={{ paddingHorizontal: 20, marginBottom: 6 }}>
        <View style={[styles.busca, { marginHorizontal: 0 }]}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Nome ou e-mail exato"
            value={busca}
            onChangeText={setBusca}
            onSubmitEditing={aplicarBusca}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {buscaAplicada !== '' && (
            <TouchableOpacity
              onPress={() => {
                setBusca('');
                setBuscaAplicada('');
                setCarregando(true);
              }}
            >
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Pills
        itens={[{ chave: null, rotulo: 'Todos os papéis' }, ...papeis.map((p) => ({ chave: p.id_papel, rotulo: p.nome }))]}
        ativo={filtroPapel}
        onChange={(c) => {
          setCarregando(true);
          setFiltroPapel(c);
        }}
      />
      <Pills
        itens={FILTROS_ATIVO}
        ativo={filtroAtivo}
        onChange={(c) => {
          setCarregando(true);
          setFiltroAtivo(c);
        }}
      />

      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(i) => String(i.id_usuario)}
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
          ListEmptyComponent={<Vazio icone="people-outline" texto="Nenhum usuário encontrado." />}
          renderItem={({ item: u }) => (
            <View style={[styles.card, !u.ativo && { opacity: 0.6 }]}>
              <View style={social.linha}>
                <Avatar nome={u.nome} foto={u.foto_perfil} tamanho={44} />
                <View style={social.linhaTexto}>
                  <Text style={social.nome} numberOfLines={1}>{u.nome}</Text>
                  <Text style={social.meta} numberOfLines={1}>{u.email}</Text>
                </View>
                <Selo texto={u.papel} cor={PAPEL_COR[u.papel] ?? '#999'} />
              </View>

              <View style={[social.linha, { marginTop: 8 }]}>
                <Selo texto={u.ativo ? 'ativo' : 'inativo'} cor={u.ativo ? cores.verde : '#999'} />
                <View style={{ width: 6 }} />
                <Selo
                  texto={u.email_verificado ? 'e-mail ok' : 'e-mail pendente'}
                  cor={u.email_verificado ? cores.verde : '#bbb'}
                />
                {!u.ativo && (
                  <>
                    <View style={{ width: 6 }} />
                    <Selo texto="sem acesso" cor={cores.perigo} />
                  </>
                )}
              </View>

              <Text style={social.meta}>
                Conta criada {formatarData(u.created_at)}
                {u.ultimo_acesso ? ` · último acesso ${tempoRelativo(u.ultimo_acesso)}` : ' · nunca acessou'}
              </Text>

              {podeEditar && (
                <View style={social.botaoLinha}>
                  <BotaoMini
                    titulo="Editar"
                    onPress={() =>
                      setForm({
                        id_usuario: u.id_usuario,
                        nome: u.nome,
                        email: u.email,
                        id_papel: u.id_papel,
                      })
                    }
                  />
                  <BotaoMini
                    titulo={u.ativo ? 'Desativar' : 'Ativar'}
                    variante={u.ativo ? 'perigo' : 'contorno'}
                    onPress={() => alternarAtivo(u)}
                  />
                </View>
              )}
            </View>
          )}
        />
      )}

      <Folha visivel={Boolean(form)} titulo="Editar usuário" onClose={() => setForm(null)}>
        {form && (
          <>
            <Campo
              rotulo="Nome"
              value={form.nome}
              onChangeText={(v) => setForm((f) => ({ ...f, nome: v }))}
              maxLength={100}
            />
            <Campo
              rotulo="E-mail"
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={150}
            />

            <Text style={styles.label}>Papel</Text>
            <Pills
              itens={papeis.map((p) => ({ chave: p.id_papel, rotulo: p.nome }))}
              ativo={form.id_papel}
              onChange={(c) => setForm((f) => ({ ...f, id_papel: c }))}
            />

            <Text style={styles.nota}>
              Trocar o papel muda imediatamente as permissões do usuário. Alterar o e-mail força nova
              verificação.
            </Text>

            <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
          </>
        )}
      </Folha>
    </TelaPainel>
  );
}