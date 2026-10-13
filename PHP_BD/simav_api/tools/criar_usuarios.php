<?php
// Uso: php C:\xampp\htdocs\simav_api\tools\criar_usuarios.php
// Cria (ou atualiza a senha de) dois usuários de teste: agente e admin.

require __DIR__ . '/../config/database.php';

$usuarios = [
    [
        'nome'  => 'Agente de Campo',
        'email' => 'agente@simav.test',
        'senha' => 'agente123',
        'papel' => 2,
    ],
    [
        'nome'  => 'Administrador SIMAV',
        'email' => 'admin@simav.test',
        'senha' => 'admin123',
        'papel' => 3,
    ],
];

foreach ($usuarios as $u) {
    $hash = password_hash($u['senha'], PASSWORD_DEFAULT);

    // ON DUPLICATE KEY: se o e-mail já existe, só atualiza nome, senha e papel.
    $stmt = $conn->prepare(
        'INSERT INTO usuarios (nome, email, senha_hash, id_papel, email_verificado_em, ativo)
         VALUES (?, ?, ?, ?, NOW(), 1)
         ON DUPLICATE KEY UPDATE
            nome = VALUES(nome),
            senha_hash = VALUES(senha_hash),
            id_papel = VALUES(id_papel),
            ativo = 1'
    );
    $stmt->bind_param('sssi', $u['nome'], $u['email'], $hash, $u['papel']);
    $stmt->execute();

    echo "OK: {$u['email']} (papel {$u['papel']}) — senha: {$u['senha']}\n";
}

echo "\nPronto. Logue no app com qualquer um dos dois.\n";