import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { obterUsuario } from '../services/sessao';

/**
 * Usuário autenticado + checagem de permissão.
 * Relê ao ganhar foco, para refletir troca de nome/papel/foto sem precisar relogar.
 */
export function useSessao() {
  const [usuario, setUsuario] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      obterUsuario().then((u) => {
        if (ativo) setUsuario(u);
      });

      return () => {
        ativo = false;
      };
    }, [])
  );

  const pode = useCallback(
    (permissao) => {
      if (!permissao) return true;
      return Boolean(usuario?.permissoes?.includes(permissao));
    },
    [usuario]
  );

  return { usuario, pode };
}