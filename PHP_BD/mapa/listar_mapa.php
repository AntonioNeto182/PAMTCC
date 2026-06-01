<?php

include('../config/database.php');

$sql = "
SELECT
latitude,
longitude
FROM locais
";

$resultado = $conn->query($sql);

$dados = [];

while($row = $resultado->fetch_assoc()){

    $dados[] = $row;

}

echo json_encode($dados);

?>