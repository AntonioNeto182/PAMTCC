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

$idUsuario = filter_input(INPUT_POST, 'id_usuario', FILTER_VALIDATE_INT);
$arquivo   = $_FILES['foto'] ?? null;

if (!$idUsuario || !$arquivo) {
    responder(400, ['success' => false, 'message' => 'Dados incompletos']);
}
if ($arquivo['error'] !== UPLOAD_ERR_OK) {
    responder(400, ['success' => false, 'message' => 'Falha no upload']);
}
if ($arquivo['size'] > TAMANHO_MAXIMO) {
    responder(400, ['success' => false, 'message' => 'Arquivo muito grande']);
}

$mime = (new finfo(FILEINFO_MIME_TYPE))->file($arquivo['tmp_name']);

if (!isset(EXTENSOES[$mime]) || getimagesize($arquivo['tmp_name']) === false) {
    responder(400, ['success' => false, 'message' => 'Tipo de arquivo não permitido']);
}

$base      = __DIR__ . '/../uploads';
$diretorio = "$base/perfis";

if (!is_dir($diretorio) && !mkdir($diretorio, 0755, true)) {
    responder(500, ['success' => false, 'message' => 'Falha ao preparar diretório']);
}

try {
    $stmt = $conn->prepare('SELECT foto_perfil FROM usuarios WHERE id_usuario = ? AND ativo = 1');
    $stmt->bind_param('i', $idUsuario);
    $stmt->execute();
    $linha = $stmt->get_result()->fetch_assoc();

    if (!$linha) {
        responder(404, ['success' => false, 'message' => 'Usuário não encontrado']);
    }

    $nome    = bin2hex(random_bytes(16)) . '.' . EXTENSOES[$mime];
    $destino = "$diretorio/$nome";

    if (!move_uploaded_file($arquivo['tmp_name'], $destino)) {
        responder(500, ['success' => false, 'message' => 'Falha ao salvar arquivo']);
    }

    $relativo = "perfis/$nome";
    $upd = $conn->prepare('UPDATE usuarios SET foto_perfil = ? WHERE id_usuario = ?');
    $upd->bind_param('si', $relativo, $idUsuario);
    $upd->execute();
} catch (mysqli_sql_exception $e) {
    if (isset($destino) && is_file($destino)) {
        unlink($destino);
    }
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Falha ao salvar foto']);
}

// Remove a foto anterior (apenas dentro de uploads/perfis)
$antiga = (string) $linha['foto_perfil'];
if (str_starts_with($antiga, 'perfis/')) {
    $arquivoAntigo = "$diretorio/" . basename($antiga);
    if (is_file($arquivoAntigo)) {
        unlink($arquivoAntigo);
    }
}

echo json_encode(['success' => true, 'foto_perfil' => $relativo]);