<?php
include('../config/cors.php');
include('../config/database.php');

function responder(int $status, array $corpo): never
{
    http_response_code($status);
    echo json_encode($corpo);
    exit;
}

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$id || $id < 1) {
    responder(400, ['success' => false, 'message' => 'ID inválido']);
}

try {
    $stmt = $conn->prepare(
        'SELECT u.id_usuario, u.nome, u.email, u.foto_perfil, u.id_papel,
                p.nome AS papel, u.ultimo_acesso, u.created_at
         FROM usuarios u
         INNER JOIN papeis p ON p.id_papel = u.id_papel
         WHERE u.id_usuario = ? AND u.ativo = 1'
    );
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $usuario = $stmt->get_result()->fetch_assoc();

    if (!$usuario) {
        responder(404, ['success' => false, 'message' => 'Usuário não encontrado']);
    }

    $stmtStats = $conn->prepare(
        "SELECT COUNT(*) AS total,
                COALESCE(SUM(sd.nome NOT IN ('resolvida', 'rejeitada')), 0) AS em_aberto,
                COALESCE(SUM(sd.nome = 'resolvida'), 0) AS resolvidas
         FROM denuncias d
         INNER JOIN status_denuncia sd ON sd.id_status = d.id_status
         WHERE d.id_usuario = ?"
    );
    $stmtStats->bind_param('i', $id);
    $stmtStats->execute();
    $stats = $stmtStats->get_result()->fetch_assoc();
} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao buscar perfil']);
}

$usuario['id_usuario'] = (int) $usuario['id_usuario'];
$usuario['id_papel']   = (int) $usuario['id_papel'];

echo json_encode([
    'success'      => true,
    'usuario'      => $usuario,
    'estatisticas' => [
        'total'      => (int) $stats['total'],
        'em_aberto'  => (int) $stats['em_aberto'],
        'resolvidas' => (int) $stats['resolvidas'],
    ],
]);