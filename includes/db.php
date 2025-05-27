<?php
$host = 'sql209.infinityfree.com'; 
$dbname = 'if0_39085338_mcpixel'; 
$username = 'if0_39085338'; 
$password = 'PDCrxO2Vly5hDNl'; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}
?>