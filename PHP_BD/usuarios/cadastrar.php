<?php
include('../config/cors.php');
include('../config/database.php');

$dados = json_decode(file_get_contents("php://input"), true);

$nome = $dados['nome'];
$email = $dados['email'];
$senha = password_hash($dados['senha'], PASSWORD_DEFAULT);

$data = date('Y-m-d H:i:s');

$sql = "INSERT INTO usuarios
(nome, email, senha, data_cadastro)
VALUES
(?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ssss",
    $nome,
    $email,
    $senha,
    $data
);

if($stmt->execute()){

    echo json_encode([
        "success" => true,
        "message" => "Usuário cadastrado"
    ]);

}else{

    echo json_encode([
        "success" => false,
        "message" => "Erro ao cadastrar"
    ]);

}

?>