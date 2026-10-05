<?php
include('../config/cors.php');
include('../config/database.php');

function responder(int $status, array $corpo): never
{
    http_response_code($status);
    echo json_encode($corpo);
    exit;
}

$dados = json_decode(file_get_contents('php://input'), true);

$email = is_array($dados) ? strtolower(trim((string) ($dados['email'] ?? ''))) : '';
$senha = is_array($dados) ? (string) ($dados['senha'] ?? '') : '';

if ($email === '' || $senha === '') {
    responder(400, ['success' => false, 'message' => 'Dados incompletos']);
}

try {
    $stmt = $conn->prepare(
        'SELECT id_usuario, nome, email, senha_hash, foto_perfil, id_papel, ativo
         FROM usuarios WHERE email = ?'
    );
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $usuario = $stmt->get_result()->fetch_assoc();

    // Mensagem única: não revela se o e-mail existe
    if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
        responder(401, ['success' => false, 'message' => 'E-mail ou senha incorretos']);
    }

    if (!$usuario['ativo']) {
        responder(403, ['success' => false, 'message' => 'Usuário inativo']);
    }

    $stmtUpd = $conn->prepare('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id_usuario = ?');
    $stmtUpd->bind_param('i', $usuario['id_usuario']);
    $stmtUpd->execute();

    unset($usuario['senha_hash']);
    $usuario['id_usuario'] = (int) $usuario['id_usuario'];
    $usuario['id_papel']   = (int) $usuario['id_papel'];
    $usuario['ativo']      = (bool) $usuario['ativo'];

    echo json_encode(['success' => true, 'usuario' => $usuario]);
} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao fazer login']);
}