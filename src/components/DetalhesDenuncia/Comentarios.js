import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { mensagemDeErro } from '../../services/denuncias';
import { tempoRelativo } from '../../services/formatadores';
import Avatar from '../Avatar';
import { Botao } from '../ui';
import { styles } from './styles';
import { cores, social } from '../../estilos/social';

export default function Comentarios({ idDenuncia, pode, onTotal }) {
  const [itens, setItens] = useState([]);
  const [texto, setTexto] = useState('');
  const [resposta, setResposta] = useState(null); // comentário raiz sendo respondido
  const [edicao, setEdicao] = useState(null); // comentário sendo editado
  const [enviando, setEnviando] = useState(false);

  const podeComentar = pode('interacao.criar');

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get('/comentarios/listar.php', { params: { id_denuncia: idDenuncia } });
      setItens(data.itens);
      onTotal?.(data.itens.filter((c) => !c.removido).length);
    } catch (erro) {
      console.error('Erro ao carregar comentários:', erro.response?.status ?? erro.message);
    }
  }, [idDenuncia, onTotal]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const arvore = useMemo(() => {
    const raizes = itens.filter((c) => c.id_comentario_pai == null);
    return raizes.map((r) => ({ ...r, respostas: itens.filter((c) => c.id_comentario_pai === r.id_comentario) }));
  }, [itens]);

  function limpar() {
    setTexto('');
    setResposta(null);
    setEdicao(null);
  }

  async function enviar() {
    if (!texto.trim()) return;
    setEnviando(true);

    try {
      if (edicao) {
        await api.post('/comentarios/alterar.php', { acao: 'editar', id_comentario: edicao.id_comentario, texto: texto.trim() });
      } else {
        await api.post('/comentarios/criar.php', {
          id_denuncia: idDenuncia,
          texto: texto.trim(),
          id_comentario_pai: resposta?.id_comentario ?? null,
        });
      }
      limpar();
      await carregar();
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível enviar o comentário.'));
    } finally {
      setEnviando(false);
    }
  }

  function remover(c) {
    Alert.alert('Remover comentário', 'Deseja remover este comentário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/comentarios/alterar.php', { acao: 'remover', id_comentario: c.id_comentario });
            await carregar();
          } catch (erro) {
            Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível remover.'));
          }
        },
      },
    ]);
  }

  const bloco = (c, filha = false) => (
    <View key={c.id_comentario} style={[social.contribuicao, filha && social.contribuicaoFilha]}>
      <View style={social.contribuicaoTopo}>
        <View style={social.linha}>
          <Avatar nome={c.autor} foto={c.foto_perfil} tamanho={26} />
          <Text style={[social.nome, { marginLeft: 8, fontSize: 13 }]} numberOfLines={1}>{c.autor}</Text>
        </View>
        <Text style={social.meta}>
          {tempoRelativo(c.created_at)}{c.editado_em ? ' · editado' : ''}
        </Text>
      </View>

      {c.removido ? (
        <Text style={[social.corpo, { fontStyle: 'italic', color: '#aaa' }]}>Comentário removido</Text>
      ) : (
        <Text style={social.corpo}>{c.texto}</Text>
      )}

      {!c.removido && (
        <View style={social.acoesInline}>
          {podeComentar && !filha && (
            <TouchableOpacity style={social.acaoInline} onPress={() => { setEdicao(null); setResposta(c); }}>
              <Ionicons name="arrow-undo-outline" size={14} color="#666" />
              <Text style={social.acaoInlineTexto}>Responder</Text>
            </TouchableOpacity>
          )}
          {c.meu && (
            <TouchableOpacity style={social.acaoInline} onPress={() => { setResposta(null); setEdicao(c); setTexto(c.texto); }}>
              <Ionicons name="create-outline" size={14} color="#666" />
              <Text style={social.acaoInlineTexto}>Editar</Text>
            </TouchableOpacity>
          )}
          {c.pode_remover && (
            <TouchableOpacity style={social.acaoInline} onPress={() => remover(c)}>
              <Ionicons name="trash-outline" size={14} color={cores.perigo} />
              <Text style={[social.acaoInlineTexto, { color: cores.perigo }]}>Remover</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View>
      <Text style={styles.secao}>Comentários ({itens.filter((c) => !c.removido).length})</Text>

      {arvore.length === 0 && <Text style={styles.vazio}>Seja o primeiro a comentar.</Text>}

      {arvore.map((c) => (
        <View key={c.id_comentario}>
          {bloco(c)}
          {c.respostas.map((r) => bloco(r, true))}
        </View>
      ))}

      {podeComentar && (
        <View style={{ marginTop: 12 }}>
          {(resposta || edicao) && (
            <View style={[social.linha, { justifyContent: 'space-between', marginBottom: 6 }]}>
              <Text style={social.meta}>
                {edicao ? 'Editando seu comentário' : `Respondendo a ${resposta.autor}`}
              </Text>
              <TouchableOpacity onPress={limpar}>
                <Text style={[social.acaoInlineTexto, { color: cores.perigo }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.textarea}
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={1000}
            placeholder="Escreva um comentário..."
          />
          <Botao titulo={edicao ? 'Salvar edição' : 'Comentar'} onPress={enviar} carregando={enviando} desabilitado={!texto.trim()} />
        </View>
      )}
    </View>
  );
}
