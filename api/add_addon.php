<?php
session_start();
require_once '../includes/db.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Validar datos
$required = ['name', 'description', 'version', 'link'];
foreach ($required as $field) {
    if (empty($_POST[$field])) {
        echo json_encode(['success' => false, 'message' => 'Por favor completa todos los campos requeridos']);
        exit;
    }
}

// Subir imagen de portada
$cover_image = null;
if (isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
    $upload_dir = '../uploads/addon_covers/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    $ext = pathinfo($_FILES['cover_image']['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '.' . $ext;
    $destination = $upload_dir . $filename;
    
    if (move_uploaded_file($_FILES['cover_image']['tmp_name'], $destination)) {
        $cover_image = $filename;
    }
}

// Insertar addon
try {
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("INSERT INTO addons (user_id, name, description, version, link, cover_image) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $_SESSION['user_id'],
        $_POST['name'],
        $_POST['description'],
        $_POST['version'],
        $_POST['link'],
        $cover_image
    ]);
    
    $addon_id = $pdo->lastInsertId();
    
    // Procesar etiquetas
    if (!empty($_POST['tags'])) {
        $tags = array_map('trim', explode(',', $_POST['tags']));
        $tags = array_slice(array_unique($tags), 0, 3); // Limitar a 3 etiquetas únicas
        
        foreach ($tags as $tag_name) {
            if (empty($tag_name)) continue;
            
            // Buscar o crear la etiqueta
            $stmt = $pdo->prepare("SELECT id FROM tags WHERE name = ?");
            $stmt->execute([$tag_name]);
            $tag = $stmt->fetch();
            
            if (!$tag) {
                $stmt = $pdo->prepare("INSERT INTO tags (name) VALUES (?)");
                $stmt->execute([$tag_name]);
                $tag_id = $pdo->lastInsertId();
            } else {
                $tag_id = $tag['id'];
            }
            
            // Relacionar addon con etiqueta
            $stmt = $pdo->prepare("INSERT INTO addon_tags (addon_id, tag_id) VALUES (?, ?)");
            $stmt->execute([$addon_id, $tag_id]);
        }
    }
    
    $pdo->commit();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error al publicar el addon: ' . $e->getMessage()]);
}
?>