<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

$eu = exigirPermissao($conn, 'denuncia.visualizar');

[$pagina, $limite, $deslocamento] = paginacao(20);

$linhas = consulta(
    $conn,
    "SELECT d.id_denuncia, d.descricao, d.tipo_denuncia_nome AS tipo, d.status, d.status_cor,
            d.endereco, d.bairro, d.latitude, d.longitude, d.corroboracoes AS votos,
            f.notificar, f.created_at AS favoritada_em,
            (SELECT i.caminho FROM imagens i WHERE i.id_denuncia = d.id_denuncia ORDER BY i.ordem, i.id_imagem LIMIT 1) AS imagem
     FROM denuncia_favoritos f
     INNER JOIN vw_denuncias_detalhe d ON d.id_denuncia = f.id_denuncia
     WHERE f.id_usuario = ?
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?",
    [$eu['id_usuario'], $limite, $deslocamento]
);

[$itens, $temMais] = cortarPagina($linhas, 20);

foreach ($itens as &$i) {
    $i['id_denuncia'] = (int) $i['id_denuncia'];
    $i['latitude']    = (float) $i['latitude'];
    $i['longitude']   = (float) $i['longitude'];
    $i['votos']       = (int) $i['votos'];
    $i['notificar']   = (bool) $i['notificar'];
}
unset($i);

echo json_encode(['success' => true, 'itens' => $itens, 'tem_mais' => $temMais]);
