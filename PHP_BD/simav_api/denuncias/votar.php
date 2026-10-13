<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirMetodo('POST');

$eu         = exigirPermissao($conn, 'interacao.criar');
$idDenuncia = inteiroPositivo(corpoJson()['id_denuncia'] ?? null) ?? falhar(400, 'Dados incompletos');

$denuncia = consulta(
    $conn,
    'SELECT d.id_usuario, sd.nome AS status
       FROM denuncias d
       INNER JOIN status_denuncia sd ON sd.id_status = d.id_status
      WHERE d.id_denuncia = ?',
    [$idDenuncia]
)[0] ?? falhar(404, 'Denúncia não encontrada');

if ((int) $denuncia['id_usuario'] === $eu['id_usuario']) {
    falhar(403, 'O autor não pode corroborar a própria denúncia');
}

if (in_array($denuncia['status'], ['resolvida', 'rejeitada'], true)) {
    falhar(409, 'Esta denúncia está encerrada e não aceita novas corroborações.');
}

// "Up" = corroboração simples. O toggle só remove se não houver descrição nem imagem,
// para nunca apagar uma evidência enviada pelo usuário.
$removidas = executar(
    $conn,
    'DELETE FROM corroboracoes
     WHERE id_denuncia = ? AND id_usuario = ? AND descricao IS NULL AND imagem IS NULL',
    [$idDenuncia, $eu['id_usuario']]
);

$votou = false;

if ($removidas === 0) {
    try {
        executar($conn, 'INSERT INTO corroboracoes (id_denuncia, id_usuario) VALUES (?, ?)', [$idDenuncia, $eu['id_usuario']]);
        $votou = true;
    } catch (mysqli_sql_exception $e) {
        if ($e->getCode() !== 1062) { // 1062: já existe (com descrição/imagem) — continua corroborando
            throw $e;
        }
        $votou = true;
    }
}

$votos = (int) consulta(
    $conn,
    'SELECT COUNT(*) AS total FROM corroboracoes WHERE id_denuncia = ? AND oculta = 0',
    [$idDenuncia]
)[0]['total'];

echo json_encode(['success' => true, 'votos' => $votos, 'votou' => $votou]);