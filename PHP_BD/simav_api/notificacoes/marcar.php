<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirMetodo('POST');

$eu    = exigirLogin($conn);
$dados = corpoJson();
$acao  = (string) ($dados['acao'] ?? '');
$id    = inteiroPositivo($dados['id_notificacao'] ?? null);
$eid   = $eu['id_usuario'];

// Toda operação é restrita às notificações do próprio usuário
switch ($acao) {
    case 'lida':
        $id ?? falhar(400, 'Dados incompletos');
        executar($conn, 'UPDATE notificacoes SET lida_em = COALESCE(lida_em, NOW()) WHERE id_notificacao = ? AND id_usuario = ?', [$id, $eid]);
        break;

    case 'todas_lidas':
        executar($conn, 'UPDATE notificacoes SET lida_em = NOW() WHERE id_usuario = ? AND lida_em IS NULL', [$eid]);
        break;

    case 'excluir':
        $id ?? falhar(400, 'Dados incompletos');
        executar($conn, 'DELETE FROM notificacoes WHERE id_notificacao = ? AND id_usuario = ?', [$id, $eid]);
        break;

    case 'limpar_lidas':
        executar($conn, 'DELETE FROM notificacoes WHERE id_usuario = ? AND lida_em IS NOT NULL', [$eid]);
        break;

    default:
        falhar(400, 'Ação inválida');
}

echo json_encode(['success' => true]);
