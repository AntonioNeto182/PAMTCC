<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirPermissao($conn, 'encaminhamento.editar');

$idDenuncia = inteiroPositivo($_GET['id_denuncia'] ?? null) ?? falhar(400, 'ID inválido');

$itens = consulta(
    $conn,
    'SELECT e.id_encaminhamento, e.id_orgao, o.nome AS orgao, o.sigla, e.protocolo_externo, e.status,
            e.enviado_em, e.respondido_em, e.observacao, u.nome AS responsavel, e.created_at
     FROM denuncia_encaminhamentos e
     INNER JOIN orgaos_publicos o ON o.id_orgao = e.id_orgao
     LEFT  JOIN usuarios u ON u.id_usuario = e.id_usuario
     WHERE e.id_denuncia = ?
     ORDER BY e.id_encaminhamento DESC',
    [$idDenuncia]
);

foreach ($itens as &$i) {
    $i['id_encaminhamento'] = (int) $i['id_encaminhamento'];
    $i['id_orgao']          = (int) $i['id_orgao'];
}
unset($i);

echo json_encode(['success' => true, 'itens' => $itens]);
