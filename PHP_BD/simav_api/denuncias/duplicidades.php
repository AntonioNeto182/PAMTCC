<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

$eu = exigirPermissao($conn, 'denuncia.moderar');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $idDenuncia = inteiroPositivo($_GET['id_denuncia'] ?? null) ?? falhar(400, 'ID inválido');

    $itens = consulta(
        $conn,
        "SELECT x.id_duplicidade, x.id_denuncia, x.id_denuncia_candidata, x.distancia_metros,
                x.similaridade, x.status, c.descricao AS descricao_candidata, t.nome AS tipo_candidata,
                c.created_at AS criada_em
         FROM denuncia_duplicidades x
         INNER JOIN denuncias c ON c.id_denuncia = x.id_denuncia_candidata
         INNER JOIN tipos_denuncia t ON t.id_tipo = c.id_tipo
         WHERE x.id_denuncia = ? AND x.status <> 'descartada'
         ORDER BY x.similaridade DESC, x.id_duplicidade",
        [$idDenuncia]
    );

    foreach ($itens as &$i) {
        $i['id_duplicidade']        = (int) $i['id_duplicidade'];
        $i['id_denuncia']           = (int) $i['id_denuncia'];
        $i['id_denuncia_candidata'] = (int) $i['id_denuncia_candidata'];
        $i['distancia_metros']      = $i['distancia_metros'] !== null ? (float) $i['distancia_metros'] : null;
        $i['similaridade']          = $i['similaridade'] !== null ? (int) $i['similaridade'] : null;
    }
    unset($i);

    echo json_encode(['success' => true, 'itens' => $itens]);
    exit;
}

exigirMetodo('POST');

$dados = corpoJson();
$id    = inteiroPositivo($dados['id_duplicidade'] ?? null) ?? falhar(400, 'Dados incompletos');
$acao  = (string) ($dados['acao'] ?? '');

$x = consulta(
    $conn,
    'SELECT id_denuncia, id_denuncia_candidata, status FROM denuncia_duplicidades WHERE id_duplicidade = ?',
    [$id]
)[0] ?? falhar(404, 'Sugestão não encontrada');

if ($x['status'] !== 'sugerida') {
    falhar(409, 'Esta sugestão já foi decidida');
}

$conn->begin_transaction();
$conn->query('SET @app_user_id = ' . (int) $eu['id_usuario']); // auditoria da denúncia

if ($acao === 'confirmar') {
    executar(
        $conn,
        "UPDATE denuncia_duplicidades SET status = 'confirmada', id_decisor = ?, decidida_em = NOW() WHERE id_duplicidade = ?",
        [$eu['id_usuario'], $id]
    );
    // A denúncia fica apontando para a original
    executar(
        $conn,
        'UPDATE denuncias SET id_denuncia_principal = ? WHERE id_denuncia = ? AND id_denuncia <> ?',
        [(int) $x['id_denuncia_candidata'], (int) $x['id_denuncia'], (int) $x['id_denuncia_candidata']]
    );
} elseif ($acao === 'descartar') {
    executar(
        $conn,
        "UPDATE denuncia_duplicidades SET status = 'descartada', id_decisor = ?, decidida_em = NOW() WHERE id_duplicidade = ?",
        [$eu['id_usuario'], $id]
    );
} else {
    $conn->rollback();
    falhar(400, 'Ação inválida');
}

$conn->commit();

echo json_encode(['success' => true]);
