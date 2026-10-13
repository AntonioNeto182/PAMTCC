<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirMetodo('POST');

$eu         = exigirPermissao($conn, 'interacao.criar');
$dados      = corpoJson();
$idDenuncia = inteiroPositivo($dados['id_denuncia'] ?? null) ?? falhar(400, 'Dados incompletos');
$texto      = textoObrigatorio($dados['texto'] ?? null, 1000, 'Comentário');
$idPai      = inteiroPositivo($dados['id_comentario_pai'] ?? null);

if (!existe($conn, 'denuncias', 'id_denuncia', $idDenuncia)) {
    falhar(404, 'Denúncia não encontrada');
}

if ($idPai !== null) {
    $pai = consulta(
        $conn,
        'SELECT id_denuncia, id_comentario_pai, removido_em FROM denuncia_comentarios WHERE id_comentario = ?',
        [$idPai]
    )[0] ?? falhar(404, 'Comentário não encontrado');

    if ((int) $pai['id_denuncia'] !== $idDenuncia) {
        falhar(400, 'Comentário de outra denúncia');
    }
    // Só dois níveis: responder a uma resposta anexa ao comentário raiz
    if ($pai['id_comentario_pai'] !== null) {
        $idPai = (int) $pai['id_comentario_pai'];
    }
}

executar(
    $conn,
    'INSERT INTO denuncia_comentarios (id_denuncia, id_usuario, id_comentario_pai, texto) VALUES (?, ?, ?, ?)',
    [$idDenuncia, $eu['id_usuario'], $idPai, $texto]
);

http_response_code(201);
echo json_encode(['success' => true, 'id_comentario' => $conn->insert_id]);
