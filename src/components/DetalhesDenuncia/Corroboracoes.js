import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { mensagemDeErro, urlImagem } from '../../services/denuncias';
import { anexarImagem, escolherImagem } from '../../services/imagens';
import { tempoRelativo } from '../../services/formatadores';
import Avatar from '../Avatar';
import { Botao, BotaoMini, Selo } from '../ui';
import { styles } from './styles';
import { cores, social } from '../../estilos/social';

export default function Corroboracoes({ dados, pode, onMudou, somenteLeitura = false }) {
  const [itens, setItens] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);

  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const moderador = pode('denuncia.moderar');
  const podeCorroborar = !somenteLeitura && pode('interacao.criar') && !dados.sou_autor;
  const minha = dados.minha_corroboracao;

  const carregar = useCallback(
    async (alvo = 1) => {
      try {
        const { data } = await api.get('/denuncias/corroboracoes.php', {
          params: { id_denuncia: dados.id_denuncia, pagina: alvo },
        });
        setItens((atual) => (alvo === 1 ? data.itens : [...atual, ...data.itens]));
        setTemMais(data.tem_mais);
        setPagina(alvo);
      } catch (erro) {
        console.error('Erro ao carregar corroborações:', erro.response?.status ?? erro.message);
      }
    },
    [dados.id_denuncia]
  );

  useEffect(() => {
    carregar(1);
  }, [carregar]);

  useEffect(() => {
    setDescricao(minha?.descricao ?? '');
    setImagem(null);
    // só reinicia ao trocar de denúncia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados.id_denuncia]);

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
      anexarImagem(form, 'imagem', imagem, 'corroboracao.jpg');

      const { data } = await api.post('/denuncias/corroborar.php', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      setImagem(null);
      await onMudou({ votos: data.votos, votou: data.votou }, true);
      await carregar(1);
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível enviar a corroboração.'));
    } finally {
      setEnviando(false);
    }
  }

  function removerMinha() {
    Alert.alert('Remover corroboração', 'Sua corroboração (incluindo texto e imagem) será removida.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            const { data } = await api.post('/denuncias/corroborar.php', { id_denuncia: dados.id_denuncia, acao: 'remover' });
            setDescricao('');
            setImagem(null);
            await onMudou({ votos: data.votos, votou: false }, true);
            await carregar(1);
          } catch (erro) {
            Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível remover.'));
          }
        },
      },
    ]);
  }

  async function moderar(item, acao) {
    try {
      await api.post('/denuncias/moderar_corroboracao.php', { id_corroboracao: item.id_corroboracao, acao });
      await carregar(1);
      await onMudou({}, true);
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível moderar.'));
    }
  }

  async function trocarImagem() {
    const nova = await escolherImagem();
    if (nova) setImagem(nova);
  }

  return (
    <View>
      <Text style={styles.secao}>Corroborações ({dados.votos})</Text>
      <Text style={social.meta}>
        {dados.evidencias} com texto ou imagem. O "Up" conta como corroboração simples.
      </Text>

      {itens.length === 0 && <Text style={styles.vazio}>Nenhuma evidência enviada ainda.</Text>}

      {itens.map((c) => (
        <View key={c.id_corroboracao} style={[social.contribuicao, c.oculta && { opacity: 0.55 }]}>
          <View style={social.contribuicaoTopo}>
            <View style={social.linha}>
              <Avatar nome={c.autor} foto={c.foto_perfil} tamanho={28} />
              <Text style={[social.nome, { marginLeft: 8, fontSize: 13 }]} numberOfLines={1}>
                {c.autor}{c.minha ? ' (você)' : ''}
              </Text>
            </View>
            <Text style={social.meta}>{tempoRelativo(c.created_at)}</Text>
          </View>

          <View style={[social.linha, { marginTop: 6 }]}>
            {c.validada && <Selo texto={`validada${c.validador ? ` por ${c.validador}` : ''}`} cor={cores.verde} />}
            {c.oculta && <Selo texto="oculta" cor="#999" />}
          </View>

          {!!c.descricao && <Text style={social.corpo}>{c.descricao}</Text>}
          {!!c.imagem && <Image source={{ uri: urlImagem(c.imagem) }} style={social.cartaoFoto} />}

          {moderador && !c.minha && (
            <View style={social.botaoLinha}>
              {!c.validada && <BotaoMini titulo="Validar" onPress={() => moderar(c, 'validar')} />}
              <BotaoMini titulo={c.oculta ? 'Exibir' : 'Ocultar'} variante="contorno" onPress={() => moderar(c, c.oculta ? 'exibir' : 'ocultar')} />
              {!c.oculta && <BotaoMini titulo="Spam" variante="perigo" onPress={() => moderar(c, 'spam')} />}
            </View>
          )}
        </View>
      ))}

      {temMais && (
        <TouchableOpacity onPress={() => carregar(pagina + 1)} style={{ marginTop: 10 }}>
          <Text style={[social.acaoInlineTexto, { color: cores.laranja, textAlign: 'center' }]}>Ver mais</Text>
        </TouchableOpacity>
      )}

      {!podeCorroborar && dados.sou_autor && !somenteLeitura && (
        <Text style={[styles.nota, { marginTop: 10, fontStyle: 'italic' }]}>
          Você é o autor desta denúncia. Outros usuários podem corroborar, mas você não pode confirmar a própria denúncia.
        </Text>
      )}

      {podeCorroborar && (
        <View>
          <Text style={styles.secao}>{minha?.descricao || minha?.imagem ? 'Minha corroboração' : 'Corroborar com evidência'}</Text>

          <TextInput
            style={styles.textarea}
            value={descricao}
            onChangeText={setDescricao}
            multiline
            maxLength={500}
            placeholder="Também vi isso? Descreva o que você observou..."
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

          <Botao titulo={minha ? 'Atualizar corroboração' : 'Enviar corroboração'} onPress={enviar} carregando={enviando} />
          {!!(minha?.descricao || minha?.imagem) && <Botao titulo="Remover minha corroboração" variante="perigo" onPress={removerMinha} />}
        </View>
      )}
    </View>
  );
}