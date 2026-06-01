<?php

include('../config/database.php');

$id_denuncia = $_POST['id_denuncia'];

$arquivo = $_FILES['imagem'];

$nome = uniqid() . ".jpg";

$caminho = "../uploads/" . $nome;

move_uploaded_file(
    $arquivo['tmp_name'],
    $caminho
);

$sql = "INSERT INTO imagens
(caminho, id_denuncia)
VALUES
(?, ?)";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "si",
    $nome,
    $id_denuncia
);

$stmt->execute();

echo json_encode([
    "success" => true
]);

?>