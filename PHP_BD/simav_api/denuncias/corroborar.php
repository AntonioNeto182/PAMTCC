<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirMetodo('POST');

$eu         = exigirPermissao($conn, 'interacao.criar');
$dados      = entrada();
$idDenuncia = inteiroPositivo($dados['id_denuncia'] ?? null) ?? falhar(400, 'Dados incompletos');
$acao       = (string) ($dados['acao'] ?? 'salvar');

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

if ($acao !== 'remover' && in_array($denuncia['status'], ['resolvida', 'rejeitada'], true)) {
    falhar(409, 'Esta denúncia está encerrada e não aceita novas corroborações.');
}

$atual = consulta(
    $conn,
    'SELECT id_corroboracao, imagem FROM corroboracoes WHERE id_denuncia = ? AND id_usuario = ?',
    [$idDenuncia, $eu['id_usuario']]
)[0] ?? null;

if ($acao === 'remover') {
    if ($atual) {
        executar($conn, 'DELETE FROM corroboracoes WHERE id_corroboracao = ?', [(int) $atual['id_corroboracao']]);
        removerImagem($atual['imagem']);
    }
    $votou = false;
} else {
    $descricao = textoOpcional($dados['descricao'] ?? null, 500, 'Descrição');
    $nova      = salvarImagem($_FILES['imagem'] ?? null, 'corroboracoes');

    if ($descricao === null && $nova === null && !$atual) {
        falhar(400, 'Informe uma descrição ou uma imagem');
    }

    try {
        if ($atual) {
            // Conteúdo novo precisa ser validado de novo por um agente
            executar(
                $conn,
                'UPDATE corroboracoes
                 SET descricao = COALESCE(?, descricao),
                     imagem = COALESCE(?, imagem),
                     id_validador = NULL, validada_em = NULL
                 WHERE id_corroboracao = ?',
                [$descricao, $nova, (int) $atual['id_corroboracao']]
            );
            if ($nova !== null) {
                removerImagem($atual['imagem']);
            }
        } else {
            executar(
                $conn,
                'INSERT INTO corroboracoes (id_denuncia, id_usuario, descricao, imagem) VALUES (?, ?, ?, ?)',
                [$idDenuncia, $eu['id_usuario'], $descricao, $nova]
            );
        }
    } catch (Throwable $e) {
        removerImagem($nova);
        throw $e;
    }
    $votou = true;
}

$resumo = consulta(
    $conn,
    'SELECT COUNT(*) AS votos FROM corroboracoes WHERE id_denuncia = ? AND oculta = 0',
    [$idDenuncia]
)[0];

echo json_encode(['success' => true, 'votos' => (int) $resumo['votos'], 'votou' => $votou]);