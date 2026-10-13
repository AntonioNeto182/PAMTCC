<?php
// =====================================================================
// ARQUIVO: C:\xampp\htdocs\simav_api\denuncias\locais_filtros.php
// Autocomplete dos filtros geográficos da fila.
// Lê APENAS a tabela `locais` — não toca em `regioes` nem em nenhuma
// outra. Não requer mudança de schema.
// =====================================================================
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirPermissao($conn, 'denuncia.moderar');

const NIVEIS = [
    'estado' => 'estado',
    'cidade' => 'cidade',
    'bairro' => 'bairro',
    'rua'    => 'endereco',
];

$nivel = (string) ($_GET['nivel'] ?? '');
if (!isset(NIVEIS[$nivel])) {
    falhar(400, 'Nível inválido');
}

$col = NIVEIS[$nivel];

$q      = trim((string) ($_GET['q'] ?? ''));
$estado = trim((string) ($_GET['estado'] ?? ''));
$cidade = trim((string) ($_GET['cidade'] ?? ''));
$bairro = trim((string) ($_GET['bairro'] ?? ''));

$filtros = ["$col IS NOT NULL", "$col <> ''"];
$params  = [];

// Filtro hierárquico: só filtra pelo pai se ele foi informado.
// Isso permite filtrar direto por bairro sem informar estado/cidade.
if ($nivel === 'cidade' && $estado !== '') {
    $filtros[] = 'estado = ?';
    $params[]  = $estado;
}
if ($nivel === 'bairro') {
    if ($cidade !== '') {
        $filtros[] = 'cidade = ?';
        $params[]  = $cidade;
    } elseif ($estado !== '') {
        $filtros[] = 'estado = ?';
        $params[]  = $estado;
    }
}
if ($nivel === 'rua') {
    if ($bairro !== '') {
        $filtros[] = 'bairro = ?';
        $params[]  = $bairro;
    } elseif ($cidade !== '') {
        $filtros[] = 'cidade = ?';
        $params[]  = $cidade;
    } elseif ($estado !== '') {
        $filtros[] = 'estado = ?';
        $params[]  = $estado;
    }
}

if ($q !== '') {
    $filtros[] = "$col LIKE ?";
    $params[]  = '%' . addcslashes($q, '%_\\') . '%';
}

$where = 'WHERE ' . implode(' AND ', $filtros);

try {
    $itens = consulta(
        $conn,
        "SELECT DISTINCT $col AS valor FROM locais $where ORDER BY $col LIMIT 50",
        $params
    );
} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    falhar(500, 'Erro ao listar locais');
}

echo json_encode([
    'success' => true,
    'itens'   => array_column($itens, 'valor'),
]);