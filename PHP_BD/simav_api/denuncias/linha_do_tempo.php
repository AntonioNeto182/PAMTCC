<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirPermissao($conn, 'denuncia.visualizar');

$idDenuncia = inteiroPositivo($_GET['id_denuncia'] ?? null) ?? falhar(400, 'ID inválido');

$eventos = consulta(
    $conn,
    "SELECT t.tipo_evento, t.referencia_id, t.descricao, t.ocorrido_em,
            COALESCE(u.nome, 'Sistema') AS autor
     FROM vw_linha_do_tempo t
     LEFT JOIN usuarios u ON u.id_usuario = t.id_usuario
     WHERE t.id_denuncia = ?
     ORDER BY t.ocorrido_em DESC, t.referencia_id DESC
     LIMIT 100",
    [$idDenuncia]
);

foreach ($eventos as &$e) {
    $e['referencia_id'] = (int) $e['referencia_id'];
}
unset($e);

echo json_encode(['success' => true, 'itens' => $eventos]);
