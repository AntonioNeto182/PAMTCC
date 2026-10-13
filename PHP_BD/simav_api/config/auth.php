<?php
declare(strict_types=1);

const SESSAO_DIAS = 30;
const STORAGE = __DIR__ . '/../storage';

if (!function_exists('responder')) {
    function responder(int $status, array $corpo): never
    {
        http_response_code($status);
        echo json_encode($corpo);
        exit;
    }
}

function corpoJson(): array
{
    $dados = json_decode(file_get_contents('php://input'), true);
    return is_array($dados) ? $dados : [];
}

function tiposBind(array $params): string
{
    return implode('', array_map(
        static fn($p) => is_int($p) ? 'i' : (is_float($p) ? 'd' : 's'),
        $params
    ));
}

function consulta(mysqli $conn, string $sql, array $params = []): array
{
    $stmt = $conn->prepare($sql);
    if ($params) {
        $stmt->bind_param(tiposBind($params), ...$params);
    }
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function executar(mysqli $conn, string $sql, array $params = []): int
{
    $stmt = $conn->prepare($sql);
    if ($params) {
        $stmt->bind_param(tiposBind($params), ...$params);
    }
    $stmt->execute();
    return $stmt->affected_rows;
}

// ---------- armazenamento em arquivo (sem tocar no banco) ----------

function garantirStorage(): void
{
    if (!is_dir(STORAGE) && !mkdir(STORAGE, 0750, true) && !is_dir(STORAGE)) {
        throw new RuntimeException('Não foi possível criar storage/');
    }
    if (!is_file(STORAGE . '/.htaccess')) {
        file_put_contents(STORAGE . '/.htaccess', "Require all denied\n");
    }
}

/** Chave de assinatura: variável SIMAV_SECRET ou arquivo gerado na primeira execução. */
function segredo(): string
{
    static $chave = null;
    if ($chave !== null) {
        return $chave;
    }

    $env = getenv('SIMAV_SECRET');
    if ($env !== false && strlen($env) >= 32) {
        return $chave = $env;
    }

    garantirStorage();
    $arquivo = STORAGE . '/segredo.key';
    if (!is_file($arquivo)) {
        file_put_contents($arquivo, bin2hex(random_bytes(32)), LOCK_EX);
        @chmod($arquivo, 0600);
    }
    return $chave = trim((string) file_get_contents($arquivo));
}

/** Lê, altera e grava um arquivo JSON com trava exclusiva. */
function atualizarJson(string $nome, callable $alterar): mixed
{
    garantirStorage();
    $fp = fopen(STORAGE . '/' . $nome, 'c+');
    flock($fp, LOCK_EX);

    $dados = json_decode((string) stream_get_contents($fp), true);
    $dados = is_array($dados) ? $dados : [];

    $resultado = $alterar($dados);

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($dados));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    return $resultado;
}

// ---------- limite de tentativas de login ----------

const JANELA_TENTATIVAS = 900; // 15 min

function falhasRecentes(string $chave): int
{
    return atualizarJson('tentativas.json', static function (array &$d) use ($chave): int {
        $limite = time() - JANELA_TENTATIVAS;
        foreach ($d as $k => $lista) {
            $d[$k] = array_values(array_filter($lista, static fn($t) => $t > $limite));
            if (!$d[$k]) {
                unset($d[$k]);
            }
        }
        return count($d[hash('sha256', $chave)] ?? []);
    });
}

function registrarFalha(string $chave): void
{
    atualizarJson('tentativas.json', static function (array &$d) use ($chave): void {
        $d[hash('sha256', $chave)][] = time();
    });
}

function limparFalhas(string $chave): void
{
    atualizarJson('tentativas.json', static function (array &$d) use ($chave): void {
        unset($d[hash('sha256', $chave)]);
    });
}

// ---------- token assinado ----------

function b64(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

function b64Decode(string $s): string
{
    return (string) base64_decode(strtr($s, '-_', '+/'), true);
}

/** Muda quando a senha muda: trocar a senha invalida todos os tokens antigos. */
function impressaoSenha(string $senhaHash): string
{
    return substr(hash_hmac('sha256', $senhaHash, segredo()), 0, 16);
}

function criarToken(int $idUsuario, string $senhaHash): string
{
    $payload = b64(json_encode([
        'u' => $idUsuario,
        'e' => time() + SESSAO_DIAS * 86400,
        'j' => bin2hex(random_bytes(8)),
        'f' => impressaoSenha($senhaHash),
    ]));

    return $payload . '.' . hash_hmac('sha256', $payload, segredo());
}

function revogarToken(string $jti, int $expira): void
{
    atualizarJson('revogados.json', static function (array &$d) use ($jti, $expira): void {
        $agora = time();
        $d = array_filter($d, static fn($e) => $e > $agora); // descarta os já expirados
        $d[$jti] = $expira;
    });
}

function tokenRevogado(string $jti): bool
{
    return atualizarJson('revogados.json', static fn(array &$d): bool => isset($d[$jti]));
}

function tokenDaRequisicao(): ?string
{
    $cabecalho = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;

    if ($cabecalho === null && function_exists('getallheaders')) {
        foreach (getallheaders() as $nome => $valor) {
            if (strcasecmp($nome, 'Authorization') === 0) {
                $cabecalho = $valor;
                break;
            }
        }
    }

    if ($cabecalho !== null && preg_match('/^Bearer\s+([A-Za-z0-9_\-]+\.[a-f0-9]{64})$/', trim($cabecalho), $m)) {
        return $m[1];
    }
    return null;
}

function permissoesDoPapel(mysqli $conn, int $idPapel): array
{
    return array_column(consulta(
        $conn,
        'SELECT pe.nome FROM papel_permissoes pp
         INNER JOIN permissoes pe ON pe.id_permissao = pp.id_permissao
         WHERE pp.id_papel = ?',
        [$idPapel]
    ), 'nome');
}

/** Usuário do token atual, ou null. Papel, permissões e "ativo" vêm do banco a cada requisição. */
function usuarioAutenticado(mysqli $conn): ?array
{
    static $resolvido = false;
    static $usuario = null;

    if ($resolvido) {
        return $usuario;
    }
    $resolvido = true;

    $token = tokenDaRequisicao();
    if ($token === null) {
        return null;
    }

    [$payloadB64, $assinatura] = explode('.', $token, 2);

    if (!hash_equals(hash_hmac('sha256', $payloadB64, segredo()), $assinatura)) {
        return null;
    }

    $payload = json_decode(b64Decode($payloadB64), true);
    if (!is_array($payload) || ($payload['e'] ?? 0) < time() || tokenRevogado((string) ($payload['j'] ?? ''))) {
        return null;
    }

    $linha = consulta(
        $conn,
        'SELECT u.id_usuario, u.nome, u.email, u.foto_perfil, u.senha_hash, u.id_papel, p.nome AS papel
         FROM usuarios u
         INNER JOIN papeis p ON p.id_papel = u.id_papel
         WHERE u.id_usuario = ? AND u.ativo = 1 AND p.ativo = 1',
        [(int) ($payload['u'] ?? 0)]
    )[0] ?? null;

    if ($linha === null || !hash_equals(impressaoSenha($linha['senha_hash']), (string) ($payload['f'] ?? ''))) {
        return null;
    }

    return $usuario = [
        'jti'         => $payload['j'],
        'exp'         => (int) $payload['e'],
        'id_usuario'  => (int) $linha['id_usuario'],
        'nome'        => $linha['nome'],
        'email'       => $linha['email'],
        'foto_perfil' => $linha['foto_perfil'],
        'id_papel'    => (int) $linha['id_papel'],
        'papel'       => $linha['papel'],
        'permissoes'  => permissoesDoPapel($conn, (int) $linha['id_papel']),
    ];
}

function temPermissao(array $usuario, string $permissao): bool
{
    return in_array($permissao, $usuario['permissoes'], true);
}

function exigirLogin(mysqli $conn): array
{
    $usuario = usuarioAutenticado($conn);
    if ($usuario === null) {
        responder(401, ['success' => false, 'message' => 'Sessão inválida ou expirada']);
    }
    return $usuario;
}

/** Exige TODAS as permissões informadas. */
function exigirPermissao(mysqli $conn, string ...$permissoes): array
{
    $usuario = exigirLogin($conn);

    foreach ($permissoes as $permissao) {
        if (!temPermissao($usuario, $permissao)) {
            responder(403, ['success' => false, 'message' => 'Você não tem permissão para esta ação']);
        }
    }
    return $usuario;
}
