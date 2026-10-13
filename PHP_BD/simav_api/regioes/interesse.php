<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirMetodo('POST');

$eu       = exigirLogin($conn);
$dados    = corpoJson();
$idRegiao = inteiroPositivo($dados['id_regiao'] ?? null) ?? falhar(400, 'Dados incompletos');
$acao     = (string) ($dados['acao'] ?? '');

if (!consulta($conn, 'SELECT 1 FROM regioes WHERE id_regiao = ? AND ativo = 1', [$idRegiao])) {
    falhar(404, 'Região não encontrada');
}

switch ($acao) {
    case 'seguir':
        executar(
            $conn,
            'INSERT IGNORE INTO usuario_regioes (id_usuario, id_regiao) VALUES (?, ?)',
            [$eu['id_usuario'], $idRegiao]
        );
        break;

    case 'deixar':
        executar($conn, 'DELETE FROM usuario_regioes WHERE id_usuario = ? AND id_regiao = ?', [$eu['id_usuario'], $idRegiao]);
        break;

    case 'notificar':
        $liga = (int) filter_var($dados['notificar_alertas'] ?? true, FILTER_VALIDATE_BOOLEAN);
        executar(
            $conn,
            'UPDATE usuario_regioes SET notificar_alertas = ? WHERE id_usuario = ? AND id_regiao = ?',
            [$liga, $eu['id_usuario'], $idRegiao]
        );
        break;

    default:
        falhar(400, 'Ação inválida');
}

echo json_encode(['success' => true]);
