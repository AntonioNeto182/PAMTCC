import api from './api';
import { limparSessao, obterToken, obterUsuario } from './sessao';

/**
 * Decide a rota inicial do app. Verifica só o armazenamento local —
 * se o token estiver expirado, a primeira chamada à API cai em 401 e o
 * interceptor cuida do reset para o Login.
 */
export async function restaurarSessao() {
  const [token, usuario] = await Promise.all([obterToken(), obterUsuario()]);
  return Boolean(token && usuario?.id_usuario);
}

/**
 * Encerra a sessão no servidor (revoga o token) e limpa o armazenamento local.
 * Mesmo que a chamada falhe (offline), o usuário é deslogado localmente.
 */
export async function encerrarSessao() {
  try {
    await api.post('/usuarios/logout.php');
  } catch {
    // silencioso: o logout local é o que importa
  }
  await limparSessao();
}