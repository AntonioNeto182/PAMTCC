<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirMetodo('POST');

$eu    = exigirPermissao($conn, 'interacao.criar');
$dados = corpoJson();
$id    = inteiroPositivo($dados['id_comentario'] ?? null) ?? falhar(400, 'Dados incompletos');
$acao  = (string) ($dados['acao'] ?? '');

$c = consulta(
    $conn,
    'SELECT id_usuario, removido_em FROM denuncia_comentarios WHERE id_comentario = ?',
    [$id]
)[0] ?? falhar(404, 'Comentário não encontrado');

$meu = (int) $c['id_usuario'] === $eu['id_usuario'];

if ($c['removido_em'] !== null) {
    falhar(409, 'Comentário já removido');
}

switch ($acao) {
    case 'editar':
        if (!$meu) {
            falhar(403, 'Você só pode editar seus próprios comentários');
        }
        $texto = textoObrigatorio($dados['texto'] ?? null, 1000, 'Comentário');
        executar($conn, 'UPDATE denuncia_comentarios SET texto = ?, editado_em = NOW() WHERE id_comentario = ?', [$texto, $id]);
        break;

    case 'remover':
        if (!$meu && !temPermissao($eu, 'denuncia.moderar')) {
            falhar(403, 'Você não tem permissão para esta ação');
        }
        executar($conn, 'UPDATE denuncia_comentarios SET removido_em = NOW() WHERE id_comentario = ?', [$id]);
        break;

    default:
        falhar(400, 'Ação inválida');
}

echo json_encode(['success' => true]);
