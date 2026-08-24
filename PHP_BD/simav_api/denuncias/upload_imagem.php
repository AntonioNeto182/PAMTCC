<?php

include('../config/database.php');
header('Content-Type: application/json');

if (!isset($_POST['id_denuncia']) || !isset($_FILES['imagem'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Dados incompletos']);
    exit;
}

$id_denuncia = (int) $_POST['id_denuncia'];
$arquivo = $_FILES['imagem'];

$tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
$mime = mime_content_type($arquivo['tmp_name']);

if (!in_array($mime, $tiposPermitidos, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tipo de arquivo não permitido']);
    exit;
}

if ($arquivo['size'] > 5 * 1024 * 1024) { // 5MB
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Arquivo muito grande']);
    exit;
}

$extensoes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$nome = uniqid() . '.' . $extensoes[$mime];
$caminho = "../uploads/" . $nome;

if (!move_uploaded_file($arquivo['tmp_name'], $caminho)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Falha ao salvar arquivo']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO imagens (caminho, id_denuncia) VALUES (?, ?)");
$stmt->bind_param("si", $nome, $id_denuncia);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "caminho" => $nome]);
} else {
    unlink($caminho);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Falha ao salvar registro"]);
}