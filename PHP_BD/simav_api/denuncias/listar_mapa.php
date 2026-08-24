<?php

include('../config/database.php');

$sql = "
SELECT
d.id_denuncia,
d.descricao,
d.status,
d.data_denuncia,

u.nome,

l.endereco,
l.latitude,
l.longitude,

t.nome AS tipo

FROM denuncias d

INNER JOIN usuarios u
ON d.id_usuario = u.id_usuario

INNER JOIN locais l
ON d.id_local = l.id_local

INNER JOIN tipos_denuncia t
ON d.id_tipo = t.id_tipo

ORDER BY d.id_denuncia DESC
";

$resultado = $conn->query($sql);

$dados = [];

while($row = $resultado->fetch_assoc()){

    $dados[] = $row;

}

echo json_encode($dados);

?>