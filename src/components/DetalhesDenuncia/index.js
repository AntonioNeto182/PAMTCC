import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { mensagemDeErro, urlImagem, votar } from '../../services/denuncias';
import { anexarImagem, escolherImagem } from '../../services/imagens';
import { formatarDataHora } from '../../services/formatadores';
import { useSessao } from '../../hooks/useSessao';
import { useTecladoAltura } from '../../hooks/useTecladoAltura';
import Corroboracoes from './Corroboracoes';
import Gestao from './Gestao';
import { styles } from './styles';
import { cores, social } from '../../estilos/social';

const ROTULO_EVENTO = {
  denuncia: 'Denúncia registrada',
  status: 'Mudança de status',
  corroboracao: 'Corroboração',
  atualizacao: 'Atualização',
  comentario: 'Comentário',
  vistoria: 'Vistoria',
  foco_confirmado: 'Foco confirmado',
  foco_eliminado: 'Foco eliminado',
};

const DURACAO_TOAST_MS = 2000;
const STATUS_ENCERRADOS = ['resolvida', 'rejeitada'];

function LinhaDoTempo({ idDenuncia }) {
  const [aberta, setAberta] = useState(false);
  const [itens, setItens] = useState(null);

  async function alternar() {
    const abrir = !aberta;
    setAberta(abrir);

    if (abrir && itens === null) {
      try {
        const { data } = await api.get('/denuncias/linha_do_tempo.php', { params: { id_denuncia: idDenuncia } });
        setItens(data.itens);
      } catch (erro) {
        setItens([]);
        Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar o histórico.'));
      }
    }
  }

  return (
    <View>
      <TouchableOpacity style={[social.linha, { justifyContent: 'space-between', marginTop: 22 }]} onPress={alternar}>
        <Text style={[styles.secao, { marginTop: 0 }]}>Histórico</Text>
        <Ionicons name={aberta ? 'chevron-up' : 'chevron-down'} size={18} color="#888" />
      </TouchableOpacity>

      {aberta && itens === null && <ActivityIndicator style={{ marginTop: 10 }} color={cores.vermelho} />}
      {aberta &&
        itens?.map((e, idx) => (
          <View key={`${e.tipo_evento}-${e.referencia_id}-${idx}`} style={[social.linha, { alignItems: 'flex-start', marginTop: 10 }]}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cores.laranja, marginTop: 5 }} />
            <View style={social.linhaTexto}>
              <Text style={social.nome}>{ROTULO_EVENTO[e.tipo_evento] ?? e.tipo_evento}</Text>
              {!!e.descricao && <Text style={social.corpo} numberOfLines={3}>{e.descricao}</Text>}
              <Text style={social.meta}>
                {e.autor} · {formatarDataHora(e.ocorrido_em)}
              </Text>
            </View>
          </View>
        ))}
      {aberta && itens?.length === 0 && <Text style={styles.vazio}>Sem eventos.</Text>}
    </View>
  );
}

export default function DetalhesDenuncia({ idDenuncia, onClose, onMudou, modo = 'normal' }) {
  const { pode } = useSessao();
  const tecladoAltura = useTecladoAltura();
  const somenteModeracao = modo === 'moderacao';

  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [votando, setVotando] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // ---------- Toast ----------
  const [toast, setToast] = useState(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef(null);

  const mostrarToast = useCallback(
    (mensagem) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);

      setToast(mensagem);
      toastAnim.setValue(0);

      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      toastTimer.current = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, DURACAO_TOAST_MS);
    },
    [toastAnim]
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!idDenuncia && toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
      setToast(null);
    }
  }, [idDenuncia]);

  const carregar = useCallback(async (id) => {
    const { data } = await api.get('/denuncias/detalhes.php', { params: { id } });
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
    setCarregando(true);

    carregar(idDenuncia)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idDenuncia, carregar]);

  const mudou = useCallback(
    async (patch = {}, recarregar = false) => {
      if (!idDenuncia) return;

      if (recarregar) {
        const novo = await carregar(idDenuncia);
        onMudou(novo.id_denuncia, {
          votos: novo.votos,
          votou: novo.votou,
          atualizacoes: novo.atualizacoes.length,
          status: novo.status,
          status_cor: novo.status_cor,
        });
      } else if (Object.keys(patch).length) {
        onMudou(idDenuncia, patch);
      }
    },
    [idDenuncia, carregar, onMudou]
  );

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

  async function alternarFavorito() {
    try {
      const { data } = await api.post('/favoritos/alternar.php', { id_denuncia: dados.id_denuncia });
      setDados((atual) => ({ ...atual, favoritada: data.favoritada }));
      mostrarToast(data.favoritada ? 'Adicionada aos favoritos' : 'Removida dos favoritos');
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível favoritar.'));
    }
  }

  async function trocarImagem() {
    const nova = await escolherImagem();
    if (nova) setImagem(nova);
  }

  async function enviar() {
    if (!descricao.trim() && !imagem) {
      Alert.alert('Atenção', 'Escreva uma descrição ou anexe uma imagem.');
      return;
    }

    setEnviando(true);

    try {
      const form = new FormData();
      form.append('id_denuncia', String(dados.id_denuncia));
      form.append('descricao', descricao.trim());
      anexarImagem(form, 'imagem', imagem, 'atualizacao.jpg');

      await api.post('/denuncias/atualizacao.php', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      setDescricao('');
      setImagem(null);
      await mudou({}, true);
      mostrarToast('Atualização enviada');
    } catch (erro) {
      console.error('Erro ao enviar atualização:', erro.response?.status, erro.response?.data ?? erro.message);
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível enviar a atualização.'));
    } finally {
      setEnviando(false);
    }
  }

  const encerrada = Boolean(dados && STATUS_ENCERRADOS.includes(dados.status));

  const podeInteragir = pode('interacao.criar') && !somenteModeracao;
  // Quem não é o autor corrobora; o autor não pode dar Up na própria denúncia.
  // Denúncias encerradas (resolvida/rejeitada) não aceitam Up.
  const podeVotar = podeInteragir && dados && !dados.sou_autor && !encerrada;
  // Só o autor adiciona atualização — e nunca depois de encerrada.
  const podeAtualizar = podeInteragir && dados && dados.sou_autor && !encerrada;

  return (
    <Modal
      visible={Boolean(idDenuncia)}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.raiz, { paddingBottom: tecladoAltura }]}>
        <Pressable style={styles.fundo} onPress={onClose} />

        <View style={[styles.folha, tecladoAltura > 0 && styles.folhaComTeclado]}>
          <View style={styles.folhaTopo}>
            <View style={social.linha}>
              <Text style={styles.folhaTitulo}>Denúncia</Text>
              {somenteModeracao && (
                <View
                  style={{
                    marginLeft: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    backgroundColor: '#fff3ec',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: cores.laranja }}>
                    MODERAÇÃO
                  </Text>
                </View>
              )}
            </View>
            <View style={social.linha}>
              {dados && podeInteragir && (
                <TouchableOpacity onPress={alternarFavorito} hitSlop={12} style={{ marginRight: 18 }}>
                  <Ionicons name={dados.favoritada ? 'star' : 'star-outline'} size={24} color={cores.laranja} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          {carregando || !dados ? (
            <ActivityIndicator style={styles.loading} size="large" color="#ff4b4b" />
          ) : (
            <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
              <View style={styles.linhaTopo}>
                <Text style={styles.tipo} numberOfLines={1}>{dados.tipo}</Text>
                <View style={[styles.statusBadge, { backgroundColor: dados.status_cor ?? '#999' }]}>
                  <Text style={styles.statusTexto}>{dados.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>

              <Text style={styles.meta}>
                Por {dados.autor} · {formatarDataHora(dados.data_denuncia)}
              </Text>
              <Text style={styles.meta}>
                {[dados.endereco, dados.bairro].filter(Boolean).join(' — ')}
              </Text>

              {somenteModeracao && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: '#fff3ec',
                    borderLeftWidth: 3,
                    borderLeftColor: cores.laranja,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: cores.laranja, marginBottom: 2 }}>
                    MODO MODERAÇÃO
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    As ações de gestão estão logo abaixo. Role a tela para alterar status, registrar vistoria ou encaminhar.
                  </Text>
                </View>
              )}

              {!!dados.id_denuncia_principal && (
                <Text style={[styles.meta, { color: cores.perigo }]}>
                  Marcada como duplicada da denúncia #{dados.id_denuncia_principal}
                </Text>
              )}

              <Text style={styles.descricao}>{dados.descricao || 'Sem descrição informada'}</Text>

              {dados.imagens.map((caminho) => (
                <View key={caminho} style={styles.fotoBloco}>
                  <Image source={{ uri: urlImagem(caminho) }} style={styles.foto} />
                  <Text style={styles.fotoCredito}>Foto de {dados.autor}</Text>
                </View>
              ))}

              {podeVotar && (
                <TouchableOpacity
                  style={[styles.upBotao, dados.votou && styles.upBotaoAtivo]}
                  onPress={alternarVoto}
                  disabled={votando}
                >
                  <Ionicons name="arrow-up" size={18} color={dados.votou ? '#fff' : '#ff7b39'} />
                  <Text style={[styles.upTexto, dados.votou && styles.upTextoAtivo]}>
                    {dados.votou ? 'Up dado' : 'Dar Up'} · {dados.votos}
                  </Text>
                </TouchableOpacity>
              )}

              <Corroboracoes
                dados={dados}
                pode={pode}
                onMudou={mudou}
                somenteLeitura={somenteModeracao || encerrada}
              />

              <Text style={styles.secao}>Atualizações ({dados.atualizacoes.length})</Text>

              {dados.atualizacoes.length === 0 && <Text style={styles.vazio}>Nenhuma atualização ainda.</Text>}

              {dados.atualizacoes.map((a) => (
                <View key={a.id_atualizacao} style={styles.atualizacao}>
                  <View style={styles.atualizacaoTopo}>
                    <Text style={styles.atualizacaoAutor} numberOfLines={1}>{a.autor}</Text>
                    <Text style={styles.atualizacaoData}>{formatarDataHora(a.created_at)}</Text>
                  </View>

                  {!!a.descricao && <Text style={styles.atualizacaoTexto}>{a.descricao}</Text>}

                  {a.imagem && (
                    <View style={styles.fotoBloco}>
                      <Image source={{ uri: urlImagem(a.imagem) }} style={styles.foto} />
                      <Text style={styles.fotoCredito}>Foto de {a.autor}</Text>
                    </View>
                  )}
                </View>
              ))}

              {/* Autor pode adicionar atualização — só se não estiver encerrada */}
              {podeAtualizar && (
                <>
                  <Text style={styles.secao}>Adicionar atualização</Text>

                  <TextInput
                    style={styles.textarea}
                    value={descricao}
                    onChangeText={setDescricao}
                    multiline
                    maxLength={500}
                    placeholder="Conte o que mudou: continua, voltou, não foi resolvido..."
                  />

                  <TouchableOpacity style={styles.anexar} onPress={trocarImagem}>
                    <Ionicons name="camera" size={18} color="#333" />
                    <Text style={styles.anexarTexto}>{imagem ? 'Trocar imagem' : 'Adicionar imagem (opcional)'}</Text>
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
                    style={[styles.enviar, enviando && styles.enviarDesabilitado]}
                    onPress={enviar}
                    disabled={enviando}
                  >
                    <Text style={styles.enviarTexto}>{enviando ? 'Enviando...' : 'Enviar atualização'}</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Não-autor vê uma nota explicando por que não pode atualizar (só se não estiver encerrada) */}
              {podeInteragir && !encerrada && !dados.sou_autor && dados.atualizacoes.length > 0 && (
                <Text style={[styles.nota, { marginTop: 12, fontStyle: 'italic' }]}>
                  Somente o autor da denúncia pode adicionar novas atualizações.
                </Text>
              )}

              {/* Denúncia encerrada: avisa que nem atualização nem corroboração são aceitas */}
              {podeInteragir && encerrada && (
                <Text style={[styles.nota, { marginTop: 12, fontStyle: 'italic' }]}>
                  Esta denúncia está encerrada. Não é possível adicionar atualizações nem corroborações.
                </Text>
              )}

              <Gestao
                dados={dados}
                pode={pode}
                onMudou={mudou}
                secoesAbertas={somenteModeracao}
                onToast={mostrarToast}
              />

              <LinhaDoTempo idDenuncia={dados.id_denuncia} />
            </ScrollView>
          )}
        </View>

        {toast && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 20,
              right: 20,
              bottom: 30,
              backgroundColor: '#1f2937',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
                {
                  scale: toastAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.92, 1.03, 1],
                  }),
                },
              ],
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
            <Text
              style={{
                color: '#fff',
                marginLeft: 8,
                fontWeight: '600',
                fontSize: 14,
                flex: 1,
              }}
              numberOfLines={2}
            >
              {toast}
            </Text>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}