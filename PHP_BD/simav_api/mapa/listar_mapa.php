<?php
include('../config/cors.php');
include('../config/database.php');

$idUsuario = (int) filter_input(INPUT_GET, 'id_usuario', FILTER_VALIDATE_INT); // 0 = visitante

$sql = "
SELECT
    d.id_denuncia,
    d.id_local,
    d.descricao,
    d.prioridade,
    d.created_at        AS data_denuncia,
    COALESCE(u.nome, 'Anônimo') AS autor,
    sd.nome             AS status,
    sd.cor              AS status_cor,
    t.nome              AS tipo,
    l.endereco,
    l.bairro,
    l.cidade,
    l.estado,
    ST_Y(l.localizacao) AS latitude,
    ST_X(l.localizacao) AS longitude,
    (SELECT COUNT(*) FROM corroboracoes c
      WHERE c.id_denuncia = d.id_denuncia AND c.oculta = 0) AS votos,
    EXISTS(SELECT 1 FROM corroboracoes c
            WHERE c.id_denuncia = d.id_denuncia AND c.id_usuario = ?) AS votou,
    (SELECT COUNT(*) FROM denuncia_atualizacoes a WHERE a.id_denuncia = d.id_denuncia) AS atualizacoes,
    (SELECT caminho FROM imagens
      WHERE id_denuncia = d.id_denuncia
      ORDER BY ordem, id_imagem LIMIT 1) AS imagem
FROM denuncias d
INNER JOIN locais          l  ON d.id_local   = l.id_local
INNER JOIN tipos_denuncia  t  ON d.id_tipo    = t.id_tipo
INNER JOIN status_denuncia sd ON d.id_status  = sd.id_status
LEFT  JOIN usuarios        u  ON u.id_usuario = d.id_usuario
ORDER BY d.id_denuncia DESC
LIMIT 500
";

try {
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $idUsuario);
    $stmt->execute();
    $dados = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro ao listar denúncias']);
    exit;
}

foreach ($dados as &$linha) {
    $linha['id_denuncia']  = (int) $linha['id_denuncia'];
    $linha['id_local']     = (int) $linha['id_local'];
    $linha['prioridade']   = (int) $linha['prioridade'];
    $linha['latitude']     = (float) $linha['latitude'];
    $linha['longitude']    = (float) $linha['longitude'];
    $linha['votos']        = (int) $linha['votos'];
    $linha['votou']        = (bool) $linha['votou'];
    $linha['atualizacoes'] = (int) $linha['atualizacoes'];
}
unset($linha);

echo json_encode($dados);