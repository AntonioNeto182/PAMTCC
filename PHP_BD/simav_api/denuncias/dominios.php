<?php
// =====================================================================
// ARQUIVO: C:\xampp\htdocs\simav_api\denuncias\dominios.php
// Domínios consumidos pelas telas que precisam de listas fixas
// (status de denúncia, status de foco, resultados de vistoria, tipos
// de denúncia e arboviroses). Somente leitura — para editar, use
// /admin/dominios.php (exige configuracao.editar).
// =====================================================================
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

// Basta estar logado — cidadão também abre DetalhesDenuncia, e o bloco
// Gestão só é renderizado se ele tiver as permissões específicas.
exigirLogin($conn);

$status = consulta(
    $conn,
    'SELECT id_status, nome, descricao, ordem, cor
     FROM status_denuncia
     ORDER BY ordem'
);

$statusFoco = consulta(
    $conn,
    'SELECT id_status, nome, descricao
     FROM status_foco
     ORDER BY id_status'
);

$resultados = consulta(
    $conn,
    'SELECT id_resultado, nome, descricao
     FROM resultado_vistoria
     ORDER BY id_resultado'
);

$tipos = consulta(
    $conn,
    'SELECT id_tipo, nome, descricao
     FROM tipos_denuncia
     WHERE ativo = 1
     ORDER BY nome'
);

$arboviroses = consulta(
    $conn,
    'SELECT id_arbovirose, nome, descricao
     FROM arboviroses
     WHERE ativo = 1
     ORDER BY nome'
);

// Cast dos IDs para int — o front usa em comparação com ===
foreach ($status as &$s)      { $s['id_status']     = (int) $s['id_status'];     $s['ordem'] = (int) $s['ordem']; }
foreach ($statusFoco as &$s)  { $s['id_status']     = (int) $s['id_status']; }
foreach ($resultados as &$r)  { $r['id_resultado']  = (int) $r['id_resultado']; }
foreach ($tipos as &$t)       { $t['id_tipo']       = (int) $t['id_tipo']; }
foreach ($arboviroses as &$a) { $a['id_arbovirose'] = (int) $a['id_arbovirose']; }
unset($s, $r, $t, $a);

echo json_encode([
    'success'     => true,
    'status'      => $status,
    'status_foco' => $statusFoco,
    'resultados'  => $resultados,
    'tipos'       => $tipos,
    'arboviroses' => $arboviroses,
]);