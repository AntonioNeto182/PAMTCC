import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import api from '../../services/api';
import { mensagemDeErro, obterUsuario, urlImagem, votar } from '../../services/denuncias';
import { styles } from './styles';

function formatarData(valor) {
  if (!valor) return '';
  const data = new Date(String(valor).replace(' ', 'T'));
  if (Number.isNaN(data.getTime())) return '';
  return `${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function DetalhesDenuncia({ idDenuncia, onClose, onMudou }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [votando, setVotando] = useState(false);
  const [idTipo, setIdTipo] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async (id) => {
    const usuario = await obterUsuario();
    const { data } = await api.get('/denuncias/detalhes.php', {
      params: { id, id_usuario: usuario?.id_usuario },
    });
    setDados(data);
    return data;
  }, []);

  useEffect(() => {
    if (!idDenuncia) {
      setDados(null);
      return undefined;
    }

    let ativo = true;
    setDescricao('');
    setImagem(null);
    setIdTipo(null);
    setCarregando(true);

    carregar(idDenuncia)
      .then((d) => {
        if (ativo) setIdTipo(d.tipos_atualizacao[0]?.id_tipo_atualizacao ?? null);
      })
      .catch((erro) => {
        console.error('Erro ao carregar denúncia:', erro);
        Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar a denúncia.'));
        onClose();
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
    // onClose é estável o bastante para este uso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idDenuncia, carregar]);

  async function alternarVoto() {
    if (votando || !dados) return;
    setVotando(true);

    try {
      const resposta = await votar(dados.id_denuncia);
      setDados((atual) => ({ ...atual, votos: resposta.votos, votou: resposta.votou }));
      onMudou(dados.id_denuncia, { votos: resposta.votos, votou: resposta.votou });
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível registrar o voto.'));
    } finally {
      setVotando(false);
    }
  }

  async function escolherImagem() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para anexar uma imagem.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (resultado.canceled) return;

    const original = resultado.assets[0];

    try {
      const acoes = original.width > 1280 ? [{ resize: { width: 1280 } }] : [];
      const reduzida = await ImageManipulator.manipulateAsync(original.uri, acoes, {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      setImagem({ uri: reduzida.uri });
    } catch (erro) {
      console.error('Erro ao reduzir imagem:', erro);
      setImagem({ uri: original.uri });
    }
  }

  async function enviar() {
    if (!descricao.trim()) {
      Alert.alert('Atenção', 'Descreva a atualização.');
      return;
    }

    const usuario = await obterUsuario();
    if (!usuario?.id_usuario) {
      Alert.alert('Atenção', 'Faça login para atualizar uma denúncia.');
      return;
    }

    setEnviando(true);

    try {
      const form = new FormData();
      form.append('id_denuncia', String(dados.id_denuncia));
      form.append('id_usuario', String(usuario.id_usuario));
      form.append('id_tipo_atualizacao', String(idTipo));
      form.append('descricao', descricao.trim());

      if (imagem) {
        form.append('imagem', { uri: imagem.uri, name: 'atualizacao.jpg', type: 'image/jpeg' });
      }

      await api.post('/denuncias/atualizacao.php', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const novo = await carregar(dados.id_denuncia);
      setDescricao('');
      setImagem(null);
      onMudou(novo.id_denuncia, { atualizacoes: novo.atualizacoes.length });
    } catch (erro) {
      console.error('Erro ao enviar atualização:', erro);
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível enviar a atualização.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      visible={Boolean(idDenuncia)}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.raiz}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.fundo} onPress={onClose} />

        <View style={styles.folha}>
          <View style={styles.folhaTopo}>
            <Text style={styles.folhaTitulo}>Denúncia</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {carregando || !dados ? (
            <ActivityIndicator style={styles.loading} size="large" color="#ff4b4b" />
          ) : (
            <ScrollView
              contentContainerStyle={styles.conteudo}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.linhaTopo}>
                <Text style={styles.tipo} numberOfLines={1}>{dados.tipo}</Text>
                <View style={[styles.statusBadge, { backgroundColor: dados.status_cor ?? '#999' }]}>
                  <Text style={styles.statusTexto}>{dados.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>

              <Text style={styles.meta}>
                Por {dados.autor} · {formatarData(dados.data_denuncia)}
              </Text>
              <Text style={styles.meta}>
                {[dados.endereco, dados.bairro].filter(Boolean).join(' — ')}
              </Text>

              <Text style={styles.descricao}>{dados.descricao || 'Sem descrição informada'}</Text>

              {dados.imagens.map((caminho) => (
                <View key={caminho} style={styles.fotoBloco}>
                  <Image source={{ uri: urlImagem(caminho) }} style={styles.foto} />
                  <Text style={styles.fotoCredito}>Foto de {dados.autor}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.upBotao, dados.votou && styles.upBotaoAtivo]}
                onPress={alternarVoto}
                disabled={votando}
              >
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color={dados.votou ? '#fff' : '#ff7b39'}
                />
                <Text style={[styles.upTexto, dados.votou && styles.upTextoAtivo]}>
                  {dados.votou ? 'Up dado' : 'Dar Up'} · {dados.votos}
                </Text>
              </TouchableOpacity>

              <Text style={styles.secao}>Atualizações ({dados.atualizacoes.length})</Text>

              {dados.atualizacoes.length === 0 && (
                <Text style={styles.vazio}>Nenhuma atualização ainda.</Text>
              )}

              {dados.atualizacoes.map((a) => (
                <View key={a.id_atualizacao} style={styles.atualizacao}>
                  <View style={styles.atualizacaoTopo}>
                    <Text style={styles.atualizacaoAutor} numberOfLines={1}>{a.autor}</Text>
                    <Text style={styles.atualizacaoData}>{formatarData(a.created_at)}</Text>
                  </View>

                  <View style={styles.chipFixo}>
                    <Text style={styles.chipFixoTexto}>{a.tipo}</Text>
                  </View>

                  <Text style={styles.atualizacaoTexto}>{a.descricao}</Text>

                  {a.imagem && (
                    <View style={styles.fotoBloco}>
                      <Image source={{ uri: urlImagem(a.imagem) }} style={styles.foto} />
                      <Text style={styles.fotoCredito}>Foto de {a.autor}</Text>
                    </View>
                  )}
                </View>
              ))}

              <Text style={styles.secao}>Adicionar atualização</Text>

              <View style={styles.chips}>
                {dados.tipos_atualizacao.map((t) => {
                  const ativo = t.id_tipo_atualizacao === idTipo;
                  return (
                    <TouchableOpacity
                      key={t.id_tipo_atualizacao}
                      style={[styles.chip, ativo && styles.chipAtivo]}
                      onPress={() => setIdTipo(t.id_tipo_atualizacao)}
                    >
                      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                        {t.rotulo}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.textarea}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                maxLength={500}
                placeholder="Conte o que mudou: continua, voltou, não foi resolvido..."
              />

              <TouchableOpacity style={styles.anexar} onPress={escolherImagem}>
                <Ionicons name="camera" size={18} color="#333" />
                <Text style={styles.anexarTexto}>
                  {imagem ? 'Trocar imagem' : 'Adicionar imagem (opcional)'}
                </Text>
              </TouchableOpacity>

              {imagem && (
                <View style={styles.fotoBloco}>
                  <Image source={{ uri: imagem.uri }} style={styles.foto} />
                  <TouchableOpacity style={styles.removerFoto} onPress={() => setImagem(null)}>
                    <Ionicons name="close-circle" size={26} color="#ff4b4b" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.enviar, (enviando || !idTipo) && styles.enviarDesabilitado]}
                onPress={enviar}
                disabled={enviando || !idTipo}
              >
                <Text style={styles.enviarTexto}>
                  {enviando ? 'Enviando...' : 'Enviar atualização'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}