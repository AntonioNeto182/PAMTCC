<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirMetodo('POST');

$eu         = exigirPermissao($conn, 'interacao.criar');
$dados      = corpoJson();
$idDenuncia = inteiroPositivo($dados['id_denuncia'] ?? null) ?? falhar(400, 'Dados incompletos');
$notificar  = array_key_exists('notificar', $dados) ? (int) filter_var($dados['notificar'], FILTER_VALIDATE_BOOLEAN) : null;

if (!existe($conn, 'denuncias', 'id_denuncia', $idDenuncia)) {
    falhar(404, 'Denúncia não encontrada');
}

$atual = consulta(
    $conn,
    'SELECT notificar FROM denuncia_favoritos WHERE id_denuncia = ? AND id_usuario = ?',
    [$idDenuncia, $eu['id_usuario']]
)[0] ?? null;

if ($atual === null) {
    $notificar ??= 1;
    executar(
        $conn,
        'INSERT INTO denuncia_favoritos (id_denuncia, id_usuario, notificar) VALUES (?, ?, ?)',
        [$idDenuncia, $eu['id_usuario'], $notificar]
    );
    $favoritada = true;
} elseif ($notificar !== null) {
    // Já favoritada e veio o flag: só ajusta o aviso
    executar(
        $conn,
        'UPDATE denuncia_favoritos SET notificar = ? WHERE id_denuncia = ? AND id_usuario = ?',
        [$notificar, $idDenuncia, $eu['id_usuario']]
    );
    $favoritada = true;
} else {
    executar($conn, 'DELETE FROM denuncia_favoritos WHERE id_denuncia = ? AND id_usuario = ?', [$idDenuncia, $eu['id_usuario']]);
    $favoritada = false;
    $notificar  = 0;
}

echo json_encode(['success' => true, 'favoritada' => $favoritada, 'notificar' => (bool) ($notificar ?? $atual['notificar'])]);
