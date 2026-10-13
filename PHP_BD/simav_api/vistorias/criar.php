<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

const RESULTADO_CONFIRMADO = 1;

exigirMetodo('POST');

$eu          = exigirPermissao($conn, 'vistoria.criar');
$dados       = corpoJson();
$idDenuncia  = inteiroPositivo($dados['id_denuncia'] ?? null);
$idResultado = inteiroPositivo($dados['id_resultado'] ?? null);
$idArbo      = inteiroPositivo($dados['id_arbovirose'] ?? null);
$observacao  = textoOpcional($dados['observacao'] ?? null, 500, 'Observação');

if (!$idDenuncia || !$idResultado) {
    falhar(400, 'Dados inválidos');
}

$focoCriado = false;

try {
    $conn->begin_transaction();

    // O trigger valida o papel do agente e move a denúncia para "vistoriada"
    executar(
        $conn,
        'INSERT INTO vistorias (id_denuncia, id_usuario, id_resultado, observacao, data_realizacao)
         VALUES (?, ?, ?, ?, NOW())',
        [$idDenuncia, $eu['id_usuario'], $idResultado, $observacao]
    );

    $idVistoria = (int) consulta(
        $conn, 'SELECT id_vistoria FROM vistorias WHERE id_denuncia = ?', [$idDenuncia]
    )[0]['id_vistoria'];

    // Vistoria confirmada gera o foco (única origem permitida pelo banco)
    if ($idResultado === RESULTADO_CONFIRMADO) {
        executar(
            $conn,
            'INSERT INTO focos (id_vistoria, id_arbovirose, id_status, observacao, data_identificacao)
             VALUES (?, ?, 1, ?, NOW())',
            [$idVistoria, $idArbo, $observacao]
        );
        $focoCriado = true;

        $autor = consulta($conn, 'SELECT id_usuario FROM denuncias WHERE id_denuncia = ?', [$idDenuncia])[0]['id_usuario'] ?? null;
        if ($autor !== null) {
            registrarReputacao($conn, (int) $autor, 'denuncia_confirmada', $idDenuncia);
        }
    }

    executar($conn, "CALL sp_notificar_denuncia(?, 'vistoria_realizada', 'Vistoria realizada', ?, ?)", [
        $idDenuncia, "A denúncia #$idDenuncia foi vistoriada.", $eu['id_usuario'],
    ]);

    $conn->commit();
} catch (mysqli_sql_exception $e) {
    $conn->rollback();

    if ($e->getCode() === 1062) {
        falhar(409, 'Esta denúncia já foi vistoriada');
    }
    if ($e->getCode() === 1452) {
        falhar(404, 'Denúncia, resultado ou arbovirose inexistente');
    }
    if ($e->getSqlState() === '45000') {
        falhar(403, $e->getMessage());
    }
    throw $e;
}

echo json_encode(['success' => true, 'id_vistoria' => $idVistoria, 'foco_criado' => $focoCriado]);
