<?php
$conn = new mysqli('localhost', 'root', '', 'SIMAV');

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Falha na conexão com o banco']);
    exit;
}

$conn->set_charset('utf8mb4');