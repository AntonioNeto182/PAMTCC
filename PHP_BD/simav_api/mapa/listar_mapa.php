<?php
include('../config/cors.php');
include('../config/database.php');

$sql = "
SELECT
d.id_denuncia,
d.descricao,
d.status,
l.latitude,
l.longitude,
t.nome AS tipo,
(SELECT caminho FROM imagens WHERE id_denuncia = d.id_denuncia ORDER BY id_imagem ASC LIMIT 1) AS imagem
FROM denuncias d
INNER JOIN locais l ON d.id_local = l.id_local
INNER JOIN tipos_denuncia t ON d.id_tipo = t.id_tipo
";

$resultado = $conn->query($sql);
$dados = [];

while ($row = $resultado->fetch_assoc()) {
    $dados[] = $row;
}

echo json_encode($dados);