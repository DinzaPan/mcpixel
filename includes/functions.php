<?php
require_once 'db.php';

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function getUser($id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function getAddons($limit = 10) {
    global $pdo;
    $stmt = $pdo->query("SELECT a.*, u.username, u.profile_pic FROM addons a JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT $limit");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getAddon($id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT a.*, u.username, u.profile_pic FROM addons a JOIN users u ON a.user_id = u.id WHERE a.id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function getAddonTags($addon_id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT t.name FROM tags t JOIN addon_tags at ON t.id = at.tag_id WHERE at.addon_id = ?");
    $stmt->execute([$addon_id]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
}

// Verificar si un usuario es administrador
function isAdmin($userId) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    return $user && $user['is_admin'];
}

// Obtener todos los usuarios
function getAllUsers() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM users ORDER BY created_at DESC");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Obtener todos los addons
function getAllAddons() {
    global $pdo;
    $stmt = $pdo->query("SELECT a.*, u.username, u.is_admin, u.banned 
                         FROM addons a 
                         JOIN users u ON a.user_id = u.id 
                         ORDER BY a.created_at DESC");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Obtener usuarios administradores
function getAdminUsers() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM users WHERE is_admin = 1 ORDER BY created_at DESC");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Eliminar un addon
function deleteAddon($addonId) {
    global $pdo;
    // Primero eliminar las relaciones con tags
    $pdo->prepare("DELETE FROM addon_tags WHERE addon_id = ?")->execute([$addonId]);
    // Luego eliminar el addon
    $pdo->prepare("DELETE FROM addons WHERE id = ?")->execute([$addonId]);
}

// Banear un usuario
function banUser($userId) {
    global $pdo;
    $pdo->prepare("UPDATE users SET banned = 1 WHERE id = ?")->execute([$userId]);
}

// Desbanear un usuario
function unbanUser($userId) {
    global $pdo;
    $pdo->prepare("UPDATE users SET banned = 0 WHERE id = ?")->execute([$userId]);
}

// Hacer administrador a un usuario
function makeAdmin($userId) {
    global $pdo;
    $pdo->prepare("UPDATE users SET is_admin = 1 WHERE id = ?")->execute([$userId]);
}

// Quitar permisos de administrador
function removeAdmin($userId) {
    global $pdo;
    $pdo->prepare("UPDATE users SET is_admin = 0 WHERE id = ?")->execute([$userId]);
}
?>