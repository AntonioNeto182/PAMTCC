<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

$eu = exigirLogin($conn);

$gestor = temPermissao($eu, 'configuracao.editar');
if (!$gestor && !temPermissao($eu, 'encaminhamento.editar')) {
    falhar(403, 'Você não tem permissão para esta ação');
}

// Quem só encaminha vê apenas os órgãos ativos
$orgaos = consulta(
    $conn,
    'SELECT id_orgao, nome, sigla, esfera, contato_email, ativo
     FROM orgaos_publicos
     WHERE (ativo = 1 OR ? = 1)
     ORDER BY nome',
    [$gestor ? 1 : 0]
);

foreach ($orgaos as &$o) {
    $o['id_orgao'] = (int) $o['id_orgao'];
    $o['ativo']    = (bool) $o['ativo'];
}
unset($o);

echo json_encode(['success' => true, 'itens' => $orgaos, 'pode_editar' => $gestor]);
