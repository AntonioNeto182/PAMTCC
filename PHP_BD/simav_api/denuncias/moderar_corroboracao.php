<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

const ACOES = ['ocultar', 'exibir', 'validar', 'spam'];

exigirMetodo('POST');

$eu    = exigirPermissao($conn, 'denuncia.moderar');
$dados = corpoJson();
$id    = inteiroPositivo($dados['id_corroboracao'] ?? null) ?? falhar(400, 'Dados incompletos');
$acao  = (string) ($dados['acao'] ?? '');

if (!in_array($acao, ACOES, true)) {
    falhar(400, 'Ação inválida');
}

$c = consulta(
    $conn,
    'SELECT id_corroboracao, id_denuncia, id_usuario, validada_em, oculta FROM corroboracoes WHERE id_corroboracao = ?',
    [$id]
)[0] ?? falhar(404, 'Corroboração não encontrada');

$conn->begin_transaction();

switch ($acao) {
    case 'ocultar':
        executar($conn, 'UPDATE corroboracoes SET oculta = 1 WHERE id_corroboracao = ?', [$id]);
        break;

    case 'exibir':
        executar($conn, 'UPDATE corroboracoes SET oculta = 0 WHERE id_corroboracao = ?', [$id]);
        break;

    case 'validar':
        if ($c['validada_em'] === null) {
            executar(
                $conn,
                'UPDATE corroboracoes SET id_validador = ?, validada_em = NOW(), oculta = 0 WHERE id_corroboracao = ?',
                [$eu['id_usuario'], $id]
            );
            registrarReputacao($conn, (int) $c['id_usuario'], 'corroboracao_validada', (int) $c['id_denuncia']);
        }
        break;

    case 'spam':
        executar(
            $conn,
            'UPDATE corroboracoes SET oculta = 1, id_validador = ?, validada_em = NULL WHERE id_corroboracao = ?',
            [$eu['id_usuario'], $id]
        );
        if (!(int) $c['oculta']) { // evita penalizar duas vezes a mesma contribuição
            registrarReputacao($conn, (int) $c['id_usuario'], 'contribuicao_spam', (int) $c['id_denuncia']);
        }
        break;
}

$conn->commit();

echo json_encode(['success' => true]);
