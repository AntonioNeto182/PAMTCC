<?php
// =====================================================================
// ARQUIVO: C:\xampp\htdocs\simav_api\notificacoes\contagem.php
// =====================================================================
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

$eu = exigirLogin($conn);

$c = consulta(
    $conn,
    'SELECT COUNT(*) AS nao_lidas
       FROM notificacoes
      WHERE id_usuario = ? AND lida_em IS NULL',
    [$eu['id_usuario']]
)[0];

echo json_encode([
    'success'            => true,
    'nao_lidas'          => (int) $c['nao_lidas'],
    // Sistema de amizades removido no schema v3.1.
    // Mantém o campo para o front não quebrar.
    'amizades_pendentes' => 0,
]);