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
$dados = is_array($dados) ? $dados : [];

$idUsuario  = filter_var($dados['id_usuario'] ?? null, FILTER_VALIDATE_INT);
$nome       = trim((string) ($dados['nome'] ?? ''));
$email      = strtolower(trim((string) ($dados['email'] ?? '')));
$senhaAtual = (string) ($dados['senha_atual'] ?? '');
$novaSenha  = (string) ($dados['nova_senha'] ?? '');

if (!$idUsuario || $nome === '' || $email === '') {
    responder(400, ['success' => false, 'message' => 'Dados incompletos']);
}
if (mb_strlen($nome) > 100 || strlen($email) > 150 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(400, ['success' => false, 'message' => 'Nome ou e-mail inválido']);
}
if ($novaSenha !== '' && (strlen($novaSenha) < 6 || strlen($novaSenha) > 72)) {
    responder(400, ['success' => false, 'message' => 'Senha deve ter entre 6 e 72 caracteres']);
}

try {
    $stmt = $conn->prepare(
        'SELECT email, senha_hash FROM usuarios WHERE id_usuario = ? AND ativo = 1'
    );
    $stmt->bind_param('i', $idUsuario);
    $stmt->execute();
    $atual = $stmt->get_result()->fetch_assoc();

    if (!$atual) {
        responder(404, ['success' => false, 'message' => 'Usuário não encontrado']);
    }

    // Alterar e-mail ou senha exige confirmar a senha atual
    $sensivel = $email !== $atual['email'] || $novaSenha !== '';
    if ($sensivel && !password_verify($senhaAtual, $atual['senha_hash'])) {
        responder(401, ['success' => false, 'message' => 'Senha atual incorreta']);
    }

    if ($novaSenha !== '') {
        $hash = password_hash($novaSenha, PASSWORD_DEFAULT);
        $upd  = $conn->prepare(
            'UPDATE usuarios SET nome = ?, email = ?, senha_hash = ? WHERE id_usuario = ?'
        );
        $upd->bind_param('sssi', $nome, $email, $hash, $idUsuario);
    } else {
        $upd = $conn->prepare('UPDATE usuarios SET nome = ?, email = ? WHERE id_usuario = ?');
        $upd->bind_param('ssi', $nome, $email, $idUsuario);
    }
    $upd->execute();

    $stmtSel = $conn->prepare(
        'SELECT id_usuario, nome, email, foto_perfil, id_papel, ativo
         FROM usuarios WHERE id_usuario = ?'
    );
    $stmtSel->bind_param('i', $idUsuario);
    $stmtSel->execute();
    $usuario = $stmtSel->get_result()->fetch_assoc();
} catch (mysqli_sql_exception $e) {
    if ($e->getCode() === 1062) {
        responder(409, ['success' => false, 'message' => 'E-mail já cadastrado']);
    }
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao atualizar perfil']);
}

$usuario['id_usuario'] = (int) $usuario['id_usuario'];
$usuario['id_papel']   = (int) $usuario['id_papel'];
$usuario['ativo']      = (bool) $usuario['ativo'];

echo json_encode(['success' => true, 'usuario' => $usuario]);