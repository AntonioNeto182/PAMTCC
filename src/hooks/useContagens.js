import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import api from '../services/api';

const ZERO = { nao_lidas: 0, amizades_pendentes: 0 };

/** Contadores para os selos do sino e do menu. Falha em silêncio: é só informativo. */
export function useContagens() {
  const [contagens, setContagens] = useState(ZERO);

  const recarregar = useCallback(async () => {
    try {
      const { data } = await api.get('/notificacoes/contagem.php');
      setContagens({ nao_lidas: data.nao_lidas, amizades_pendentes: data.amizades_pendentes });
    } catch {
      /* sem rede ou sessão expirada: o interceptor já cuida do 401 */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar])
  );

  return { ...contagens, recarregar };
}
