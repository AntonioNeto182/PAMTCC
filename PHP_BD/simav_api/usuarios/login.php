<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');

const MAX_FALHAS_EMAIL = 5;
const MAX_FALHAS_IP = 20;

$dados = corpoJson();
$email = strtolower(trim((string) ($dados['email'] ?? '')));
$senha = (string) ($dados['senha'] ?? '');
$ip    = (string) ($_SERVER['REMOTE_ADDR'] ?? '');

if ($email === '' || $senha === '') {
    responder(400, ['success' => false, 'message' => 'Dados incompletos']);
}

try {
    if (falhasRecentes("email:$email") >= MAX_FALHAS_EMAIL || falhasRecentes("ip:$ip") >= MAX_FALHAS_IP) {
        responder(429, ['success' => false, 'message' => 'Muitas tentativas. Tente novamente em 15 minutos.']);
    }

    $usuario = consulta(
        $conn,
        'SELECT u.id_usuario, u.nome, u.email, u.senha_hash, u.foto_perfil, u.id_papel,
                p.nome AS papel, u.ativo
         FROM usuarios u INNER JOIN papeis p ON p.id_papel = u.id_papel
         WHERE u.email = ?',
        [$email]
    )[0] ?? null;

    // Verifica sempre um hash, para não revelar por tempo de resposta se o e-mail existe
    $hash = $usuario['senha_hash'] ?? password_hash('simav-dummy', PASSWORD_DEFAULT);

    if (!$usuario || !password_verify($senha, $hash)) {
        registrarFalha("email:$email");
        registrarFalha("ip:$ip");
        responder(401, ['success' => false, 'message' => 'E-mail ou senha incorretos']);
    }

    if (!$usuario['ativo']) {
        responder(403, ['success' => false, 'message' => 'Usuário inativo']);
    }

    $idUsuario = (int) $usuario['id_usuario'];

    limparFalhas("email:$email");
    executar($conn, 'UPDATE usuarios SET ultimo_acesso = NOW() WHERE id_usuario = ?', [$idUsuario]);

    $token      = criarToken($idUsuario, $usuario['senha_hash']);
    $permissoes = permissoesDoPapel($conn, (int) $usuario['id_papel']);
} catch (mysqli_sql_exception | RuntimeException $e) {
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao fazer login']);
}

echo json_encode([
    'success'    => true,
    'token'      => $token,
    'usuario'    => [
        'id_usuario'  => $idUsuario,
        'nome'        => $usuario['nome'],
        'email'       => $usuario['email'],
        'foto_perfil' => $usuario['foto_perfil'],
        'id_papel'    => (int) $usuario['id_papel'],
        'papel'       => $usuario['papel'],
    ],
    'permissoes' => $permissoes,
]);