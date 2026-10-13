<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

$eu     = exigirLogin($conn);
$editor = temPermissao($eu, 'regiao.editar');
$todas  = $editor && ($_GET['todas'] ?? '') === '1';

// Geometria completa só para quem edita (é pesada e inútil para o cidadão)
$colunaArea = $editor ? 'ST_AsText(r.area)' : 'NULL';

$regioes = consulta(
    $conn,
    "SELECT r.id_regiao, r.nome, r.descricao, r.nivel, r.id_regiao_pai, r.ativo,
            ST_Y(r.centro) AS centro_lat, ST_X(r.centro) AS centro_lng,
            $colunaArea AS area_wkt,
            rk.score, rk.nivel AS risco, rk.denuncias_abertas, rk.focos_ativos, rk.casos_recentes,
            rk.data_referencia,
            (SELECT COUNT(*) FROM alertas_regiao a
              WHERE a.id_regiao = r.id_regiao AND a.inicio_em <= NOW()
                AND (a.fim_em IS NULL OR a.fim_em > NOW())) AS alertas,
            ur.id_usuario IS NOT NULL AS seguindo,
            COALESCE(ur.notificar_alertas, 0) AS notificar_alertas
     FROM regioes r
     LEFT JOIN vw_regiao_risco_atual rk ON rk.id_regiao = r.id_regiao AND rk.metodo = 'regras_v1'
     LEFT JOIN usuario_regioes ur ON ur.id_regiao = r.id_regiao AND ur.id_usuario = ?
     WHERE (r.ativo = 1 OR ? = 1)
     ORDER BY FIELD(r.nivel, 'cidade', 'distrito', 'bairro', 'setor'), r.nome",
    [$eu['id_usuario'], $todas ? 1 : 0]
);

foreach ($regioes as &$r) {
    $r['id_regiao']         = (int) $r['id_regiao'];
    $r['id_regiao_pai']     = $r['id_regiao_pai'] !== null ? (int) $r['id_regiao_pai'] : null;
    $r['ativo']             = (bool) $r['ativo'];
    $r['centro_lat']        = (float) $r['centro_lat'];
    $r['centro_lng']        = (float) $r['centro_lng'];
    $r['score']             = $r['score'] !== null ? (float) $r['score'] : null;
    $r['denuncias_abertas'] = (int) ($r['denuncias_abertas'] ?? 0);
    $r['focos_ativos']      = (int) ($r['focos_ativos'] ?? 0);
    $r['casos_recentes']    = (int) ($r['casos_recentes'] ?? 0);
    $r['alertas']           = (int) $r['alertas'];
    $r['seguindo']          = (bool) $r['seguindo'];
    $r['notificar_alertas'] = (bool) $r['notificar_alertas'];
}
unset($r);

echo json_encode(['success' => true, 'itens' => $regioes, 'pode_editar' => $editor]);
