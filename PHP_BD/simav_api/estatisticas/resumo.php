<?php
include('../config/cors.php');
include('../config/database.php');

function responder(int $status, array $corpo): never
{
    http_response_code($status);
    echo json_encode($corpo);
    exit;
}

function consultar(mysqli $conn, string $sql, int ...$params): array
{
    $stmt = $conn->prepare($sql);
    if ($params) {
        $stmt->bind_param(str_repeat('i', count($params)), ...$params);
    }
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

const PERIODOS = ['semana' => 7, 'mes' => 30, 'trimestre' => 90];

$periodo = (string) ($_GET['periodo'] ?? 'semana');

if (!isset(PERIODOS[$periodo])) {
    responder(400, ['success' => false, 'message' => 'Período inválido']);
}

$dias = PERIODOS[$periodo];

try {
    $atual = (int) consultar(
        $conn,
        'SELECT COUNT(*) AS total FROM denuncias WHERE created_at >= NOW() - INTERVAL ? DAY',
        $dias
    )[0]['total'];

    $anterior = (int) consultar(
        $conn,
        'SELECT COUNT(*) AS total FROM denuncias
         WHERE created_at >= NOW() - INTERVAL ? DAY AND created_at < NOW() - INTERVAL ? DAY',
        $dias * 2,
        $dias
    )[0]['total'];

    $focos = (int) consultar(
        $conn,
        'SELECT COUNT(*) AS total FROM focos WHERE data_identificacao >= NOW() - INTERVAL ? DAY',
        $dias
    )[0]['total'];

    $casos = (int) consultar(
        $conn,
        'SELECT COUNT(*) AS total FROM casos_epidemiologicos
         WHERE data_notificacao >= CURDATE() - INTERVAL ? DAY',
        $dias
    )[0]['total'];

    $tipos = consultar(
        $conn,
        'SELECT t.nome, COUNT(*) AS total
         FROM denuncias d
         INNER JOIN tipos_denuncia t ON t.id_tipo = d.id_tipo
         WHERE d.created_at >= NOW() - INTERVAL ? DAY
         GROUP BY t.id_tipo, t.nome
         ORDER BY total DESC, t.nome',
        $dias
    );

    $bairros = consultar(
        $conn,
        'SELECT l.bairro AS nome, COUNT(*) AS total
         FROM casos_epidemiologicos c
         INNER JOIN locais l ON l.id_local = c.id_local
         WHERE c.data_notificacao >= CURDATE() - INTERVAL ? DAY
         GROUP BY l.bairro
         ORDER BY total DESC, l.bairro
         LIMIT 4',
        $dias
    );
} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro ao carregar estatísticas']);
}

$comoInteiro = static fn(array $linha): array => [
    'nome'  => $linha['nome'],
    'total' => (int) $linha['total'],
];

echo json_encode([
    'success' => true,
    'periodo' => $periodo,
    'totais'  => ['denuncias' => $atual, 'focos' => $focos, 'casos' => $casos],
    // null quando o período anterior não tem denúncias (não há base de comparação)
    'variacao_denuncias' => $anterior > 0 ? (int) round(($atual - $anterior) / $anterior * 100) : null,
    'tipos'   => array_map($comoInteiro, $tipos),
    'bairros' => array_map($comoInteiro, $bairros),
]);