<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

const STATUS_ENC = ['pendente', 'enviado', 'recebido', 'concluido', 'falhou'];

exigirMetodo('POST');

$eu         = exigirPermissao($conn, 'encaminhamento.editar');
$dados      = corpoJson();
$idDenuncia = inteiroPositivo($dados['id_denuncia'] ?? null) ?? falhar(400, 'Dados incompletos');
$idOrgao    = inteiroPositivo($dados['id_orgao'] ?? null) ?? falhar(400, 'Órgão obrigatório');
$status     = (string) ($dados['status'] ?? 'pendente');
$protocolo  = textoOpcional($dados['protocolo_externo'] ?? null, 100, 'Protocolo');
$observacao = textoOpcional($dados['observacao'] ?? null, 500, 'Observação');

if (!in_array($status, STATUS_ENC, true)) {
    falhar(400, 'Status inválido');
}
if (!consulta($conn, 'SELECT 1 FROM orgaos_publicos WHERE id_orgao = ? AND ativo = 1', [$idOrgao])) {
    falhar(404, 'Órgão não encontrado ou inativo');
}

// Um encaminhamento por (denúncia, órgão): reenviar atualiza o existente
executar(
    $conn,
    "INSERT INTO denuncia_encaminhamentos
        (id_denuncia, id_orgao, id_usuario, protocolo_externo, status, observacao, enviado_em, respondido_em)
     VALUES (?, ?, ?, ?, ?, ?,
             IF(? IN ('enviado','recebido','concluido'), NOW(), NULL),
             IF(? IN ('recebido','concluido','falhou'), NOW(), NULL))
     ON DUPLICATE KEY UPDATE
        id_usuario        = VALUES(id_usuario),
        protocolo_externo = VALUES(protocolo_externo),
        status            = VALUES(status),
        observacao        = VALUES(observacao),
        enviado_em        = COALESCE(enviado_em, VALUES(enviado_em)),
        respondido_em     = VALUES(respondido_em)",
    [$idDenuncia, $idOrgao, $eu['id_usuario'], $protocolo, $status, $observacao, $status, $status]
);

echo json_encode(['success' => true]);
