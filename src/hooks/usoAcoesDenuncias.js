import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import DetalhesDenuncia from '../components/DetalhesDenuncia';
import { mensagemDeErro, votar } from '../services/denuncias';

/** Trata as mensagens "votar" e "detalhes" vindas do WebView e renderiza a folha de detalhes. */
export function useAcoesDenuncia(webviewRef) {
  const [aberta, setAberta] = useState(null);

  const injetar = useCallback(
    (id, patch) => {
      webviewRef.current?.injectJavaScript(
        `atualizarDenuncia(${Number(id)}, ${JSON.stringify(patch)}); true;`
      );
    },
    [webviewRef]
  );

  // Retorna true se a mensagem era dele
  const tratarMensagem = useCallback(
    async (dados) => {
      const id = Number(dados.id_denuncia);

      if (dados.tipo === 'detalhes') {
        setAberta(id);
        return true;
      }

      if (dados.tipo === 'votar') {
        try {
          const resposta = await votar(id);
          injetar(id, { votos: resposta.votos, votou: resposta.votou });
        } catch (erro) {
          Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível registrar o voto.'));
          injetar(id, {}); // reabilita o botão
        }
        return true;
      }

      return false;
    },
    [injetar]
  );

  const modal = (
    <DetalhesDenuncia
      idDenuncia={aberta}
      onClose={() => setAberta(null)}
      onMudou={injetar}
    />
  );

  return { tratarMensagem, modal };
}