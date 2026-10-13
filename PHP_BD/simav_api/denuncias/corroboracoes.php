<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

$eu         = exigirPermissao($conn, 'denuncia.visualizar');
$idDenuncia = inteiroPositivo($_GET['id_denuncia'] ?? null) ?? falhar(400, 'ID inválido');
$moderador  = temPermissao($eu, 'denuncia.moderar');

[$pagina, $limite, $deslocamento] = paginacao(20);

// Só contribuições com conteúdo; o "Up" simples entra apenas na contagem
$linhas = consulta(
    $conn,
    'SELECT c.id_corroboracao, c.id_usuario, u.nome AS autor, u.foto_perfil,
            c.descricao, c.imagem, c.oculta, c.validada_em, v.nome AS validador, c.created_at
     FROM corroboracoes c
     LEFT JOIN usuarios u ON u.id_usuario = c.id_usuario
     LEFT JOIN usuarios v ON v.id_usuario = c.id_validador
     WHERE c.id_denuncia = ?
       AND (c.descricao IS NOT NULL OR c.imagem IS NOT NULL)
       AND (c.oculta = 0 OR ? = 1 OR c.id_usuario = ?)
     ORDER BY c.id_corroboracao DESC
     LIMIT ? OFFSET ?',
    [$idDenuncia, $moderador ? 1 : 0, $eu['id_usuario'], $limite, $deslocamento]
);

[$itens, $temMais] = cortarPagina($linhas, 20);

foreach ($itens as &$i) {
    $i['id_corroboracao'] = (int) $i['id_corroboracao'];
    $i['id_usuario']      = (int) $i['id_usuario'];
    $i['oculta']          = (bool) $i['oculta'];
    $i['validada']        = $i['validada_em'] !== null;
    $i['minha']           = $i['id_usuario'] === $eu['id_usuario'];
    $i['autor']           = $i['autor'] ?? 'Anônimo';
}
unset($i);

echo json_encode(['success' => true, 'itens' => $itens, 'tem_mais' => $temMais, 'pagina' => $pagina]);
