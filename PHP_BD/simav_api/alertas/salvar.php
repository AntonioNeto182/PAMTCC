<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

const NIVEIS_ALERTA = ['atencao', 'alto', 'critico'];

exigirMetodo('POST');

$eu    = exigirPermissao($conn, 'alerta.editar');
$dados = corpoJson();
$acao  = (string) ($dados['acao'] ?? 'criar');

if ($acao === 'encerrar') {
    $idAlerta = inteiroPositivo($dados['id_alerta'] ?? null) ?? falhar(400, 'Dados incompletos');

    if (!existe($conn, 'alertas_regiao', 'id_alerta', $idAlerta)) {
        falhar(404, 'Alerta não encontrado');
    }
    executar($conn, 'UPDATE alertas_regiao SET fim_em = NOW() WHERE id_alerta = ? AND (fim_em IS NULL OR fim_em > NOW())', [$idAlerta]);
    echo json_encode(['success' => true]);
    exit;
}

$idRegiao  = inteiroPositivo($dados['id_regiao'] ?? null) ?? falhar(400, 'Região obrigatória');
$nivel     = (string) ($dados['nivel'] ?? '');
$titulo    = textoObrigatorio($dados['titulo'] ?? null, 150, 'Título');
$descricao = textoOpcional($dados['descricao'] ?? null, 500, 'Descrição');

if (!in_array($nivel, NIVEIS_ALERTA, true)) {
    falhar(400, 'Nível inválido');
}

$regiao = consulta($conn, 'SELECT nome FROM regioes WHERE id_regiao = ? AND ativo = 1', [$idRegiao])[0]
    ?? falhar(404, 'Região não encontrada');

// Liga o alerta ao último risco calculado, quando houver
$idRisco = consulta(
    $conn,
    "SELECT id_risco FROM vw_regiao_risco_atual WHERE id_regiao = ? AND metodo = 'regras_v1'",
    [$idRegiao]
)[0]['id_risco'] ?? null;

$conn->begin_transaction();

executar(
    $conn,
    'INSERT INTO alertas_regiao (id_regiao, nivel, titulo, descricao, id_risco, id_criador) VALUES (?, ?, ?, ?, ?, ?)',
    [$idRegiao, $nivel, $titulo, $descricao, $idRisco !== null ? (int) $idRisco : null, $eu['id_usuario']]
);
$idAlerta = $conn->insert_id;

// Avisa quem acompanha a região e pediu alertas (sem o próprio criador)
$avisados = executar(
    $conn,
    "INSERT INTO notificacoes (id_usuario, id_tipo_notificacao, titulo, mensagem, id_usuario_origem)
     SELECT ur.id_usuario, t.id_tipo_notificacao, ?, ?, ?
     FROM usuario_regioes ur
     INNER JOIN usuarios u ON u.id_usuario = ur.id_usuario AND u.ativo = 1
     CROSS JOIN tipos_notificacao t
     WHERE ur.id_regiao = ? AND ur.notificar_alertas = 1 AND t.nome = 'alerta_regiao' AND ur.id_usuario <> ?",
    [$titulo, mb_substr($regiao['nome'] . ': ' . ($descricao ?? $titulo), 0, 500), $eu['id_usuario'], $idRegiao, $eu['id_usuario']]
);

$conn->commit();

http_response_code(201);
echo json_encode(['success' => true, 'id_alerta' => $idAlerta, 'avisados' => $avisados]);
