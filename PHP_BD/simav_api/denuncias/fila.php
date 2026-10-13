<?php
// =====================================================================
// ARQUIVO: C:\xampp\htdocs\simav_api\denuncias\fila.php
// Fila de moderação. Filtros: status, tipo, estado, cidade, bairro, rua.
// =====================================================================
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirPermissao($conn, 'denuncia.moderar');

const POR_PAGINA = 20;
const ORDENS = [
    'prioridade'    => 'd.prioridade ASC, d.created_at ASC',
    'antigas'       => 'd.created_at ASC',
    'recentes'      => 'd.created_at DESC',
    'corroboracoes' => 'd.votos DESC, d.created_at DESC',
];

[$pagina, $limite, $deslocamento] = paginacao(POR_PAGINA);

$idStatus   = inteiroPositivo($_GET['id_status'] ?? null);
$idTipo     = inteiroPositivo($_GET['id_tipo'] ?? null);
$prioridade = inteiroPositivo($_GET['prioridade'] ?? null);
$ordem      = (string) ($_GET['ordem'] ?? 'prioridade');
$ordemSql   = ORDENS[$ordem] ?? ORDENS['prioridade'];

$estado = trim((string) ($_GET['estado'] ?? ''));
$cidade = trim((string) ($_GET['cidade'] ?? ''));
$bairro = trim((string) ($_GET['bairro'] ?? ''));
$rua    = trim((string) ($_GET['rua'] ?? ''));

if ($prioridade !== null && ($prioridade < 1 || $prioridade > 5)) {
    falhar(400, 'Prioridade inválida');
}

$filtros = [];
$params  = [];

// Sem filtro de status, mostra só a fila ativa (pendente + em análise)
if ($idStatus === null) {
    $filtros[] = 'd.id_status IN (1, 2)';
} else {
    $filtros[] = 'd.id_status = ?';
    $params[]  = $idStatus;
}
if ($idTipo !== null) {
    $filtros[] = 'd.id_tipo = ?';
    $params[]  = $idTipo;
}
if ($prioridade !== null) {
    $filtros[] = 'd.prioridade = ?';
    $params[]  = $prioridade;
}

// Filtros geográficos — independentes, cada um é opcional
if ($estado !== '') { $filtros[] = 'l.estado = ?';   $params[] = $estado; }
if ($cidade !== '') { $filtros[] = 'l.cidade = ?';   $params[] = $cidade; }
if ($bairro !== '') { $filtros[] = 'l.bairro = ?';   $params[] = $bairro; }
if ($rua !== '')    {
    $filtros[] = 'l.endereco LIKE ?';
    $params[]  = addcslashes($rua, '%_\\') . '%';
}

$where = 'WHERE ' . implode(' AND ', $filtros);

$linhas = consulta(
    $conn,
    "SELECT d.id_denuncia, d.descricao, d.tipo_denuncia_nome AS tipo, d.status, d.status_cor,
            d.id_status, d.prioridade, d.score_prioridade, d.votos,
            d.endereco, d.bairro, d.cidade, d.id_regiao, d.latitude, d.longitude,
            d.created_at, d.nome_usuario AS autor, d.id_denuncia_principal,
            l.estado,
            (SELECT i.caminho FROM imagens i
              WHERE i.id_denuncia = d.id_denuncia
              ORDER BY i.ordem, i.id_imagem LIMIT 1) AS imagem
     FROM vw_denuncias_detalhe d
     INNER JOIN locais l ON l.id_local = d.id_local
     $where
     ORDER BY $ordemSql
     LIMIT ? OFFSET ?",
    [...$params, $limite, $deslocamento]
);

[$itens, $temMais] = cortarPagina($linhas, POR_PAGINA);

foreach ($itens as &$i) {
    $i['id_denuncia']           = (int) $i['id_denuncia'];
    $i['id_status']             = (int) $i['id_status'];
    $i['id_regiao']             = $i['id_regiao'] !== null ? (int) $i['id_regiao'] : null;
    $i['prioridade']            = (int) $i['prioridade'];
    $i['votos']                 = (int) $i['votos'];
    $i['latitude']              = (float) $i['latitude'];
    $i['longitude']             = (float) $i['longitude'];
    $i['score_prioridade']      = $i['score_prioridade'] !== null ? (float) $i['score_prioridade'] : null;
    $i['id_denuncia_principal'] = $i['id_denuncia_principal'] !== null ? (int) $i['id_denuncia_principal'] : null;
}
unset($i);

// Domínios para os filtros (status, tipos)
$status = consulta($conn, 'SELECT id_status, nome, cor FROM status_denuncia ORDER BY ordem');
$tipos  = consulta($conn, 'SELECT id_tipo, nome FROM tipos_denuncia WHERE ativo = 1 ORDER BY nome');

$contagens = consulta(
    $conn,
    'SELECT sd.id_status, sd.nome, sd.cor, COUNT(d.id_denuncia) AS total
     FROM status_denuncia sd
     LEFT JOIN denuncias d ON d.id_status = sd.id_status
     GROUP BY sd.id_status, sd.nome, sd.cor, sd.ordem
     ORDER BY sd.ordem'
);

foreach ($status as &$s)    { $s['id_status'] = (int) $s['id_status']; }
foreach ($tipos as &$t)     { $t['id_tipo']   = (int) $t['id_tipo']; }
foreach ($contagens as &$c) { $c['id_status'] = (int) $c['id_status']; $c['total'] = (int) $c['total']; }
unset($s, $t, $c);

echo json_encode([
    'success'   => true,
    'itens'     => $itens,
    'tem_mais'  => $temMais,
    'pagina'    => $pagina,
    'contagens' => $contagens,
    'dominios'  => [
        'status' => $status,
        'tipos'  => $tipos,
    ],
]);