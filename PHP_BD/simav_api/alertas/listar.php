<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

$eu     = exigirLogin($conn);
$editor = temPermissao($eu, 'alerta.editar');
$todos  = $editor && ($_GET['todos'] ?? '') === '1';
$idReg  = inteiroPositivo($_GET['id_regiao'] ?? null);

$alertas = consulta(
    $conn,
    "SELECT a.id_alerta, a.id_regiao, r.nome AS regiao, a.nivel, a.titulo, a.descricao,
            a.inicio_em, a.fim_em, c.nome AS criador,
            (a.inicio_em <= NOW() AND (a.fim_em IS NULL OR a.fim_em > NOW())) AS vigente
     FROM alertas_regiao a
     INNER JOIN regioes r ON r.id_regiao = a.id_regiao
     LEFT  JOIN usuarios c ON c.id_usuario = a.id_criador
     WHERE (? = 1 OR (a.inicio_em <= NOW() AND (a.fim_em IS NULL OR a.fim_em > NOW())))
       AND (? = 0 OR a.id_regiao = ?)
     ORDER BY vigente DESC, FIELD(a.nivel, 'critico', 'alto', 'atencao'), a.inicio_em DESC
     LIMIT 100",
    [$todos ? 1 : 0, $idReg ?? 0, $idReg ?? 0]
);

foreach ($alertas as &$a) {
    $a['id_alerta'] = (int) $a['id_alerta'];
    $a['id_regiao'] = (int) $a['id_regiao'];
    $a['vigente']   = (bool) $a['vigente'];
}
unset($a);

echo json_encode(['success' => true, 'itens' => $alertas, 'pode_editar' => $editor]);
