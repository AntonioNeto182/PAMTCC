<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

$eu     = exigirLogin($conn);
$id     = inteiroPositivo($_GET['id'] ?? null) ?? $eu['id_usuario'];
$proprio = $id === $eu['id_usuario'];

if (!$proprio && !temPermissao($eu, 'usuario.visualizar')) {
    falhar(403, 'Você não tem permissão para esta ação');
}

$usuario = consulta(
    $conn,
    'SELECT u.id_usuario, u.nome, u.email, u.foto_perfil, u.id_papel, p.nome AS papel,
            u.ultimo_acesso, u.created_at,
            u.email_verificado_em IS NOT NULL    AS email_verificado,
            u.telefone_verificado_em IS NOT NULL AS telefone_verificado
     FROM usuarios u
     INNER JOIN papeis p ON p.id_papel = u.id_papel
     WHERE u.id_usuario = ? AND u.ativo = 1',
    [$id]
)[0] ?? falhar(404, 'Usuário não encontrado');

$stats = consulta(
    $conn,
    "SELECT COUNT(*) AS total,
            COALESCE(SUM(sd.nome NOT IN ('resolvida', 'rejeitada')), 0) AS em_aberto,
            COALESCE(SUM(sd.nome = 'resolvida'), 0) AS resolvidas
     FROM denuncias d
     INNER JOIN status_denuncia sd ON sd.id_status = d.id_status
     WHERE d.id_usuario = ?",
    [$id]
)[0];

$rep = consulta(
    $conn,
    'SELECT pontos, nivel, denuncias_confirmadas, denuncias_rejeitadas, contribuicoes_validadas
     FROM reputacao_usuarios WHERE id_usuario = ?',
    [$id]
)[0] ?? ['pontos' => 0, 'nivel' => 1, 'denuncias_confirmadas' => 0, 'denuncias_rejeitadas' => 0, 'contribuicoes_validadas' => 0];

// Sistema de amizades removido no schema v3.1.
$amigos = 0;

if (!$proprio) {
    unset($usuario['email_verificado'], $usuario['telefone_verificado']);
}

$usuario['id_usuario']          = (int) $usuario['id_usuario'];
$usuario['id_papel']            = (int) $usuario['id_papel'];
if ($proprio) {
    $usuario['email_verificado']    = (bool) $usuario['email_verificado'];
    $usuario['telefone_verificado'] = (bool) $usuario['telefone_verificado'];
}

echo json_encode([
    'success'      => true,
    'usuario'      => $usuario,
    'estatisticas' => [
        'total'      => (int) $stats['total'],
        'em_aberto'  => (int) $stats['em_aberto'],
        'resolvidas' => (int) $stats['resolvidas'],
        'amigos'     => $amigos,
    ],
    'reputacao'    => array_map('intval', $rep),
]);