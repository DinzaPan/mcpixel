<?php
session_start();
require_once 'includes/db.php';
require_once 'includes/functions.php';

// Verificar si el usuario es administrador
if (!isLoggedIn() || !isAdmin($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

// Obtener datos para el panel
$users = getAllUsers();
$addons = getAllAddons();
$admins = getAdminUsers();

// Procesar acciones de administrador
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['delete_addon'])) {
        $addonId = $_POST['addon_id'];
        deleteAddon($addonId);
        $success = "Addon eliminado correctamente";
        $addons = getAllAddons(); // Actualizar lista
    }
    elseif (isset($_POST['ban_user'])) {
        $userId = $_POST['user_id'];
        if (!isAdmin($userId)) {
            banUser($userId);
            $success = "Usuario baneado correctamente";
            $users = getAllUsers(); // Actualizar lista
        } else {
            $error = "No puedes banear a un administrador";
        }
    }
    elseif (isset($_POST['unban_user'])) {
        $userId = $_POST['user_id'];
        unbanUser($userId);
        $success = "Usuario desbaneado correctamente";
        $users = getAllUsers(); // Actualizar lista
    }
    elseif (isset($_POST['make_admin'])) {
        $userId = $_POST['user_id'];
        if (!isAdmin($userId)) {
            makeAdmin($userId);
            $success = "Usuario promovido a administrador";
            $admins = getAdminUsers(); // Actualizar lista
            $users = getAllUsers(); // Actualizar lista
        }
    }
    elseif (isset($_POST['remove_admin'])) {
        $userId = $_POST['user_id'];
        if ($_SESSION['user_id'] != $userId) { // No puede quitarse sus propios permisos
            removeAdmin($userId);
            $success = "Usuario removido como administrador";
            $admins = getAdminUsers(); // Actualizar lista
            $users = getAllUsers(); // Actualizar lista
        } else {
            $error = "No puedes quitarte tus propios permisos de administrador";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - MCPixel</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        :root {
            --primary-color: #6c5ce7;
            --primary-dark: #5649c0;
            --primary-light: #a29bfe;
            --danger-color: #e74c3c;
            --danger-dark: #c0392b;
            --success-color: #2ecc71;
            --success-dark: #27ae60;
            --warning-color: #f39c12;
            --warning-dark: #e67e22;
            --text-color: #2d3436;
            --text-light: #636e72;
            --bg-color: #f5f6fa;
            --card-bg: #ffffff;
            --border-color: #dfe6e9;
            --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            --radius: 8px;
            --transition: all 0.3s ease;
        }

        .dark-theme {
            --primary-color: #a29bfe;
            --primary-dark: #6c5ce7;
            --text-color: #f5f6fa;
            --text-light: #b2bec3;
            --bg-color: #121212;
            --card-bg: #1e1e1e;
            --border-color: #333;
            --shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
        }

        /* Header */
        header {
            background-color: var(--card-bg);
            box-shadow: var(--shadow);
            padding: 15px 0;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 24px;
            font-weight: 700;
            color: var(--primary-color);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo i {
            font-size: 28px;
        }

        .admin-badge {
            background-color: var(--primary-color);
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 10px;
        }

        /* Main Content */
        .admin-container {
            padding: 30px 0;
        }

        .admin-section {
            background-color: var(--card-bg);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            padding: 25px;
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 20px;
            color: var(--primary-color);
            display: flex;
            align-items: center;
            gap: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border-color);
        }

        /* Tablas */
        .admin-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        .admin-table th, .admin-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        .admin-table th {
            background-color: var(--primary-light);
            color: white;
            font-weight: 500;
        }

        .admin-table tr:hover {
            background-color: rgba(108, 92, 231, 0.05);
        }

        /* Badges */
        .badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }

        .badge-admin {
            background-color: var(--primary-color);
            color: white;
        }

        .badge-banned {
            background-color: var(--danger-color);
            color: white;
        }

        .badge-active {
            background-color: var(--success-color);
            color: white;
        }

        /* Botones */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 8px 12px;
            border-radius: var(--radius);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
            text-decoration: none;
            gap: 6px;
            border: none;
        }

        .btn-sm {
            padding: 6px 10px;
            font-size: 13px;
        }

        .btn-danger {
            background-color: var(--danger-color);
            color: white;
        }

        .btn-danger:hover {
            background-color: var(--danger-dark);
        }

        .btn-success {
            background-color: var(--success-color);
            color: white;
        }

        .btn-success:hover {
            background-color: var(--success-dark);
        }

        .btn-warning {
            background-color: var(--warning-color);
            color: white;
        }

        .btn-warning:hover {
            background-color: var(--warning-dark);
        }

        .btn-primary {
            background-color: var(--primary-color);
            color: white;
        }

        .btn-primary:hover {
            background-color: var(--primary-dark);
        }

        /* Alertas */
        .alert {
            padding: 12px 15px;
            border-radius: var(--radius);
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .alert-success {
            background-color: rgba(46, 204, 113, 0.1);
            color: var(--success-dark);
            border-left: 4px solid var(--success-color);
        }

        .alert-error {
            background-color: rgba(231, 76, 60, 0.1);
            color: var(--danger-dark);
            border-left: 4px solid var(--danger-color);
        }

        /* Responsive */
        @media (max-width: 992px) {
            .admin-table {
                display: block;
                overflow-x: auto;
            }
        }

        @media (max-width: 768px) {
            .header-container {
                flex-direction: column;
                gap: 15px;
            }
            
            .admin-table th, .admin-table td {
                padding: 8px 10px;
            }
        }
    </style>
</head>
<body class="<?= isLoggedIn() && getUser($_SESSION['user_id'])['theme'] === 'dark' ? 'dark-theme' : 'light-theme' ?>">
    <header>
        <div class="container">
            <div class="header-container">
                <a href="index.php" class="logo">
                    <i class="fas fa-cube"></i>
                    MCPixel <span class="admin-badge">Admin Panel</span>
                </a>
                <nav>
                    <a href="index.php" class="btn btn-primary">
                        <i class="fas fa-home"></i> Volver al inicio
                    </a>
                    <a href="logout.php" class="btn btn-danger">
                        <i class="fas fa-sign-out-alt"></i> Cerrar sesión
                    </a>
                </nav>
            </div>
        </div>
    </header>

    <main class="admin-container">
        <div class="container">
            <?php if (isset($success)): ?>
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    <?= $success ?>
                </div>
            <?php endif; ?>
            
            <?php if (isset($error)): ?>
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <?= $error ?>
                </div>
            <?php endif; ?>

            <!-- Sección de Administradores -->
            <div class="admin-section">
                <h2 class="section-title">
                    <i class="fas fa-user-shield"></i> Administradores
                </h2>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre de usuario</th>
                            <th>Email</th>
                            <th>Fecha de registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($admins as $admin): ?>
                            <tr>
                                <td><?= $admin['id'] ?></td>
                                <td>
                                    <?= htmlspecialchars($admin['username']) ?>
                                    <span class="badge badge-admin">Admin</span>
                                </td>
                                <td><?= htmlspecialchars($admin['email']) ?></td>
                                <td><?= date('d/m/Y', strtotime($admin['created_at'])) ?></td>
                                <td>
                                    <?php if ($_SESSION['user_id'] != $admin['id']): ?>
                                        <form method="POST" style="display: inline;">
                                            <input type="hidden" name="user_id" value="<?= $admin['id'] ?>">
                                            <button type="submit" name="remove_admin" class="btn btn-danger btn-sm">
                                                <i class="fas fa-user-minus"></i> Quitar admin
                                            </button>
                                        </form>
                                    <?php else: ?>
                                        <span class="text-muted">Tu cuenta</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <!-- Sección de Usuarios -->
            <div class="admin-section">
                <h2 class="section-title">
                    <i class="fas fa-users"></i> Gestión de Usuarios
                </h2>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre de usuario</th>
                            <th>Email</th>
                            <th>Estado</th>
                            <th>Fecha de registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($users as $user): ?>
                            <?php if (!isAdmin($user['id'])): ?>
                                <tr>
                                    <td><?= $user['id'] ?></td>
                                    <td><?= htmlspecialchars($user['username']) ?></td>
                                    <td><?= htmlspecialchars($user['email']) ?></td>
                                    <td>
                                        <?php if ($user['banned']): ?>
                                            <span class="badge badge-banned">Baneado</span>
                                        <?php else: ?>
                                            <span class="badge badge-active">Activo</span>
                                        <?php endif; ?>
                                    </td>
                                    <td><?= date('d/m/Y', strtotime($user['created_at'])) ?></td>
                                    <td>
                                        <?php if ($user['banned']): ?>
                                            <form method="POST" style="display: inline;">
                                                <input type="hidden" name="user_id" value="<?= $user['id'] ?>">
                                                <button type="submit" name="unban_user" class="btn btn-success btn-sm">
                                                    <i class="fas fa-user-check"></i> Desbanear
                                                </button>
                                            </form>
                                        <?php else: ?>
                                            <form method="POST" style="display: inline;">
                                                <input type="hidden" name="user_id" value="<?= $user['id'] ?>">
                                                <button type="submit" name="ban_user" class="btn btn-danger btn-sm">
                                                    <i class="fas fa-user-slash"></i> Banear
                                                </button>
                                            </form>
                                        <?php endif; ?>
                                        
                                        <form method="POST" style="display: inline;">
                                            <input type="hidden" name="user_id" value="<?= $user['id'] ?>">
                                            <button type="submit" name="make_admin" class="btn btn-primary btn-sm">
                                                <i class="fas fa-user-shield"></i> Hacer admin
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <!-- Sección de Addons -->
            <div class="admin-section">
                <h2 class="section-title">
                    <i class="fas fa-cubes"></i> Gestión de Addons
                </h2>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Versión</th>
                            <th>Publicado por</th>
                            <th>Fecha de publicación</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($addons as $addon): ?>
                            <tr>
                                <td><?= $addon['id'] ?></td>
                                <td><?= htmlspecialchars($addon['name']) ?></td>
                                <td><?= htmlspecialchars($addon['version']) ?></td>
                                <td>
                                    <?= htmlspecialchars($addon['username']) ?>
                                    <?php if (isAdmin($addon['user_id'])): ?>
                                        <span class="badge badge-admin">Admin</span>
                                    <?php endif; ?>
                                </td>
                                <td><?= date('d/m/Y', strtotime($addon['created_at'])) ?></td>
                                <td>
                                    <form method="POST" onsubmit="return confirm('¿Estás seguro de querer eliminar este addon?');">
                                        <input type="hidden" name="addon_id" value="<?= $addon['id'] ?>">
                                        <button type="submit" name="delete_addon" class="btn btn-danger btn-sm">
                                            <i class="fas fa-trash-alt"></i> Eliminar
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <script>
        // Confirmación antes de acciones importantes
        document.querySelectorAll('form[onsubmit]').forEach(form => {
            form.addEventListener('submit', function(e) {
                if (!confirm(this.getAttribute('data-confirm') || '¿Estás seguro de realizar esta acción?')) {
                    e.preventDefault();
                }
            });
        });
    </script>
</body>
</html>