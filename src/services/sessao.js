import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const CHAVE_TOKEN = 'simav_token';
const CHAVE_USUARIO = 'usuario';

let tokenAtual = null;
let tokenCarregado = false;
let aoExpirar = null;
let ultimaNotificacao = 0;

export async function obterToken() {
  if (!tokenCarregado) {
    tokenAtual = await SecureStore.getItemAsync(CHAVE_TOKEN);
    tokenCarregado = true;
  }
  return tokenAtual;
}

export async function obterUsuario() {
  try {
    const salvo = await AsyncStorage.getItem(CHAVE_USUARIO);
    return salvo ? JSON.parse(salvo) : null;
  } catch {
    return null;
  }
}

export async function salvarToken(token) {
  await SecureStore.setItemAsync(CHAVE_TOKEN, token);
  tokenAtual = token;
  tokenCarregado = true;
}

export async function salvarSessao({ token, usuario, permissoes }) {
  await salvarToken(token);
  await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify({ ...usuario, permissoes }));
}

export async function atualizarUsuarioLocal(parcial) {
  const atual = (await obterUsuario()) ?? {};
  await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify({ ...atual, ...parcial }));
}

export async function limparSessao() {
  tokenAtual = null;
  tokenCarregado = true;
  await Promise.all([
    SecureStore.deleteItemAsync(CHAVE_TOKEN),
    AsyncStorage.removeItem(CHAVE_USUARIO),
  ]);
}

export function aoSessaoExpirar(callback) {
  aoExpirar = callback;
}

// Várias requisições podem falhar juntas com 401: avisa uma vez
export function notificarSessaoExpirada() {
  const agora = Date.now();
  if (agora - ultimaNotificacao < 2000) return;
  ultimaNotificacao = agora;
  aoExpirar?.();
}