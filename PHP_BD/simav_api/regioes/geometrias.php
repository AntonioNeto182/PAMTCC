<?php
// =====================================================================
// ARQUIVO: C:\xampp\htdocs\simav_api\regioes\geometrias.php
// Devolve as regiões ativas com geometria em GeoJSON, para renderização
// no mapa seletor. Requer apenas login.
// =====================================================================
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirLogin($conn);

$regioes = consulta(
    $conn,
    "SELECT r.id_regiao, r.nome, r.nivel,
            ST_AsGeoJSON(r.area) AS geojson,
            ST_Y(r.centro) AS centro_lat,
            ST_X(r.centro) AS centro_lng
     FROM regioes r
     WHERE r.ativo = 1
     ORDER BY FIELD(r.nivel, 'cidade','distrito','bairro','setor'), r.nome"
);

foreach ($regioes as &$r) {
    $r['id_regiao'] = (int) $r['id_regiao'];
    $r['centro_lat'] = (float) $r['centro_lat'];
    $r['centro_lng'] = (float) $r['centro_lng'];
    // geojson vem como string — o front faz JSON.parse
}
unset($r);

echo json_encode(['success' => true, 'itens' => $regioes]);