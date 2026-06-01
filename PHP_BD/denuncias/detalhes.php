<?php

include('../config/database.php');

$id = $_GET['id'];

$sql = "
SELECT
d.*,
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

WHERE d.id_denuncia = ?
";

$stmt = $conn->prepare($sql);

$stmt->bind_param("i", $id);

$stmt->execute();

$resultado = $stmt->get_result();

echo json_encode(
    $resultado->fetch_assoc()
);

?>