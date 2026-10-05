import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../services/api';

export function useFotoPerfil() {
  const [foto, setFoto] = useState(null);
  const [falhou, setFalhou] = useState(false);

  // Relê ao ganhar foco, para refletir uma foto recém-trocada no perfil
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      (async () => {
        try {
          const salvo = await AsyncStorage.getItem('usuario');
          const usuario = salvo ? JSON.parse(salvo) : null;

          if (ativo) {
            setFoto(usuario?.foto_perfil ?? null);
            setFalhou(false);
          }
        } catch (erro) {
          console.error('Erro ao carregar foto de perfil:', erro);
        }
      })();

      return () => {
        ativo = false;
      };
    }, [])
  );

  const fotoUri =
    foto && !falhou ? `${api.defaults.baseURL}/uploads/${foto}` : null;

  return { fotoUri, aoFalhar: () => setFalhou(true) };
}