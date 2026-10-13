<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

const ESFERAS = ['municipal', 'estadual', 'federal'];

exigirMetodo('POST');

exigirPermissao($conn, 'configuracao.editar');
$dados = corpoJson();
$id    = inteiroPositivo($dados['id_orgao'] ?? null);
$acao  = (string) ($dados['acao'] ?? 'salvar');

try {
    if ($acao === 'excluir') {
        $id ?? falhar(400, 'Dados incompletos');
        executar($conn, 'DELETE FROM orgaos_publicos WHERE id_orgao = ?', [$id]);
        echo json_encode(['success' => true]);
        exit;
    }

    if ($acao === 'alternar') {
        $id ?? falhar(400, 'Dados incompletos');
        executar($conn, 'UPDATE orgaos_publicos SET ativo = NOT ativo WHERE id_orgao = ?', [$id]);
        echo json_encode(['success' => true]);
        exit;
    }

    $nome   = textoObrigatorio($dados['nome'] ?? null, 150, 'Nome');
    $sigla  = textoOpcional($dados['sigla'] ?? null, 20, 'Sigla');
    $esfera = (string) ($dados['esfera'] ?? 'municipal');
    $email  = strtolower((string) textoOpcional($dados['contato_email'] ?? null, 150, 'E-mail')) ?: null;

    if (!in_array($esfera, ESFERAS, true)) {
        falhar(400, 'Esfera inválida');
    }
    if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        falhar(400, 'E-mail inválido');
    }

    if ($id === null) {
        executar(
            $conn,
            'INSERT INTO orgaos_publicos (nome, sigla, esfera, contato_email) VALUES (?, ?, ?, ?)',
            [$nome, $sigla, $esfera, $email]
        );
        http_response_code(201);
        echo json_encode(['success' => true, 'id_orgao' => $conn->insert_id]);
        exit;
    }

    executar(
        $conn,
        'UPDATE orgaos_publicos SET nome = ?, sigla = ?, esfera = ?, contato_email = ? WHERE id_orgao = ?',
        [$nome, $sigla, $esfera, $email, $id]
    );
    echo json_encode(['success' => true, 'id_orgao' => $id]);
} catch (mysqli_sql_exception $e) {
    if ($e->getCode() === 1062) {
        falhar(409, 'Já existe um órgão com este nome');
    }
    if ($e->getCode() === 1451) {
        falhar(409, 'O órgão possui encaminhamentos; desative-o em vez de excluir');
    }
    throw $e;
}
