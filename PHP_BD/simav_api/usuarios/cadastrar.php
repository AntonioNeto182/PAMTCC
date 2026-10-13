<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

const MAX_CADASTROS_IP = 10;

exigirMetodo('POST');

$dados = corpoJson();
$ip    = 'cadastro:' . ($_SERVER['REMOTE_ADDR'] ?? '');

if (falhasRecentes($ip) >= MAX_CADASTROS_IP) {
    falhar(429, 'Muitas tentativas. Aguarde alguns minutos.');
}
registrarFalha($ip);

$nome  = textoObrigatorio($dados['nome'] ?? null, 100, 'Nome');
$email = strtolower(trim((string) ($dados['email'] ?? '')));
$senha = (string) ($dados['senha'] ?? '');

if (strlen($email) > 150 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    falhar(400, 'E-mail inválido');
}
if (strlen($senha) < 6 || strlen($senha) > 72) {
    falhar(400, 'Senha deve ter entre 6 e 72 caracteres');
}

$cpf        = normalizarCpf($dados['cpf'] ?? null);
$nascimento = normalizarNascimento($dados['data_nascimento'] ?? null);
$telefone   = normalizarTelefone($dados['telefone'] ?? null);

try {
    executar(
        $conn,
        'INSERT INTO usuarios (nome, email, senha_hash, cpf, data_nascimento, telefone, id_papel)
         VALUES (?, ?, ?, ?, ?, ?, 1)',
        [$nome, $email, password_hash($senha, PASSWORD_DEFAULT), $cpf, $nascimento, $telefone]
    );
} catch (mysqli_sql_exception $e) {
    if ($e->getCode() === 1062) {
        falhar(409, str_contains($e->getMessage(), 'cpf') ? 'CPF já cadastrado' : 'E-mail já cadastrado');
    }
    throw $e;
}

http_response_code(201);
echo json_encode(['success' => true, 'message' => 'Usuário cadastrado com sucesso', 'id_usuario' => $conn->insert_id]);
