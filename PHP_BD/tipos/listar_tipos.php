<?php

include('../config/database.php');

$sql = "SELECT * FROM tipos_denuncia";

$resultado = $conn->query($sql);

$dados = [];

while($row = $resultado->fetch_assoc()){

    $dados[] = $row;

}

echo json_encode($dados);

?>