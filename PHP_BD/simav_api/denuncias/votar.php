<?php
include('../config/cors.php');
include('../config/database.php');

function responder(int $status, array $corpo): never
{
    http_response_code($status);
    echo json_encode($corpo);
    exit;
}

$dados = json_decode(file_get_contents('php://input'), true);
$dados = is_array($dados) ? $dados : [];

$idDenuncia = filter_var($dados['id_denuncia'] ?? null, FILTER_VALIDATE_INT);
$idUsuario  = filter_var($dados['id_usuario'] ?? null, FILTER_VALIDATE_INT);

if (!$idDenuncia || !$idUsuario) {
    responder(400, ['success' => false, 'message' => 'Dados incompletos']);
}

try {
    // Alterna: se já votou, remove; senão, cria
    $del = $conn->prepare('DELETE FROM denuncia_votos WHERE id_denuncia = ? AND id_usuario = ?');
    $del->bind_param('ii', $idDenuncia, $idUsuario);
    $del->execute();

    $votou = false;

    if ($del->affected_rows === 0) {
        try {
            $ins = $conn->prepare('INSERT INTO denuncia_votos (id_denuncia, id_usuario) VALUES (?, ?)');
            $ins->bind_param('ii', $idDenuncia, $idUsuario);
            $ins->execute();
            $votou = true;
        } catch (mysqli_sql_exception $e) {
            if ($e->getCode() === 1062) {        // toque duplo simultâneo: o voto já existe
                $votou = true;
            } elseif ($e->getCode() === 1452) {  // denúncia ou usuário inexistente
                responder(404, ['success' => false, 'message' => 'Denúncia ou usuário não encontrado']);
            } else {
                throw $e;
            }
        }
    }

    $cnt = $conn->prepare('SELECT COUNT(*) AS total FROM denuncia_votos WHERE id_denuncia = ?');
    $cnt->bind_param('i', $idDenuncia);
    $cnt->execute();
    $votos = (int) $cnt->get_result()->fetch_assoc()['total'];
} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao registrar voto']);
}

echo json_encode(['success' => true, 'votos' => $votos, 'votou' => $votou]);