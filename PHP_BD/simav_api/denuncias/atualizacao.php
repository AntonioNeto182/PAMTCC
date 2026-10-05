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
$idUsuario  = filter_input(INPUT_POST, 'id_usuario', FILTER_VALIDATE_INT);
$idTipo     = filter_input(INPUT_POST, 'id_tipo_atualizacao', FILTER_VALIDATE_INT);
$descricao  = trim((string) ($_POST['descricao'] ?? ''));
$arquivo    = $_FILES['imagem'] ?? null;

if ($arquivo && $arquivo['error'] === UPLOAD_ERR_NO_FILE) {
    $arquivo = null;
}

if (!$idDenuncia || !$idUsuario || !$idTipo || $descricao === '') {
    responder(400, ['success' => false, 'message' => 'Dados incompletos']);
}
if (mb_strlen($descricao) > 500) {
    responder(400, ['success' => false, 'message' => 'Descrição muito longa']);
}

$mime = null;

if ($arquivo) {
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
}

$destino  = null;
$relativo = null;

try {
    $stmt = $conn->prepare(
        'SELECT (SELECT COUNT(*) FROM denuncias WHERE id_denuncia = ?) AS denuncia,
                (SELECT COUNT(*) FROM usuarios WHERE id_usuario = ? AND ativo = 1) AS usuario,
                (SELECT COUNT(*) FROM tipos_atualizacao WHERE id_tipo_atualizacao = ?) AS tipo'
    );
    $stmt->bind_param('iii', $idDenuncia, $idUsuario, $idTipo);
    $stmt->execute();
    $existe = $stmt->get_result()->fetch_assoc();

    if (!(int) $existe['denuncia'] || !(int) $existe['usuario'] || !(int) $existe['tipo']) {
        responder(404, ['success' => false, 'message' => 'Denúncia, usuário ou tipo não encontrado']);
    }

    if ($arquivo) {
        $diretorio = __DIR__ . '/../uploads/atualizacoes';
        if (!is_dir($diretorio) && !mkdir($diretorio, 0755, true)) {
            responder(500, ['success' => false, 'message' => 'Falha ao preparar diretório']);
        }

        $nome     = bin2hex(random_bytes(16)) . '.' . EXTENSOES[$mime];
        $destino  = "$diretorio/$nome";
        $relativo = "atualizacoes/$nome";

        if (!move_uploaded_file($arquivo['tmp_name'], $destino)) {
            responder(500, ['success' => false, 'message' => 'Falha ao salvar arquivo']);
        }
    }

    $ins = $conn->prepare(
        'INSERT INTO denuncia_atualizacoes (id_denuncia, id_usuario, id_tipo_atualizacao, descricao, imagem)
         VALUES (?, ?, ?, ?, ?)'
    );
    $ins->bind_param('iiiss', $idDenuncia, $idUsuario, $idTipo, $descricao, $relativo);
    $ins->execute();
} catch (mysqli_sql_exception $e) {
    if ($destino && is_file($destino)) {
        unlink($destino);
    }
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao salvar atualização']);
}

echo json_encode(['success' => true, 'id_atualizacao' => $conn->insert_id]);