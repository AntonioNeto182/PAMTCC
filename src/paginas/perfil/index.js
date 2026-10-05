import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../../services/api';
import { styles } from './styles';
import Logo from '../../../assets/icons/logo.png';

const CORES_DESTAQUE = ['#ff4b4b', '#ff7b39', '#1a73e8', '#8e44ad', '#16a085', '#e91e63'];
const COR_PADRAO = CORES_DESTAQUE[0];
const chaveCor = (id) => `perfil_cor:${id}`;

const FILTROS = [
  { chave: 'todas', rotulo: 'Todas' },
  { chave: 'abertas', rotulo: 'Em aberto' },
  { chave: 'resolvidas', rotulo: 'Resolvidas' },
];
const STATUS_FECHADOS = ['resolvida', 'rejeitada'];
const LIMITE_INICIAL = 4;

function formatarData(valor) {
  if (!valor) return '—';
  const data = new Date(String(valor).replace(' ', 'T'));
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR');
}

function filtrarDenuncias(denuncias, filtro) {
  if (filtro === 'abertas') return denuncias.filter((d) => !STATUS_FECHADOS.includes(d.status));
  if (filtro === 'resolvidas') return denuncias.filter((d) => d.status === 'resolvida');
  return denuncias;
}

function CardDenuncia({ item, cor, onPress }) {
  const uri = item.imagem
    ? `${api.defaults.baseURL}/uploads/${encodeURIComponent(item.imagem)}`
    : null;
  const endereco = [item.endereco, item.bairro].filter(Boolean).join(' — ');

  return (
    <TouchableOpacity style={styles.denunciaCard} onPress={() => onPress(item)} activeOpacity={0.85}>
      {uri ? (
        <Image source={{ uri }} style={styles.denunciaImagem} />
      ) : (
        <View style={[styles.denunciaImagem, styles.denunciaSemImagem]}>
          <Ionicons name="image-outline" size={28} color="#bbb" />
        </View>
      )}

      <View style={styles.denunciaInfo}>
        <View style={styles.denunciaTopo}>
          <Text style={styles.denunciaTipo} numberOfLines={1}>{item.tipo}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status_cor ?? '#999' }]}>
            <Text style={styles.statusTexto}>{item.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        <Text style={styles.denunciaDescricao} numberOfLines={2}>
          {item.descricao || 'Sem descrição informada'}
        </Text>

        <View style={styles.denunciaLinha}>
          <Ionicons name="location-outline" size={14} color="#888" />
          <Text style={styles.denunciaEndereco} numberOfLines={1}>{endereco}</Text>
        </View>

        <View style={styles.denunciaRodape}>
          <Text style={styles.denunciaData}>{formatarData(item.data_denuncia)}</Text>
          <Text style={[styles.verNoMapa, { color: cor }]}>Ver no mapa ›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Perfil() {
  const navigation = useNavigation();

  const [perfil, setPerfil] = useState(null);
  const [stats, setStats] = useState({ total: 0, em_aberto: 0, resolvidas: 0 });
  const [denuncias, setDenuncias] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [cor, setCor] = useState(COR_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  const irParaLogin = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [navigation]);

  const carregar = useCallback(async () => {
    try {
      const salvo = await AsyncStorage.getItem('usuario');
      const local = salvo ? JSON.parse(salvo) : null;

      if (!local?.id_usuario) {
        irParaLogin();
        return;
      }

      const corSalva = await AsyncStorage.getItem(chaveCor(local.id_usuario));
      if (corSalva) setCor(corSalva);

      const { data } = await api.get('/usuarios/perfil.php', {
        params: { id: local.id_usuario },
      });

      setPerfil(data.usuario);
      setStats(data.estatisticas);
      setNome(data.usuario.nome);
      setEmail(data.usuario.email);

      // Falha na lista não deve derrubar o perfil
      try {
        const resposta = await api.get('/denuncias/listar_usuario.php', {
          params: { id_usuario: local.id_usuario },
        });
        setDenuncias(resposta.data);
      } catch (erro) {
        console.error('Erro ao carregar denúncias do usuário:', erro);
      }
    } catch (erro) {
      console.error('Erro ao carregar perfil:', erro);
      Alert.alert(
        'Erro',
        erro.response?.data?.message ?? 'Não foi possível carregar o perfil.'
      );
    } finally {
      setCarregando(false);
    }
  }, [irParaLogin]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function sincronizarUsuarioLocal(novosDados) {
    const salvo = await AsyncStorage.getItem('usuario');
    const atual = salvo ? JSON.parse(salvo) : {};
    await AsyncStorage.setItem('usuario', JSON.stringify({ ...atual, ...novosDados }));
  }

  async function escolherCor(nova) {
    setCor(nova);
    if (perfil) await AsyncStorage.setItem(chaveCor(perfil.id_usuario), nova);
  }

  function verNoMapa(denuncia) {
    const params = {
      focarDenuncia: {
        id: denuncia.id_denuncia,
        latitude: denuncia.latitude,
        longitude: denuncia.longitude,
        ts: Date.now(), // garante novo foco mesmo ao clicar na mesma denúncia
      },
    };

    if (typeof navigation.popTo === 'function') navigation.popTo('Inicio', params);
    else navigation.navigate('Inicio', params);
  }

  async function trocarFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para alterar sua foto.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (resultado.canceled) return;

    const imagem = resultado.assets[0];
    setEnviandoFoto(true);

    try {
      const formData = new FormData();
      formData.append('id_usuario', String(perfil.id_usuario));
      formData.append('foto', {
        uri: imagem.uri,
        name: imagem.fileName ?? 'perfil.jpg',
        type: imagem.mimeType ?? 'image/jpeg',
      });

      const { data } = await api.post('/usuarios/foto.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPerfil((atual) => ({ ...atual, foto_perfil: data.foto_perfil }));
      await sincronizarUsuarioLocal({ foto_perfil: data.foto_perfil });
    } catch (erro) {
      console.error('Erro ao enviar foto:', erro);
      Alert.alert(
        'Erro',
        erro.response?.data?.message ?? 'Não foi possível enviar a foto.'
      );
    } finally {
      setEnviandoFoto(false);
    }
  }

  function cancelarEdicao() {
    setNome(perfil.nome);
    setEmail(perfil.email);
    setSenhaAtual('');
    setNovaSenha('');
    setEditando(false);
  }

  async function salvar() {
    const emailLimpo = email.trim().toLowerCase();
    const emailMudou = emailLimpo !== perfil.email;

    if (!nome.trim() || !emailLimpo) {
      Alert.alert('Atenção', 'Nome e e-mail são obrigatórios.');
      return;
    }

    if (novaSenha && novaSenha.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if ((emailMudou || novaSenha) && !senhaAtual) {
      Alert.alert('Atenção', 'Informe sua senha atual para alterar e-mail ou senha.');
      return;
    }

    setSalvando(true);

    try {
      const { data } = await api.post('/usuarios/atualizar.php', {
        id_usuario: perfil.id_usuario,
        nome: nome.trim(),
        email: emailLimpo,
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
      });

      setPerfil((atual) => ({ ...atual, nome: data.usuario.nome, email: data.usuario.email }));
      await sincronizarUsuarioLocal(data.usuario);

      setSenhaAtual('');
      setNovaSenha('');
      setEditando(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (erro) {
      Alert.alert(
        'Erro',
        erro.response?.data?.message ?? 'Não foi possível atualizar o perfil.'
      );
    } finally {
      setSalvando(false);
    }
  }

  function sair() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('usuario');
          irParaLogin();
        },
      },
    ]);
  }

  const fotoUri = perfil?.foto_perfil
    ? `${api.defaults.baseURL}/uploads/${perfil.foto_perfil}`
    : null;

  const filtradas = filtrarDenuncias(denuncias, filtro);
  const visiveis = mostrarTodas ? filtradas : filtradas.slice(0, LIMITE_INICIAL);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerLogo}>
          <Image source={Logo} style={styles.headerLogoImage} />
          <Text style={styles.headerLogoText}>SIMAV</Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {carregando && !perfil ? (
        <ActivityIndicator style={styles.loading} size="large" color="#ff4b4b" />
      ) : (
        perfil && (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={[styles.banner, { backgroundColor: cor }]} />

            <View style={styles.avatarArea}>
              <TouchableOpacity onPress={trocarFoto} disabled={enviandoFoto} activeOpacity={0.8}>
                <View style={[styles.avatar, { borderColor: cor }]}>
                  {fotoUri ? (
                    <Image source={{ uri: fotoUri }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={52} color="#bbb" />
                  )}
                  {enviandoFoto && (
                    <View style={styles.avatarLoading}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                </View>
                <View style={[styles.avatarEdit, { backgroundColor: cor }]}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>

              <Text style={styles.nome}>{perfil.nome}</Text>
              <Text style={styles.email}>{perfil.email}</Text>

              <View style={[styles.papelBadge, { backgroundColor: cor }]}>
                <Text style={styles.papelTexto}>{perfil.papel}</Text>
              </View>
            </View>

            <View style={styles.statsArea}>
              <View style={styles.statCard}>
                <Text style={[styles.statNumero, { color: cor }]}>{stats.total}</Text>
                <Text style={styles.statLabel}>Denúncias</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumero, { color: cor }]}>{stats.em_aberto}</Text>
                <Text style={styles.statLabel}>Em aberto</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumero, { color: cor }]}>{stats.resolvidas}</Text>
                <Text style={styles.statLabel}>Resolvidas</Text>
              </View>
            </View>

            <View style={styles.secaoHeader}>
              <Text style={styles.secaoTitulo}>Minhas denúncias</Text>
            </View>

            <View style={styles.filtrosArea}>
              {FILTROS.map((f) => {
                const ativo = f.chave === filtro;
                return (
                  <TouchableOpacity
                    key={f.chave}
                    style={[styles.filtroPill, ativo && { backgroundColor: cor, borderColor: cor }]}
                    onPress={() => {
                      setFiltro(f.chave);
                      setMostrarTodas(false);
                    }}
                  >
                    <Text style={[styles.filtroTexto, ativo && styles.filtroTextoAtivo]}>
                      {f.rotulo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {visiveis.length === 0 ? (
              <View style={styles.vazioArea}>
                <Ionicons name="document-text-outline" size={40} color="#ccc" />
                <Text style={styles.vazioTexto}>
                  {denuncias.length === 0
                    ? 'Você ainda não registrou denúncias.'
                    : 'Nenhuma denúncia neste filtro.'}
                </Text>
              </View>
            ) : (
              visiveis.map((item) => (
                <CardDenuncia
                  key={item.id_denuncia}
                  item={item}
                  cor={cor}
                  onPress={verNoMapa}
                />
              ))
            )}

            {filtradas.length > LIMITE_INICIAL && (
              <TouchableOpacity onPress={() => setMostrarTodas((v) => !v)}>
                <Text style={[styles.verMais, { color: cor }]}>
                  {mostrarTodas ? 'Ver menos' : `Ver todas (${filtradas.length})`}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Personalizar</Text>
              <Text style={styles.label}>Cor de destaque</Text>
              <View style={styles.coresArea}>
                {CORES_DESTAQUE.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.corOpcao, { backgroundColor: c }, c === cor && styles.corOpcaoAtiva]}
                    onPress={() => escolherCor(c)}
                  >
                    {c === cor && <Ionicons name="checkmark" size={18} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitulo}>Dados da conta</Text>
                {!editando && (
                  <TouchableOpacity onPress={() => setEditando(true)}>
                    <Text style={[styles.editarLink, { color: cor }]}>Editar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.label}>Nome completo</Text>
              <TextInput
                style={[styles.input, !editando && styles.inputDesabilitado]}
                value={nome}
                onChangeText={setNome}
                editable={editando}
                maxLength={100}
              />

              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[styles.input, !editando && styles.inputDesabilitado]}
                value={email}
                onChangeText={setEmail}
                editable={editando}
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={150}
              />

              {editando && (
                <>
                  <Text style={styles.label}>Nova senha (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    value={novaSenha}
                    onChangeText={setNovaSenha}
                    secureTextEntry
                    placeholder="Deixe em branco para manter"
                    maxLength={72}
                  />

                  <Text style={styles.label}>Senha atual</Text>
                  <TextInput
                    style={styles.input}
                    value={senhaAtual}
                    onChangeText={setSenhaAtual}
                    secureTextEntry
                    placeholder="Obrigatória para alterar e-mail ou senha"
                    maxLength={72}
                  />

                  <TouchableOpacity style={styles.button} onPress={salvar} disabled={salvando}>
                    <LinearGradient
                      colors={['#ff7b39', '#ff4b4b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.buttonText}>
                        {salvando ? 'Salvando...' : 'Salvar alterações'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={cancelarEdicao} disabled={salvando}>
                    <Text style={styles.cancelar}>Cancelar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Membro desde</Text>
                <Text style={styles.infoValor}>{formatarData(perfil.created_at)}</Text>
              </View>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Último acesso</Text>
                <Text style={styles.infoValor}>{formatarData(perfil.ultimo_acesso)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.sairButton} onPress={sair}>
              <Ionicons name="log-out-outline" size={20} color="#ff4b4b" />
              <Text style={styles.sairTexto}>Sair da conta</Text>
            </TouchableOpacity>
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}