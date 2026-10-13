<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirMetodo('POST');

$eu         = exigirPermissao($conn, 'interacao.criar');
$idDenuncia = inteiroPositivo($_POST['id_denuncia'] ?? null) ?? falhar(400, 'Dados incompletos');
$descricao  = textoOpcional($_POST['descricao'] ?? null, 500, 'Descrição');
$relativo   = salvarImagem($_FILES['imagem'] ?? null, 'atualizacoes');

if ($descricao === null && $relativo === null) {
    falhar(400, 'Informe uma descrição ou uma imagem');
}

try {
    if (!existe($conn, 'denuncias', 'id_denuncia', $idDenuncia)) {
        falhar(404, 'Denúncia não encontrada');
    }

    executar(
        $conn,
        'INSERT INTO denuncia_atualizacoes (id_denuncia, id_usuario, descricao, imagem) VALUES (?, ?, ?, ?)',
        [$idDenuncia, $eu['id_usuario'], $descricao, $relativo]
    );
} catch (Throwable $e) {
    removerImagem($relativo);
    throw $e;
}

echo json_encode(['success' => true, 'id_atualizacao' => $conn->insert_id]);
