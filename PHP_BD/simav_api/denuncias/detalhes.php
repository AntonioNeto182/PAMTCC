<?php
include('../config/cors.php');
include('../config/database.php');

function responder(int $status, array $corpo): never
{
    http_response_code($status);
    echo json_encode($corpo);
    exit;
}

$id        = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
$idUsuario = (int) filter_input(INPUT_GET, 'id_usuario', FILTER_VALIDATE_INT);

if (!$id || $id < 1) {
    responder(400, ['success' => false, 'message' => 'ID inválido']);
}

try {
    $stmt = $conn->prepare("
        SELECT
            d.id_denuncia, d.descricao, d.prioridade, d.data_ocorrencia,
            d.created_at        AS data_denuncia,
            COALESCE(u.nome, 'Anônimo') AS autor,
            sd.nome             AS status,
            sd.cor              AS status_cor,
            t.nome              AS tipo,
            l.endereco, l.numero, l.complemento, l.bairro, l.cidade, l.estado,
            ST_X(l.localizacao) AS latitude,
            ST_Y(l.localizacao) AS longitude,
            (SELECT COUNT(*) FROM denuncia_votos v WHERE v.id_denuncia = d.id_denuncia) AS votos,
            EXISTS(SELECT 1 FROM denuncia_votos v
                    WHERE v.id_denuncia = d.id_denuncia AND v.id_usuario = ?) AS votou
        FROM denuncias d
        INNER JOIN locais          l  ON d.id_local  = l.id_local
        INNER JOIN tipos_denuncia  t  ON d.id_tipo   = t.id_tipo
        INNER JOIN status_denuncia sd ON d.id_status = sd.id_status
        LEFT  JOIN usuarios        u  ON u.id_usuario = d.id_usuario
        WHERE d.id_denuncia = ?
    ");
    $stmt->bind_param('ii', $idUsuario, $id);
    $stmt->execute();
    $denuncia = $stmt->get_result()->fetch_assoc();

    if (!$denuncia) {
        responder(404, ['success' => false, 'message' => 'Denúncia não encontrada']);
    }

    $stmtImg = $conn->prepare(
        'SELECT caminho FROM imagens WHERE id_denuncia = ? ORDER BY ordem, id_imagem'
    );
    $stmtImg->bind_param('i', $id);
    $stmtImg->execute();
    $imagens = array_column($stmtImg->get_result()->fetch_all(MYSQLI_ASSOC), 'caminho');

    $stmtAtu = $conn->prepare("
        SELECT a.id_atualizacao,
               COALESCE(u.nome, 'Anônimo') AS autor,
               ta.nome   AS tipo_nome,
               ta.rotulo AS tipo,
               a.descricao, a.imagem, a.created_at
        FROM denuncia_atualizacoes a
        INNER JOIN tipos_atualizacao ta ON ta.id_tipo_atualizacao = a.id_tipo_atualizacao
        LEFT  JOIN usuarios          u  ON u.id_usuario = a.id_usuario
        WHERE a.id_denuncia = ?
        ORDER BY a.id_atualizacao DESC
    ");
    $stmtAtu->bind_param('i', $id);
    $stmtAtu->execute();
    $atualizacoes = $stmtAtu->get_result()->fetch_all(MYSQLI_ASSOC);

    $tipos = $conn->query(
        'SELECT id_tipo_atualizacao, rotulo FROM tipos_atualizacao ORDER BY id_tipo_atualizacao'
    )->fetch_all(MYSQLI_ASSOC);
} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao buscar denúncia']);
}

foreach ($atualizacoes as &$a) {
    $a['id_atualizacao'] = (int) $a['id_atualizacao'];
}
unset($a);

foreach ($tipos as &$t) {
    $t['id_tipo_atualizacao'] = (int) $t['id_tipo_atualizacao'];
}
unset($t);

$denuncia['id_denuncia'] = (int) $denuncia['id_denuncia'];
$denuncia['prioridade']  = (int) $denuncia['prioridade'];
$denuncia['latitude']    = (float) $denuncia['latitude'];
$denuncia['longitude']   = (float) $denuncia['longitude'];
$denuncia['votos']       = (int) $denuncia['votos'];
$denuncia['votou']       = (bool) $denuncia['votou'];
$denuncia['imagens']     = $imagens;
$denuncia['imagem']      = $imagens[0] ?? null;
$denuncia['atualizacoes']       = $atualizacoes;
$denuncia['tipos_atualizacao']  = $tipos;

echo json_encode($denuncia);