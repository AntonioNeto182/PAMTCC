<?php

include('../config/cors.php');
include('../config/database.php');

$dados = json_decode(file_get_contents("php://input"), true);

if (!$dados || empty($dados['endereco']) ||
    !isset($dados['latitude'], $dados['longitude'], $dados['id_tipo'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Dados incompletos']);
    exit;
}

$descricao = $dados['descricao'] ?? '';
$status = "Pendente";
$id_usuario = isset($dados['id_usuario']) && $dados['id_usuario'] !== null
    ? (int) $dados['id_usuario']
    : null;
$endereco = $dados['endereco'];
$latitude = (float) $dados['latitude'];
$longitude = (float) $dados['longitude'];
$id_tipo = (int) $dados['id_tipo'];
$data = date('Y-m-d H:i:s');

$conn->begin_transaction();

try {
    $stmtLocal = $conn->prepare("INSERT INTO locais (endereco, latitude, longitude) VALUES (?, ?, ?)");
    $stmtLocal->bind_param("sdd", $endereco, $latitude, $longitude);
    $stmtLocal->execute();
    $id_local = $conn->insert_id;

    $stmt = $conn->prepare("INSERT INTO denuncias (descricao, data_denuncia, status, id_usuario, id_local, id_tipo) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssiii", $descricao, $data, $status, $id_usuario, $id_local, $id_tipo);
    $stmt->execute();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Denúncia criada",
        "id_denuncia" => $stmt->insert_id
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao criar denúncia"]);
}