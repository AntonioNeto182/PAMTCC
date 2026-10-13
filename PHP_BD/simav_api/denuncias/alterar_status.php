<?php
// =====================================================================
// ARQUIVO: C:\xampp\htdocs\simav_api\denuncias\alterar_status.php
// =====================================================================
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

const STATUS_REJEITADA = 5;

exigirMetodo('POST');

$eu         = exigirPermissao($conn, 'denuncia.moderar');
$dados      = corpoJson();
$idDenuncia = inteiroPositivo($dados['id_denuncia'] ?? null);
$idStatus   = inteiroPositivo($dados['id_status'] ?? null);
$observacao = textoOpcional($dados['observacao'] ?? null, 500, 'Observação');

if (!$idDenuncia || !$idStatus) {
    falhar(400, 'Dados inválidos');
}

if (!consulta($conn, 'SELECT 1 FROM denuncias WHERE id_denuncia = ?', [$idDenuncia])) {
    falhar(404, 'Denúncia não encontrada');
}
if (!consulta($conn, 'SELECT 1 FROM status_denuncia WHERE id_status = ?', [$idStatus])) {
    falhar(400, 'Status inválido');
}

// Atalho: se já está no status desejado, não há nada pra fazer.
// (A procedure levantaria SIGNAL — melhor tratar antes.)
$statusAtual = (int) consulta(
    $conn,
    'SELECT id_status FROM denuncias WHERE id_denuncia = ?',
    [$idDenuncia]
)[0]['id_status'];

if ($statusAtual === $idStatus) {
    $info = consulta(
        $conn,
        'SELECT nome, cor FROM status_denuncia WHERE id_status = ?',
        [$idStatus]
    )[0];
    echo json_encode(['success' => true, 'status' => $info['nome'], 'status_cor' => $info['cor']]);
    exit;
}

try {
    $conn->begin_transaction();
    $conn->query('SET @app_user_id = ' . (int) $eu['id_usuario']); // alimenta a auditoria

    // CALL via query() direto. Os valores são todos seguros:
    // - 3 inteiros já validados por inteiroPositivo()
    // - 1 string passada por real_escape_string()
    $sqlCall = sprintf(
        'CALL sp_alterar_status_denuncia(%d, %d, %d, %s)',
        $idDenuncia,
        $idStatus,
        $eu['id_usuario'],
        $observacao === null
            ? 'NULL'
            : "'" . $conn->real_escape_string($observacao) . "'"
    );
    $conn->query($sqlCall);

    // Consome TODOS os result sets pendentes do CALL.
    // Sem isto, o próximo consulta() (SELECT do status novo) falha com
    // "Commands out of sync".
    while ($conn->more_results() && $conn->next_result()) {
        // apenas descarta
    }

    // Rejeição sem comprovação tira pontos do autor (o banco não faz isso sozinho)
    if ($idStatus === STATUS_REJEITADA) {
        $autor = consulta(
            $conn,
            'SELECT id_usuario FROM denuncias WHERE id_denuncia = ?',
            [$idDenuncia]
        )[0]['id_usuario'] ?? null;

        if ($autor !== null) {
            registrarReputacao($conn, (int) $autor, 'denuncia_rejeitada', $idDenuncia);
        }
    }

    $conn->commit();
} catch (mysqli_sql_exception $e) {
    $conn->rollback();

    error_log('[alterar_status] SQLSTATE=' . $e->getSqlState() . ' CODE=' . $e->getCode() . ' MSG=' . $e->getMessage());

    if ($e->getSqlState() === '45000') {
        $msg = $e->getMessage();
        falhar($msg === 'Denúncia inexistente' ? 404 : 409, $msg);
    }
    if ($e->getCode() === 1452) {
        falhar(400, 'Status inválido');
    }
    // Repassa a mensagem real em vez de "Erro interno", para facilitar o debug
    falhar(500, 'Falha ao alterar status: ' . $e->getMessage());
}

// Lê o estado final para devolver ao front
$novo = consulta(
    $conn,
    'SELECT sd.nome, sd.cor
     FROM denuncias d
     INNER JOIN status_denuncia sd ON sd.id_status = d.id_status
     WHERE d.id_denuncia = ?',
    [$idDenuncia]
)[0];

echo json_encode([
    'success'    => true,
    'status'     => $novo['nome'],
    'status_cor' => $novo['cor'],
]);