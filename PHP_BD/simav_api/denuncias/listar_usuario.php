<?php
include('../config/cors.php');
include('../config/database.php');

function responder(int $status, array $corpo): never
{
    http_response_code($status);
    echo json_encode($corpo);
    exit;
}

$id = filter_input(INPUT_GET, 'id_usuario', FILTER_VALIDATE_INT);

if (!$id || $id < 1) {
    responder(400, ['success' => false, 'message' => 'ID inválido']);
}

try {
    $stmt = $conn->prepare("
        SELECT
            d.id_denuncia,
            d.descricao,
            d.created_at        AS data_denuncia,
            sd.nome             AS status,
            sd.cor              AS status_cor,
            t.nome              AS tipo,
            l.endereco,
            l.numero,
            l.bairro,
            ST_X(l.localizacao) AS latitude,
            ST_Y(l.localizacao) AS longitude,
            (SELECT caminho FROM imagens
              WHERE id_denuncia = d.id_denuncia
              ORDER BY ordem, id_imagem LIMIT 1) AS imagem
        FROM denuncias d
        INNER JOIN locais          l  ON d.id_local  = l.id_local
        INNER JOIN tipos_denuncia  t  ON d.id_tipo   = t.id_tipo
        INNER JOIN status_denuncia sd ON d.id_status = sd.id_status
        WHERE d.id_usuario = ?
        ORDER BY d.id_denuncia DESC
        LIMIT 50
    ");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $dados = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao listar denúncias']);
}

foreach ($dados as &$linha) {
    $linha['id_denuncia'] = (int) $linha['id_denuncia'];
    $linha['latitude']    = (float) $linha['latitude'];
    $linha['longitude']   = (float) $linha['longitude'];
}
unset($linha);

echo json_encode($dados);