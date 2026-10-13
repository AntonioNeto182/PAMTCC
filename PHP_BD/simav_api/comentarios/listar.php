<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

$eu         = exigirPermissao($conn, 'denuncia.visualizar');
$idDenuncia = inteiroPositivo($_GET['id_denuncia'] ?? null) ?? falhar(400, 'ID inválido');
$moderador  = temPermissao($eu, 'denuncia.moderar');

// Comentário removido só aparece (sem texto) se ainda tiver respostas visíveis
$linhas = consulta(
    $conn,
    'SELECT c.id_comentario, c.id_comentario_pai, c.id_usuario, u.nome AS autor, u.foto_perfil,
            IF(c.removido_em IS NULL, c.texto, NULL) AS texto,
            c.removido_em IS NOT NULL AS removido, c.editado_em, c.created_at
     FROM denuncia_comentarios c
     LEFT JOIN usuarios u ON u.id_usuario = c.id_usuario
     WHERE c.id_denuncia = ?
       AND (c.removido_em IS NULL
            OR EXISTS (SELECT 1 FROM denuncia_comentarios r
                        WHERE r.id_comentario_pai = c.id_comentario AND r.removido_em IS NULL))
     ORDER BY c.id_comentario
     LIMIT 300',
    [$idDenuncia]
);

foreach ($linhas as &$l) {
    $l['id_comentario']     = (int) $l['id_comentario'];
    $l['id_comentario_pai'] = $l['id_comentario_pai'] !== null ? (int) $l['id_comentario_pai'] : null;
    $l['id_usuario']        = $l['id_usuario'] !== null ? (int) $l['id_usuario'] : null;
    $l['autor']             = $l['autor'] ?? 'Anônimo';
    $l['removido']          = (bool) $l['removido'];
    $l['meu']               = $l['id_usuario'] === $eu['id_usuario'];
    $l['pode_remover']      = !$l['removido'] && ($l['meu'] || $moderador);
}
unset($l);

echo json_encode(['success' => true, 'itens' => $linhas]);
