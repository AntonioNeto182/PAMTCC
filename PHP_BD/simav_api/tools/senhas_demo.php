<?php
require __DIR__ . '/../config/database.php';

// [id_usuario, senha em texto puro]
$alvos = [
    [1,  'ana123'],       // cidadã comum
    [25, 'caio123'],      // agente
    [29, 'gustavo123'],   // admin
];

foreach ($alvos as [$id, $senha]) {
    $hash = password_hash($senha, PASSWORD_DEFAULT);
    $stmt = $conn->prepare('UPDATE usuarios SET senha_hash = ? WHERE id_usuario = ?');
    $stmt->bind_param('si', $hash, $id);
    $stmt->execute();
    echo "OK: id=$id — senha: $senha\n";
}

echo "\nPronto. Logue no app com esses dados.\n";