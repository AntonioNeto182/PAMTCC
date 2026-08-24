<?php

include('../config/database.php');
header('Content-Type: application/json');

if (!isset($_GET['id']) || !ctype_digit($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID inválido']);
    exit;
}

$id = (int) $_GET['id'];

$sql = "
SELECT d.*, u.nome, l.endereco, l.latitude, l.longitude, t.nome AS tipo
FROM denuncias d
INNER JOIN usuarios u ON d.id_usuario = u.id_usuario
INNER JOIN locais l ON d.id_local = l.id_local
INNER JOIN tipos_denuncia t ON d.id_tipo = t.id_tipo
WHERE d.id_denuncia = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);
$stmt->execute();

$resultado = $stmt->get_result();
$denuncia = $resultado->fetch_assoc();

if (!$denuncia) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Denúncia não encontrada']);
    exit;
}

echo json_encode($denuncia);