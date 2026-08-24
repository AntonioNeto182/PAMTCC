<?php
include('../config/cors.php');
include('../config/database.php');

$dados = json_decode(file_get_contents("php://input"), true);

$email = $dados['email'];
$senha = $dados['senha'];

$sql = "SELECT * FROM usuarios WHERE email = ?";

$stmt = $conn->prepare($sql);

$stmt->bind_param("s", $email);

$stmt->execute();

$resultado = $stmt->get_result();

if($resultado->num_rows > 0){

    $usuario = $resultado->fetch_assoc();

    if(password_verify($senha, $usuario['senha'])){

        echo json_encode([
            "success" => true,
            "usuario" => $usuario
        ]);

    }else{

        echo json_encode([
            "success" => false,
            "message" => "Senha incorreta"
        ]);

    }

}else{

    echo json_encode([
        "success" => false,
        "message" => "Usuário não encontrado"
    ]);

}

?>