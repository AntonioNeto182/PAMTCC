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

$nome  = is_array($dados) ? trim((string) ($dados['nome'] ?? '')) : '';
$email = is_array($dados) ? strtolower(trim((string) ($dados['email'] ?? ''))) : '';
$senha = is_array($dados) ? (string) ($dados['senha'] ?? '') : '';

if ($nome === '' || $email === '' || $senha === '') {
    responder(400, ['success' => false, 'message' => 'Dados incompletos']);
}
if (mb_strlen($nome) > 100 || strlen($email) > 150 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(400, ['success' => false, 'message' => 'Nome ou e-mail inválido']);
}
if (strlen($senha) < 6 || strlen($senha) > 72) { // limite do bcrypt
    responder(400, ['success' => false, 'message' => 'Senha deve ter entre 6 e 72 caracteres']);
}

$senhaHash = password_hash($senha, PASSWORD_DEFAULT);
$idPapel   = 1; // cidadao

try {
    $stmt = $conn->prepare(
        'INSERT INTO usuarios (nome, email, senha_hash, id_papel) VALUES (?, ?, ?, ?)'
    );
    $stmt->bind_param('sssi', $nome, $email, $senhaHash, $idPapel);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Usuário cadastrado']);
} catch (mysqli_sql_exception $e) {
    if ($e->getCode() === 1062) {
        responder(409, ['success' => false, 'message' => 'E-mail já cadastrado']);
    }
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao cadastrar']);
}