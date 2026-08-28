<?php
include('../config/cors.php');
include('../config/database.php');

$sql = "
SELECT
d.id_denuncia,
d.status,
l.latitude,
l.longitude,
t.nome AS tipo

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