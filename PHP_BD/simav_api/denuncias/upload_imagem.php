<?php
include('../config/cors.php');
include('../config/database.php');

function responder(int $status, array $corpo): never
{
    http_response_code($status);
    echo json_encode($corpo);
    exit;
}

const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const EXTENSOES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

$idDenuncia = filter_input(INPUT_POST, 'id_denuncia', FILTER_VALIDATE_INT);
$arquivo    = $_FILES['imagem'] ?? null;

if (!$idDenuncia || !$arquivo) {
    responder(400, ['success' => false, 'message' => 'Dados incompletos']);
}
if ($arquivo['error'] !== UPLOAD_ERR_OK) {
    responder(400, ['success' => false, 'message' => 'Falha no upload']);
}
if ($arquivo['size'] > TAMANHO_MAXIMO) {
    responder(400, ['success' => false, 'message' => 'Arquivo muito grande']);
}

$mime = (new finfo(FILEINFO_MIME_TYPE))->file($arquivo['tmp_name']);
$info = getimagesize($arquivo['tmp_name']);

if (!isset(EXTENSOES[$mime]) || $info === false) {
    responder(400, ['success' => false, 'message' => 'Tipo de arquivo não permitido']);
}

try {
    $stmtDen = $conn->prepare('SELECT 1 FROM denuncias WHERE id_denuncia = ?');
    $stmtDen->bind_param('i', $idDenuncia);
    $stmtDen->execute();
    if ($stmtDen->get_result()->num_rows === 0) {
        responder(404, ['success' => false, 'message' => 'Denúncia não encontrada']);
    }
} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao validar denúncia']);
}

$diretorio = __DIR__ . '/../uploads';
if (!is_dir($diretorio) && !mkdir($diretorio, 0755, true)) {
    responder(500, ['success' => false, 'message' => 'Falha ao preparar diretório']);
}

$nome    = bin2hex(random_bytes(16)) . '.' . EXTENSOES[$mime];
$caminho = "$diretorio/$nome";

if (!move_uploaded_file($arquivo['tmp_name'], $caminho)) {
    responder(500, ['success' => false, 'message' => 'Falha ao salvar arquivo']);
}

[$largura, $altura] = $info;
$nomeOriginal = mb_substr(basename($arquivo['name']), 0, 255);
$tamanho      = (int) $arquivo['size'];

try {
    $stmt = $conn->prepare(
        'INSERT INTO imagens (id_denuncia, caminho, nome_original, mime_type, tamanho_bytes, largura, altura)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param('isssiii', $idDenuncia, $nome, $nomeOriginal, $mime, $tamanho, $largura, $altura);
    $stmt->execute();

    echo json_encode(['success' => true, 'caminho' => $nome]);
} catch (mysqli_sql_exception $e) {
    unlink($caminho);
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Falha ao salvar registro']);
}