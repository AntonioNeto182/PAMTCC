<?php

include('../config/database.php');

$dados = json_decode(file_get_contents("php://input"), true);

$descricao = $dados['descricao'];
$status = "Pendente";

$id_usuario = $dados['id_usuario'];

$endereco = $dados['endereco'];
$latitude = $dados['latitude'];
$longitude = $dados['longitude'];

$id_tipo = $dados['id_tipo'];

$data = date('Y-m-d H:i:s');

$sqlLocal = "INSERT INTO locais
(endereco, latitude, longitude)
VALUES
(?, ?, ?)";

$stmtLocal = $conn->prepare($sqlLocal);

$stmtLocal->bind_param(
    "sdd",
    $endereco,
    $latitude,
    $longitude
);

$stmtLocal->execute();

$id_local = $conn->insert_id;

$sql = "INSERT INTO denuncias
(descricao, data_denuncia, status, id_usuario, id_local, id_tipo)
VALUES
(?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "sssiii",
    $descricao,
    $data,
    $status,
    $id_usuario,
    $id_local,
    $id_tipo
);

if($stmt->execute()){

    echo json_encode([
        "success" => true,
        "message" => "Denúncia criada"
    ]);

}else{

    echo json_encode([
        "success" => false
    ]);

}

?>