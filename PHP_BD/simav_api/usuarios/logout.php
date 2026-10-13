<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');

$eu = exigirLogin($conn);

revogarToken($eu['jti'], $eu['exp']);

echo json_encode(['success' => true]);