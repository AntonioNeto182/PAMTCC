<?php
include('../config/cors.php');
include('../config/database.php');

try {
    $resultado = $conn->query(
        'SELECT id_tipo, nome, descricao FROM tipos_denuncia WHERE ativo = 1 ORDER BY nome'
    );
    $dados = $resultado->fetch_all(MYSQLI_ASSOC);
} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro ao listar tipos']);
    exit;
}

foreach ($dados as &$linha) {
    $linha['id_tipo'] = (int) $linha['id_tipo'];
}
unset($linha);

echo json_encode($dados);