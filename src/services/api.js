import axios from 'axios';

import { obterToken, notificarSessaoExpirada } from './sessao';

// Rotas que devolvem 401 por credencial errada (não por sessão expirada)
const ROTAS_SEM_SESSAO = ['/usuarios/login.php', '/usuarios/cadastrar.php'];

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.127/simav_api',
  timeout: 15000,
});

// Só adiciona o header quando existir token em memória/SecureStore
api.interceptors.request.use(async (config) => {
  const token = await obterToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url ?? '';
    const rotaPublica = ROTAS_SEM_SESSAO.some((r) => url.includes(r));

    // 401 em rota protegida = sessão caiu. O callback global cuida do alerta + reset.
    if (status === 401 && !rotaPublica) {
      notificarSessaoExpirada();
      error.message = 'LOGIN'; // sinaliza para mensagemDeErro() em denuncias.js
    }
    return Promise.reject(error);
  }
);

export default api;