<?php
session_start();
require_once '../includes/db.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

if (!isset($_GET['id'])) {
    echo json_encode(['success' => false, 'message' => 'ID de addon no proporcionado']);
    exit;
}

$addon = getAddon($_GET['id']);
if (!$addon) {
    echo json_encode(['success' => false, 'message' => 'Addon no encontrado']);
    exit;
}

$tags = getAddonTags($_GET['id']);

echo json_encode([
    'success' => true,
    'addon' => $addon,
    'tags' => $tags
]);
?>