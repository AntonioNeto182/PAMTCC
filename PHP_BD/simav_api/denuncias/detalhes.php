<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

$eu = exigirPermissao($conn, 'denuncia.visualizar');
$id = inteiroPositivo($_GET['id'] ?? null) ?? falhar(400, 'ID inválido');
$eid = $eu['id_usuario'];

$denuncia = consulta(
    $conn,
    "SELECT
        d.id_denuncia, d.id_usuario AS id_autor, d.descricao, d.prioridade, d.data_ocorrencia,
        d.id_denuncia_principal,
        d.created_at        AS data_denuncia,
        COALESCE(u.nome, 'Anônimo') AS autor,
        sd.id_status, sd.nome AS status, sd.cor AS status_cor,
        t.nome              AS tipo,
        l.endereco, l.numero, l.complemento, l.bairro, l.cidade, l.estado,
        l.origem_localizacao, l.precisao_metros, l.id_regiao,
        ST_Y(l.localizacao) AS latitude,
        ST_X(l.localizacao) AS longitude,
        (SELECT COUNT(*) FROM corroboracoes c WHERE c.id_denuncia = d.id_denuncia AND c.oculta = 0) AS votos,
        EXISTS(SELECT 1 FROM corroboracoes c WHERE c.id_denuncia = d.id_denuncia AND c.id_usuario = ?) AS votou,
        EXISTS(SELECT 1 FROM denuncia_favoritos f WHERE f.id_denuncia = d.id_denuncia AND f.id_usuario = ?) AS favoritada,
        (SELECT COUNT(*) FROM denuncia_comentarios m
          WHERE m.id_denuncia = d.id_denuncia AND m.removido_em IS NULL) AS comentarios,
        (SELECT COUNT(*) FROM corroboracoes c
          WHERE c.id_denuncia = d.id_denuncia AND c.oculta = 0
            AND (c.descricao IS NOT NULL OR c.imagem IS NOT NULL)) AS evidencias
     FROM denuncias d
     INNER JOIN locais          l  ON d.id_local   = l.id_local
     INNER JOIN tipos_denuncia  t  ON d.id_tipo    = t.id_tipo
     INNER JOIN status_denuncia sd ON d.id_status  = sd.id_status
     LEFT  JOIN usuarios        u  ON u.id_usuario = d.id_usuario
     WHERE d.id_denuncia = ?",
    [$eid, $eid, $id]
)[0] ?? falhar(404, 'Denúncia não encontrada');

$imagens = array_column(
    consulta($conn, 'SELECT caminho FROM imagens WHERE id_denuncia = ? ORDER BY ordem, id_imagem', [$id]),
    'caminho'
);

$atualizacoes = consulta(
    $conn,
    "SELECT a.id_atualizacao, COALESCE(u.nome, 'Anônimo') AS autor, a.descricao, a.imagem, a.created_at
     FROM denuncia_atualizacoes a
     LEFT JOIN usuarios u ON u.id_usuario = a.id_usuario
     WHERE a.id_denuncia = ?
     ORDER BY a.id_atualizacao DESC",
    [$id]
);

$minha = consulta(
    $conn,
    'SELECT descricao, imagem, oculta, validada_em IS NOT NULL AS validada
     FROM corroboracoes WHERE id_denuncia = ? AND id_usuario = ?',
    [$id, $eid]
)[0] ?? null;

foreach ($atualizacoes as &$a) {
    $a['id_atualizacao'] = (int) $a['id_atualizacao'];
}
unset($a);

if ($minha !== null) {
    $minha['oculta']   = (bool) $minha['oculta'];
    $minha['validada'] = (bool) $minha['validada'];
}

$denuncia['id_denuncia']           = (int) $denuncia['id_denuncia'];
$denuncia['id_autor']              = $denuncia['id_autor'] !== null ? (int) $denuncia['id_autor'] : null;
$denuncia['id_status']             = (int) $denuncia['id_status'];
$denuncia['id_regiao']             = $denuncia['id_regiao'] !== null ? (int) $denuncia['id_regiao'] : null;
$denuncia['id_denuncia_principal'] = $denuncia['id_denuncia_principal'] !== null ? (int) $denuncia['id_denuncia_principal'] : null;
$denuncia['prioridade']            = (int) $denuncia['prioridade'];
$denuncia['precisao_metros']       = $denuncia['precisao_metros'] !== null ? (int) $denuncia['precisao_metros'] : null;
$denuncia['latitude']              = (float) $denuncia['latitude'];
$denuncia['longitude']             = (float) $denuncia['longitude'];
$denuncia['votos']                 = (int) $denuncia['votos'];
$denuncia['votou']                 = (bool) $denuncia['votou'];
$denuncia['favoritada']            = (bool) $denuncia['favoritada'];
$denuncia['comentarios']           = (int) $denuncia['comentarios'];
$denuncia['evidencias']            = (int) $denuncia['evidencias'];
$denuncia['sou_autor']             = $denuncia['id_autor'] === $eid;
$denuncia['minha_corroboracao']    = $minha;
$denuncia['imagens']               = $imagens;
$denuncia['imagem']                = $imagens[0] ?? null;
$denuncia['atualizacoes']          = $atualizacoes;

echo json_encode($denuncia);
