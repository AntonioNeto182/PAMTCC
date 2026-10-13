<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirMetodo('POST');

$eu        = exigirLogin($conn);
$dados     = corpoJson();
$idUsuario = $eu['id_usuario'];

$nome       = textoObrigatorio($dados['nome'] ?? null, 100, 'Nome');
$email      = strtolower(trim((string) ($dados['email'] ?? '')));
$senhaAtual = (string) ($dados['senha_atual'] ?? '');
$novaSenha  = (string) ($dados['nova_senha'] ?? '');

if (strlen($email) > 150 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    falhar(400, 'E-mail inválido');
}
if ($novaSenha !== '' && (strlen($novaSenha) < 6 || strlen($novaSenha) > 72)) {
    falhar(400, 'Senha deve ter entre 6 e 72 caracteres');
}

$atual      = consulta($conn, 'SELECT email, senha_hash FROM usuarios WHERE id_usuario = ?', [$idUsuario])[0];
$emailMudou = $email !== $atual['email'];

// Alterar e-mail ou senha exige confirmar a senha atual
if (($emailMudou || $novaSenha !== '') && !password_verify($senhaAtual, $atual['senha_hash'])) {
    falhar(401, 'Senha atual incorreta');
}

$sets     = ['nome = ?', 'email = ?'];
$params   = [$nome, $email];
$novoHash = null;

if ($emailMudou) {
    $sets[] = 'email_verificado_em = NULL';
}
if ($novaSenha !== '') {
    $novoHash = password_hash($novaSenha, PASSWORD_DEFAULT);
    $sets[]   = 'senha_hash = ?';
    $params[] = $novoHash;
}
$params[] = $idUsuario;

try {
    executar($conn, 'UPDATE usuarios SET ' . implode(', ', $sets) . ' WHERE id_usuario = ?', $params);
} catch (mysqli_sql_exception $e) {
    if ($e->getCode() === 1062) {
        falhar(409, 'E-mail já cadastrado');
    }
    throw $e;
}

$usuario = consulta(
    $conn,
    'SELECT u.id_usuario, u.nome, u.email, u.foto_perfil, u.id_papel, p.nome AS papel
     FROM usuarios u INNER JOIN papeis p ON p.id_papel = u.id_papel
     WHERE u.id_usuario = ?',
    [$idUsuario]
)[0];

$usuario['id_usuario'] = (int) $usuario['id_usuario'];
$usuario['id_papel']   = (int) $usuario['id_papel'];

// Trocar a senha invalida os tokens antigos; devolve um novo para este aparelho
echo json_encode([
    'success' => true,
    'usuario' => $usuario,
    'token'   => $novoHash ? criarToken($idUsuario, $novoHash) : null,
]);
