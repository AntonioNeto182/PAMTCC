<?php
require __DIR__ . '/../config/database.php';

// Lista de usuários a serem criados
$usuarios = [
    [
        'nome'  => 'Agente de Campo',
        'email' => 'agente@simav.test',
        'senha' => 'agente123',
        'papel' => 2, // 2 = Agente
    ],
    [
        'nome'  => 'Administrador SIMAV',
        'email' => 'admin@simav.test',
        'senha' => 'admin123',
        'papel' => 3, // 3 = Admin
    ]
];

foreach ($usuarios as $u) {
    // Gera o hash bcrypt para a senha
    $hash = password_hash($u['senha'], PASSWORD_DEFAULT);
    
    // ON DUPLICATE KEY UPDATE evita erro caso o e-mail já exista
    $stmt = $conn->prepare("
        INSERT INTO usuarios (nome, email, senha_hash, id_papel, email_verificado_em, ativo) 
        VALUES (?, ?, ?, ?, NOW(), 1)
        ON DUPLICATE KEY UPDATE 
            senha_hash = VALUES(senha_hash),
            id_papel = VALUES(id_papel),
            ativo = 1
    ");
    
    $stmt->bind_param('sssi', $u['nome'], $u['email'], $hash, $u['papel']);
    
    if ($stmt->execute()) {
        echo "✅ Criado/Atualizado: {$u['email']} | Senha: {$u['senha']} | Papel ID: {$u['papel']}\n";
    } else {
        echo "❌ Erro em {$u['email']}: " . $stmt->error . "\n";
    }
}