<?php
// =====================================================================
// ARQUIVO: C:\xampp\htdocs\simav_api\denuncias\criar.php
// =====================================================================
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

const ORIGENS = ['gps', 'manual', 'endereco', 'desconhecida'];

exigirMetodo('POST');

// Não usamos exigirLogin: a denúncia pode ser anônima (usuário não logado).
// Se houver token válido, o id do autor vem dele — nunca do corpo da requisição.
$eu        = usuarioAutenticado($conn);
$idUsuario = $eu['id_usuario'] ?? null;

$dados = corpoJson();

// Log de diagnóstico: mostra o payload exato que chegou.
// Comente quando estiver estável.
error_log('[criar.php] payload: ' . json_encode($dados));

$endereco  = textoObrigatorio($dados['endereco'] ?? null, 255, 'Endereço');
$bairro    = textoObrigatorio($dados['bairro'] ?? null, 100, 'Bairro');
$descricao = textoOpcional($dados['descricao'] ?? null, 500, 'Descrição') ?? '';

$idTipo = inteiroPositivo($dados['id_tipo'] ?? null) ?? falhar(400, 'Tipo de denúncia obrigatório');

$latitude  = filter_var($dados['latitude'] ?? null, FILTER_VALIDATE_FLOAT);
$longitude = filter_var($dados['longitude'] ?? null, FILTER_VALIDATE_FLOAT);

if ($latitude === false || $longitude === false
    || abs($latitude) > 90 || abs($longitude) > 180) {
    falhar(400, 'Coordenadas inválidas');
}

$numero      = textoOpcional($dados['numero'] ?? null, 20, 'Número');
$complemento = textoOpcional($dados['complemento'] ?? null, 100, 'Complemento');
$cidade      = textoOpcional($dados['cidade'] ?? null, 100, 'Cidade') ?? 'Registro';
$estado      = strtoupper(substr(trim((string) ($dados['estado'] ?? 'SP')), 0, 2));
$cep         = textoOpcional($dados['cep'] ?? null, 10, 'CEP');

$origem = in_array($dados['origem_localizacao'] ?? null, ORIGENS, true)
    ? $dados['origem_localizacao']
    : 'desconhecida';

$precisao = isset($dados['precisao_metros']) && is_numeric($dados['precisao_metros'])
    ? max(0, min(65535, (int) round((float) $dados['precisao_metros'])))
    : null;

if (!consulta($conn, 'SELECT 1 FROM tipos_denuncia WHERE id_tipo = ? AND ativo = 1', [$idTipo])) {
    falhar(404, 'Tipo de denúncia não encontrado');
}

// POINT(X Y) = POINT(longitude latitude)
$pontoWkt = sprintf('POINT(%F %F)', $longitude, $latitude);

try {
    $idRegiao = consulta(
        $conn,
        "SELECT id_regiao FROM regioes
         WHERE ativo = 1 AND ST_Contains(area, ST_GeomFromText(?))
         ORDER BY FIELD(nivel, 'setor', 'bairro', 'distrito', 'cidade')
         LIMIT 1",
        [$pontoWkt]
    )[0]['id_regiao'] ?? null;

    $conn->begin_transaction();

    executar(
        $conn,
        'INSERT INTO locais
            (endereco, numero, complemento, bairro, cidade, estado, cep,
             localizacao, origem_localizacao, precisao_metros, id_regiao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ST_GeomFromText(?), ?, ?, ?)',
        [$endereco, $numero, $complemento, $bairro, $cidade, $estado, $cep,
         $pontoWkt, $origem, $precisao, $idRegiao]
    );
    $idLocal = $conn->insert_id;

    executar(
        $conn,
        'INSERT INTO denuncias
            (descricao, id_status, id_usuario, id_local, id_tipo, prioridade, data_ocorrencia)
         VALUES (?, 1, ?, ?, ?, 3, NOW())',
        [$descricao, $idUsuario, $idLocal, $idTipo]
    );
    $idDenuncia = $conn->insert_id;

    $conn->commit();
} catch (Throwable $e) {
    $conn->rollback();
    throw $e;
}

http_response_code(201);
echo json_encode([
    'success'     => true,
    'message'     => 'Denúncia criada',
    'id_denuncia' => $idDenuncia,
    'id_local'    => $idLocal,
]);