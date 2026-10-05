import AsyncStorage from '@react-native-async-storage/async-storage';

import api from './api';

export async function obterUsuario() {
  try {
    const salvo = await AsyncStorage.getItem('usuario');
    return salvo ? JSON.parse(salvo) : null;
  } catch {
    return null;
  }
}

export const urlImagem = (caminho) => `${api.defaults.baseURL}/uploads/${caminho}`;

export async function listarMapa() {
  const usuario = await obterUsuario();
  const { data } = await api.get('/denuncias/listar_mapa.php', {
    params: { id_usuario: usuario?.id_usuario },
  });
  return data;
}

/** Alterna o voto do usuário logado. Lança Error('LOGIN') se não houver sessão. */
export async function votar(idDenuncia) {
  const usuario = await obterUsuario();
  if (!usuario?.id_usuario) throw new Error('LOGIN');

  const { data } = await api.post('/denuncias/votar.php', {
    id_denuncia: idDenuncia,
    id_usuario: usuario.id_usuario,
  });
  return data;
}

export function mensagemDeErro(erro, padrao) {
  if (erro?.message === 'LOGIN') return 'Faça login para continuar.';
  return erro?.response?.data?.message ?? padrao;
}