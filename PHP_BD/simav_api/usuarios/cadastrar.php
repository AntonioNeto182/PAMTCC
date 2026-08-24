<?php
include('../config/cors.php');
include('../config/database.php');

$dados = json_decode(file_get_contents("php://input"), true);

if (!$dados || empty($dados['nome']) || empty($dados['email']) || empty($dados['senha'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Dados incompletos"]);
    exit;
}

if (!filter_var($dados['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "E-mail inválido"]);
    exit;
}

if (strlen($dados['senha']) < 6) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Senha deve ter no mínimo 6 caracteres"]);
    exit;
}

$nome = $dados['nome'];
$email = $dados['email'];
$senha = password_hash($dados['senha'], PASSWORD_DEFAULT);
$data = date('Y-m-d H:i:s');

try {
    $stmt = $conn->prepare("INSERT INTO usuarios (nome, email, senha, data_cadastro) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $nome, $email, $senha, $data);
    $stmt->execute();

    echo json_encode(["success" => true, "message" => "Usuário cadastrado"]);
} catch (mysqli_sql_exception $e) {
    if ($conn->errno === 1062) { // duplicate entry
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "E-mail já cadastrado"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Erro ao cadastrar"]);
    }
}

