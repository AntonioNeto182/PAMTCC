<?php
// =====================================================================
// ARQUIVO: C:\xampp\htdocs\simav_api\usuarios\foto.php
// =====================================================================
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirMetodo('POST');

$eu = exigirLogin($conn);

$idUsuario = inteiroPositivo($_POST['id_usuario'] ?? null) ?? falhar(400, 'Usuário obrigatório');

$souEu = $idUsuario === $eu['id_usuario'];
if (!$souEu && !temPermissao($eu, 'usuario.editar')) {
    falhar(403, 'Você não tem permissão para esta ação');
}

$alvo = consulta(
    $conn,
    'SELECT foto_perfil FROM usuarios WHERE id_usuario = ? AND ativo = 1',
    [$idUsuario]
)[0] ?? falhar(404, 'Usuário não encontrado');

$novaFoto = salvarImagem($_FILES['foto'] ?? null, 'perfis');

if ($novaFoto === null) {
    falhar(400, 'Nenhuma imagem enviada');
}

try {
    executar(
        $conn,
        'UPDATE usuarios SET foto_perfil = ? WHERE id_usuario = ?',
        [$novaFoto, $idUsuario]
    );
} catch (Throwable $e) {
    removerImagem($novaFoto); // não deixa arquivo órfão em uploads/perfis/
    throw $e;
}

// Só agora remove a antiga — se algo falhou antes, ela ainda é a válida.
removerImagem($alvo['foto_perfil']);

echo json_encode(['success' => true, 'foto_perfil' => $novaFoto]);