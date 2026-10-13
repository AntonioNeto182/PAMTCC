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
  const { data } = await api.get('/denuncias/listar_mapa.php');
  return data;
}

/** Alterna o "Up" do usuário logado (o servidor identifica o usuário pelo token). */
export async function votar(idDenuncia) {
  const { data } = await api.post('/denuncias/votar.php', { id_denuncia: idDenuncia });
  return data;
}

export function mensagemDeErro(erro, padrao) {
  if (erro?.message === 'LOGIN') return 'Faça login para continuar.';
  const status = erro?.response?.status;
  return erro?.response?.data?.message ?? (status ? `${padrao} (erro ${status})` : 'Sem conexão com a API.');
}

/** Abre a tela inicial já focada na denúncia (o mapa centraliza e abre o pin). */
export function abrirNoMapa(navigation, d) {
  const params = {
    focarDenuncia: {
      id: d.id_denuncia,
      latitude: Number(d.latitude),
      longitude: Number(d.longitude),
      ts: Date.now(),
    },
  };

  if (typeof navigation.popTo === 'function') navigation.popTo('Inicio', params);
  else navigation.navigate('Inicio', params);
}
