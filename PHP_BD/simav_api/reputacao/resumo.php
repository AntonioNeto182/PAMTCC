<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

$eu  = exigirLogin($conn);
$eid = $eu['id_usuario'];

$rep = consulta(
    $conn,
    'SELECT pontos, nivel, denuncias_confirmadas, denuncias_rejeitadas, contribuicoes_validadas
     FROM reputacao_usuarios WHERE id_usuario = ?',
    [$eid]
)[0] ?? ['pontos' => 0, 'nivel' => 1, 'denuncias_confirmadas' => 0, 'denuncias_rejeitadas' => 0, 'contribuicoes_validadas' => 0];
$rep = array_map('intval', $rep);

$posicao = 1 + (int) consulta(
    $conn,
    'SELECT COUNT(*) AS n FROM reputacao_usuarios r
     INNER JOIN usuarios u ON u.id_usuario = r.id_usuario AND u.ativo = 1
     WHERE r.pontos > ?',
    [$rep['pontos']]
)[0]['n'];

$eventos = consulta(
    $conn,
    'SELECT e.id_evento, t.nome AS tipo, t.descricao, e.pontos, e.id_denuncia, e.observacao, e.created_at
     FROM reputacao_eventos e
     INNER JOIN tipos_reputacao t ON t.id_tipo_reputacao = e.id_tipo_reputacao
     WHERE e.id_usuario = ?
     ORDER BY e.id_evento DESC
     LIMIT 20',
    [$eid]
);

$ranking = consulta(
    $conn,
    'SELECT u.id_usuario, u.nome, u.foto_perfil, r.pontos, r.nivel
     FROM reputacao_usuarios r
     INNER JOIN usuarios u ON u.id_usuario = r.id_usuario AND u.ativo = 1
     WHERE r.pontos > 0
     ORDER BY r.pontos DESC, u.nome
     LIMIT 10',
);

foreach ($eventos as &$e) {
    $e['id_evento']   = (int) $e['id_evento'];
    $e['pontos']      = (int) $e['pontos'];
    $e['id_denuncia'] = $e['id_denuncia'] !== null ? (int) $e['id_denuncia'] : null;
}
unset($e);

foreach ($ranking as &$r) {
    $r['id_usuario'] = (int) $r['id_usuario'];
    $r['pontos']     = (int) $r['pontos'];
    $r['nivel']      = (int) $r['nivel'];
    $r['eu']         = $r['id_usuario'] === $eid;
}
unset($r);

$proximo = $rep['nivel'] * PONTOS_POR_NIVEL;

echo json_encode([
    'success'       => true,
    'reputacao'     => $rep + [
        'posicao'        => $posicao,
        'proximo_nivel'  => $proximo,
        'faltam'         => max(0, $proximo - max(0, $rep['pontos'])),
        'base_nivel'     => ($rep['nivel'] - 1) * PONTOS_POR_NIVEL,
    ],
    'eventos'       => $eventos,
    'ranking'       => $ranking,
]);
