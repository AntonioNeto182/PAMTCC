<?php
include('../config/cors.php');
include('../config/database.php');

function responder(int $status, array $corpo): never
{
    http_response_code($status);
    echo json_encode($corpo);
    exit;
}

$dados = json_decode(file_get_contents('php://input'), true);
$dados = is_array($dados) ? $dados : [];

$idLocal   = filter_var($dados['id_local'] ?? null, FILTER_VALIDATE_INT);
$idUsuario = filter_var($dados['id_usuario'] ?? null, FILTER_VALIDATE_INT);

if (!$idLocal || !$idUsuario) {
    responder(400, ['success' => false, 'message' => 'Dados incompletos']);
}

$idStatus = 1; // pendente

try {
    $conn->begin_transaction();

    $stmtUsr = $conn->prepare('SELECT 1 FROM usuarios WHERE id_usuario = ? AND ativo = 1');
    $stmtUsr->bind_param('i', $idUsuario);
    $stmtUsr->execute();
    if ($stmtUsr->get_result()->num_rows === 0) {
        $conn->rollback();
        responder(404, ['success' => false, 'message' => 'Usuário não encontrado']);
    }

    // FOR UPDATE serializa corroborações simultâneas e evita duplicidade
    $stmt = $conn->prepare(
        "SELECT d.id_denuncia, d.id_tipo, d.prioridade, d.id_usuario
         FROM denuncias d
         INNER JOIN status_denuncia sd ON sd.id_status = d.id_status
         WHERE d.id_local = ? AND sd.nome NOT IN ('resolvida', 'rejeitada')
         ORDER BY d.id_denuncia ASC
         FOR UPDATE"
    );
    $stmt->bind_param('i', $idLocal);
    $stmt->execute();
    $abertas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    if (!$abertas) {
        $conn->rollback();
        responder(409, ['success' => false, 'message' => 'Esta denúncia já foi encerrada']);
    }

    foreach ($abertas as $linha) {
        if ((int) $linha['id_usuario'] === $idUsuario) {
            $conn->rollback();
            responder(409, ['success' => false, 'message' => 'Você já registrou ou corroborou esta denúncia']);
        }
    }

    $base       = $abertas[0];
    $idBase     = (int) $base['id_denuncia'];
    $idTipo     = (int) $base['id_tipo'];
    $prioridade = (int) $base['prioridade'];
    $descricao  = "Corroboração da denúncia #$idBase";

    $stmtIns = $conn->prepare(
        'INSERT INTO denuncias (descricao, id_status, id_usuario, id_local, id_tipo, prioridade, data_ocorrencia)
         VALUES (?, ?, ?, ?, ?, ?, NOW())'
    );
    $stmtIns->bind_param('siiiii', $descricao, $idStatus, $idUsuario, $idLocal, $idTipo, $prioridade);
    $stmtIns->execute();
    $idNova = $conn->insert_id;

    $stmtHist = $conn->prepare(
        "INSERT INTO historico_status (id_denuncia, id_usuario, id_status_anterior, id_status_novo, observacao)
         VALUES (?, ?, NULL, ?, 'Corroboração registrada')"
    );
    $stmtHist->bind_param('iii', $idNova, $idUsuario, $idStatus);
    $stmtHist->execute();

    $conn->commit();

    echo json_encode([
        'success'       => true,
        'message'       => 'Corroboração registrada',
        'id_denuncia'   => $idNova,
        'corroboracoes' => count($abertas), // as já existentes (a base conta como a original)
    ]);
} catch (mysqli_sql_exception $e) {
    $conn->rollback();
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao registrar corroboração']);
}