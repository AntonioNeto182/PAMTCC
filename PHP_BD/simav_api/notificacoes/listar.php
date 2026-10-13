<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

$eu          = exigirLogin($conn);
$apenasNovas = ($_GET['nao_lidas'] ?? '') === '1';

[$pagina, $limite, $deslocamento] = paginacao(20);

$linhas = consulta(
    $conn,
    'SELECT n.id_notificacao, t.nome AS tipo, n.titulo, n.mensagem, n.id_denuncia,
            NULL AS id_amizade,
            n.id_usuario_origem, o.nome AS origem, n.lida_em, n.created_at
     FROM notificacoes n
     INNER JOIN tipos_notificacao t ON t.id_tipo_notificacao = n.id_tipo_notificacao
     LEFT  JOIN usuarios o ON o.id_usuario = n.id_usuario_origem
     WHERE n.id_usuario = ? AND (? = 0 OR n.lida_em IS NULL)
     ORDER BY n.id_notificacao DESC
     LIMIT ? OFFSET ?',
    [$eu['id_usuario'], $apenasNovas ? 1 : 0, $limite, $deslocamento]
);

[$itens, $temMais] = cortarPagina($linhas, 20);

foreach ($itens as &$i) {
    $i['id_notificacao'] = (int) $i['id_notificacao'];
    $i['id_denuncia']    = $i['id_denuncia'] !== null ? (int) $i['id_denuncia'] : null;
    $i['id_amizade']     = $i['id_amizade'] !== null ? (int) $i['id_amizade'] : null;
    $i['lida']           = $i['lida_em'] !== null;
}
unset($i);

$naoLidas = (int) consulta(
    $conn,
    'SELECT COUNT(*) AS n FROM notificacoes WHERE id_usuario = ? AND lida_em IS NULL',
    [$eu['id_usuario']]
)[0]['n'];

echo json_encode(['success' => true, 'itens' => $itens, 'tem_mais' => $temMais, 'nao_lidas' => $naoLidas]);