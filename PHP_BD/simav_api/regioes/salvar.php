<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

const NIVEIS = ['cidade', 'distrito', 'bairro', 'setor'];

/**
 * Valida um POLYGON simples (um anel, lon lat) e devolve o WKT reconstruído só com números,
 * junto do centro do retângulo envolvente.
 *
 * @return array{0:string,1:float,2:float} [wkt, centroLat, centroLng]
 */
function poligonoValido(string $wkt): array
{
    if (!preg_match('/^\s*POLYGON\s*\(\(([^()]+)\)\)\s*$/i', $wkt, $m)) {
        falhar(400, 'Área inválida: use POLYGON((lon lat, lon lat, ...))');
    }

    $pontos = [];
    foreach (explode(',', $m[1]) as $par) {
        if (!preg_match('/^\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/', $par, $p)) {
            falhar(400, 'Área inválida: coordenada malformada');
        }
        [$lng, $lat] = [(float) $p[1], (float) $p[2]];
        if (abs($lng) > 180 || abs($lat) > 90) {
            falhar(400, 'Área inválida: coordenada fora dos limites');
        }
        $pontos[] = [$lng, $lat];
    }

    if (count($pontos) < 4 || $pontos[0] !== $pontos[count($pontos) - 1]) {
        falhar(400, 'Área inválida: o polígono precisa de 4+ pontos e fechar no ponto inicial');
    }

    $lngs = array_column($pontos, 0);
    $lats = array_column($pontos, 1);

    $texto = 'POLYGON((' . implode(', ', array_map(
        static fn(array $p): string => rtrim(rtrim(sprintf('%.7F', $p[0]), '0'), '.') . ' ' . rtrim(rtrim(sprintf('%.7F', $p[1]), '0'), '.'),
        $pontos
    )) . '))';

    return [$texto, (min($lats) + max($lats)) / 2, (min($lngs) + max($lngs)) / 2];
}

exigirMetodo('POST');

$eu    = exigirPermissao($conn, 'regiao.editar');
$dados = corpoJson();
$id    = inteiroPositivo($dados['id_regiao'] ?? null);

if (($dados['acao'] ?? '') === 'excluir') {
    $id ?? falhar(400, 'Dados incompletos');
    executar($conn, 'DELETE FROM regioes WHERE id_regiao = ?', [$id]);
    echo json_encode(['success' => true]);
    exit;
}

$nome      = textoObrigatorio($dados['nome'] ?? null, 100, 'Nome');
$descricao = textoOpcional($dados['descricao'] ?? null, 255, 'Descrição');
$nivel     = (string) ($dados['nivel'] ?? 'bairro');
$ativo     = array_key_exists('ativo', $dados) ? (int) filter_var($dados['ativo'], FILTER_VALIDATE_BOOLEAN) : 1;
$idPai     = inteiroPositivo($dados['id_regiao_pai'] ?? null);
$wkt       = trim((string) ($dados['area_wkt'] ?? ''));

if (!in_array($nivel, NIVEIS, true)) {
    falhar(400, 'Nível inválido');
}
if ($idPai !== null && $idPai === $id) {
    falhar(400, 'Uma região não pode ser pai de si mesma');
}
if ($id === null && $wkt === '') {
    falhar(400, 'Informe a área da região');
}

$centroLat = isset($dados['centro_lat']) && $dados['centro_lat'] !== '' ? filter_var($dados['centro_lat'], FILTER_VALIDATE_FLOAT) : null;
$centroLng = isset($dados['centro_lng']) && $dados['centro_lng'] !== '' ? filter_var($dados['centro_lng'], FILTER_VALIDATE_FLOAT) : null;

if ($centroLat === false || $centroLng === false
    || ($centroLat !== null && abs($centroLat) > 90) || ($centroLng !== null && abs($centroLng) > 180)) {
    falhar(400, 'Centro inválido');
}

$areaTexto = null;
if ($wkt !== '') {
    [$areaTexto, $autoLat, $autoLng] = poligonoValido($wkt);
    $centroLat ??= $autoLat;
    $centroLng ??= $autoLng;
}

if ($id === null) {
    executar(
        $conn,
        'INSERT INTO regioes (nome, descricao, nivel, id_regiao_pai, area, centro, ativo)
         VALUES (?, ?, ?, ?, ST_GeomFromText(?), ST_GeomFromText(?), ?)',
        [$nome, $descricao, $nivel, $idPai, $areaTexto, sprintf('POINT(%.7F %.7F)', $centroLng, $centroLat), $ativo]
    );
    http_response_code(201);
    echo json_encode(['success' => true, 'id_regiao' => $conn->insert_id]);
    exit;
}

$sets   = ['nome = ?', 'descricao = ?', 'nivel = ?', 'id_regiao_pai = ?', 'ativo = ?'];
$params = [$nome, $descricao, $nivel, $idPai, $ativo];

if ($areaTexto !== null) {
    $sets[]   = 'area = ST_GeomFromText(?)';
    $params[] = $areaTexto;
}
if ($centroLat !== null && $centroLng !== null) {
    $sets[]   = 'centro = ST_GeomFromText(?)';
    $params[] = sprintf('POINT(%.7F %.7F)', $centroLng, $centroLat);
}
$params[] = $id;

if (executar($conn, 'UPDATE regioes SET ' . implode(', ', $sets) . ' WHERE id_regiao = ?', $params) === 0
    && !existe($conn, 'regioes', 'id_regiao', $id)) {
    falhar(404, 'Região não encontrada');
}

echo json_encode(['success' => true, 'id_regiao' => $id]);
