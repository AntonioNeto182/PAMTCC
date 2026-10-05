<?php
include('../config/cors.php');
include('../config/database.php');

function responder(int $status, array $corpo): never
{
    http_response_code($status);
    echo json_encode($corpo);
    exit;
}

/**
 * Convenção do banco existente (seed): POINT(X Y) = POINT(latitude longitude).
 * Leitura em listar_mapa.php/detalhes.php: ST_X = latitude, ST_Y = longitude.
 */
function pontoWkt(float $latitude, float $longitude): string
{
    return sprintf('POINT(%F %F)', $latitude, $longitude);
}

$dados = json_decode(file_get_contents('php://input'), true);

if (!is_array($dados)
    || trim((string) ($dados['endereco'] ?? '')) === ''
    || trim((string) ($dados['bairro'] ?? '')) === ''
    || !isset($dados['latitude'], $dados['longitude'], $dados['id_tipo'])
    || !is_numeric($dados['latitude']) || !is_numeric($dados['longitude'])
) {
    responder(400, ['success' => false, 'message' => 'Dados incompletos']);
}

$descricao   = trim((string) ($dados['descricao'] ?? ''));
$endereco    = trim((string) $dados['endereco']);
$numero      = $dados['numero']      ?? null;
$complemento = $dados['complemento'] ?? null;
$bairro      = trim((string) $dados['bairro']);
$cidade      = trim((string) ($dados['cidade'] ?? 'Registro'));
$estado      = strtoupper(substr(trim((string) ($dados['estado'] ?? 'SP')), 0, 2));
$cep         = $dados['cep'] ?? null;

$latitude   = (float) $dados['latitude'];
$longitude  = (float) $dados['longitude'];
$idTipo     = (int) $dados['id_tipo'];
$idUsuario  = isset($dados['id_usuario']) ? (int) $dados['id_usuario'] : null;
$idStatus   = 1; // pendente
$prioridade = 3;

if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180
    || mb_strlen($descricao) > 500 || mb_strlen($endereco) > 255 || mb_strlen($bairro) > 100) {
    responder(400, ['success' => false, 'message' => 'Dados inválidos']);
}

$pontoWkt = pontoWkt($latitude, $longitude);

try {
    $conn->begin_transaction();

    $stmtLocal = $conn->prepare(
        'INSERT INTO locais (endereco, numero, complemento, bairro, cidade, estado, cep, localizacao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ST_GeomFromText(?))'
    );
    $stmtLocal->bind_param(
        'ssssssss',
        $endereco, $numero, $complemento, $bairro, $cidade, $estado, $cep, $pontoWkt
    );
    $stmtLocal->execute();
    $idLocal = $conn->insert_id;

    $stmt = $conn->prepare(
        'INSERT INTO denuncias (descricao, id_status, id_usuario, id_local, id_tipo, prioridade, data_ocorrencia)
         VALUES (?, ?, ?, ?, ?, ?, NOW())'
    );
    $stmt->bind_param('siiiii', $descricao, $idStatus, $idUsuario, $idLocal, $idTipo, $prioridade);
    $stmt->execute();
    $idDenuncia = $conn->insert_id;

    // O trigger trg_denuncia_status_after_historico sincroniza denuncias.id_status
    $stmtHist = $conn->prepare(
        "INSERT INTO historico_status (id_denuncia, id_usuario, id_status_anterior, id_status_novo, observacao)
         VALUES (?, ?, NULL, ?, 'Denúncia criada')"
    );
    $stmtHist->bind_param('iii', $idDenuncia, $idUsuario, $idStatus);
    $stmtHist->execute();

    $conn->commit();

    echo json_encode([
        'success'     => true,
        'message'     => 'Denúncia criada',
        'id_denuncia' => $idDenuncia,
        'id_local'    => $idLocal,
    ]);
} catch (mysqli_sql_exception $e) {
    $conn->rollback();
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao criar denúncia']);
}