<?php
session_start();
require_once 'includes/db.php';
require_once 'includes/functions.php';

if (!isLoggedIn()) {
    header('Location: login.php');
    exit;
}

$user = getUser($_SESSION['user_id']);
$error = '';
$success = '';

// Procesar cambio de tema
if (isset($_POST['change_theme'])) {
    $theme = $_POST['theme'] === 'dark' ? 'dark' : 'light';
    $stmt = $pdo->prepare("UPDATE users SET theme = ? WHERE id = ?");
    if ($stmt->execute([$theme, $_SESSION['user_id']])) {
        $user['theme'] = $theme;
        $success = 'Tema actualizado correctamente';
    } else {
        $error = 'Error al actualizar el tema';
    }
}

// Procesar actualización de perfil
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_profile'])) {
    $username = trim($_POST['username']);
    
    // Actualizar nombre de usuario si cambió
    if ($username !== $user['username']) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
        $stmt->execute([$username, $user['id']]);
        
        if ($stmt->fetch()) {
            $error = 'El nombre de usuario ya está en uso';
        } else {
            $stmt = $pdo->prepare("UPDATE users SET username = ? WHERE id = ?");
            if ($stmt->execute([$username, $user['id']])) {
                $success = 'Nombre de usuario actualizado';
                $user['username'] = $username;
            } else {
                $error = 'Error al actualizar el nombre de usuario';
            }
        }
    }
    
    // Actualizar foto de perfil si se subió una nueva
    if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = 'uploads/profile_pics/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        // Eliminar la foto anterior si no es la predeterminada
        if ($user['profile_pic'] !== 'default.png') {
            @unlink($upload_dir . $user['profile_pic']);
        }
        
        $ext = pathinfo($_FILES['profile_pic']['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '.' . $ext;
        $destination = $upload_dir . $filename;
        
        if (move_uploaded_file($_FILES['profile_pic']['tmp_name'], $destination)) {
            $stmt = $pdo->prepare("UPDATE users SET profile_pic = ? WHERE id = ?");
            if ($stmt->execute([$filename, $user['id']])) {
                $success = $success ? $success . ' y foto de perfil actualizada' : 'Foto de perfil actualizada';
                $user['profile_pic'] = $filename;
            } else {
                $error = $error ? $error . '. Error al actualizar la foto' : 'Error al actualizar la foto';
            }
        }
    }
    
    // Cambiar contraseña si se proporcionaron los campos
    if (!empty($_POST['current_password']) && !empty($_POST['new_password'])) {
        if (password_verify($_POST['current_password'], $user['password'])) {
            $hashed_password = password_hash($_POST['new_password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            if ($stmt->execute([$hashed_password, $user['id']])) {
                $success = $success ? $success . ' y contraseña actualizada' : 'Contraseña actualizada';
            } else {
                $error = $error ? $error . '. Error al actualizar la contraseña' : 'Error al actualizar la contraseña';
            }
        } else {
            $error = $error ? $error . '. La contraseña actual es incorrecta' : 'La contraseña actual es incorrecta';
        }
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Perfil - MCPixel</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        /* ESTILOS GENERALES */
        :root {
            --primary-color: #6c5ce7;
            --primary-dark: #5649c0;
            --primary-light: #a29bfe;
            --text-color: #2d3436;
            --text-light: #636e72;
            --bg-color: #f5f6fa;
            --card-bg: #ffffff;
            --border-color: #dfe6e9;
            --shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            --radius: 8px;
        }

        .dark-theme {
            --primary-color: #a29bfe;
            --primary-dark: #6c5ce7;
            --text-color: #f5f6fa;
            --text-light: #b2bec3;
            --bg-color: #121212;
            --card-bg: #1e1e1e;
            --border-color: #333;
            --shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
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
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 15px;
        }

        /* HEADER */
        header {
            background-color: var(--card-bg);
            box-shadow: var(--shadow);
            padding: 15px 0;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        header .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 24px;
            font-weight: 700;
            color: var(--primary-color);
            text-decoration: none;
        }

        nav {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .btn {
            display: inline-block;
            padding: 8px 16px;
            border-radius: var(--radius);
            font-weight: 500;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background-color: var(--primary-color);
            color: white;
        }

        .btn-primary:hover {
            background-color: var(--primary-dark);
        }

        .btn-outline {
            border: 1px solid var(--primary-color);
            color: var(--primary-color);
            background-color: transparent;
        }

        .btn-outline:hover {
            background-color: rgba(108, 92, 231, 0.1);
        }

        .profile-pic {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            cursor: pointer;
        }

        /* PERFIL */
        .profile-container {
            display: flex;
            gap: 30px;
            margin-top: 30px;
        }

        .profile-sidebar {
            width: 300px;
            flex-shrink: 0;
        }

        .profile-card {
            background-color: var(--card-bg);
            border-radius: var(--radius);
            padding: 30px;
            box-shadow: var(--shadow);
            text-align: center;
            margin-bottom: 20px;
        }

        .profile-pic-large {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid var(--primary-color);
            margin: 0 auto 20px;
        }

        .profile-name {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .profile-username {
            color: var(--primary-color);
            margin-bottom: 20px;
        }

        .profile-stats {
            display: flex;
            justify-content: space-around;
            margin-top: 20px;
        }

        .stat-item {
            text-align: center;
        }

        .stat-number {
            font-size: 20px;
            font-weight: 700;
            color: var(--primary-color);
        }

        .stat-label {
            font-size: 12px;
            color: var(--text-light);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .profile-content {
            flex: 1;
        }

        .profile-section {
            background-color: var(--card-bg);
            border-radius: var(--radius);
            padding: 30px;
            box-shadow: var(--shadow);
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: var(--primary-color);
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            background-color: var(--card-bg);
            color: var(--text-color);
        }

        .theme-options {
            display: flex;
            gap: 15px;
            margin-top: 10px;
        }

        .theme-option {
            padding: 10px 15px;
            border-radius: var(--radius);
            cursor: pointer;
            border: 1px solid var(--border-color);
            transition: all 0.3s ease;
        }

        .theme-option.light {
            background-color: #ffffff;
            color: #2d3436;
        }

        .theme-option.dark {
            background-color: #1e1e1e;
            color: #f5f6fa;
        }

        .theme-option input {
            display: none;
        }

        .theme-option input:checked + span {
            border: 2px solid var(--primary-color);
        }

        .alert {
            padding: 10px 15px;
            margin-bottom: 20px;
            border-radius: var(--radius);
        }

        .alert.error {
            background-color: rgba(220, 53, 69, 0.1);
            color: #dc3545;
            border-left: 4px solid #dc3545;
        }

        .alert.success {
            background-color: rgba(40, 167, 69, 0.1);
            color: #28a745;
            border-left: 4px solid #28a745;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
            .profile-container {
                flex-direction: column;
            }
            
            .profile-sidebar {
                width: 100%;
            }
        }
    </style>
</head>
<body class="<?= $user['theme'] === 'dark' ? 'dark-theme' : 'light-theme' ?>">
    <header>
        <div class="container">
            <a href="index.php" class="logo">MCPixel</a>
            <nav>
                <a href="index.php" class="btn btn-outline">Inicio</a>
                <img src="<?= !empty($user['profile_pic']) ? 'uploads/profile_pics/' . $user['profile_pic'] : 'https://via.placeholder.com/40' ?>" alt="Foto de perfil" class="profile-pic" id="profileDropdown">
                <div id="dropdownMenu" style="display: none; position: absolute; background: var(--card-bg); box-shadow: var(--shadow); padding: 10px; border-radius: var(--radius); right: 15px; top: 70px; width: 200px;">
                    <a href="profile.php" style="display: block; padding: 8px 0; color: var(--text-color); text-decoration: none;"><i class="fas fa-user"></i> Mi Perfil</a>
                    <a href="logout.php" style="display: block; padding: 8px 0; color: var(--text-color); text-decoration: none;"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</a>
                </div>
            </nav>
        </div>
    </header>

    <main class="container">
        <div class="profile-container">
            <div class="profile-sidebar">
                <div class="profile-card">
                    <img src="<?= !empty($user['profile_pic']) ? 'uploads/profile_pics/' . $user['profile_pic'] : 'https://via.placeholder.com/150' ?>" alt="Foto de perfil" class="profile-pic-large" id="profilePicPreview">
                    <h2 class="profile-name"><?= htmlspecialchars($user['username']) ?></h2>
                    <div class="profile-stats">
                        <div class="stat-item">
                            <div class="stat-number">24</div>
                            <div class="stat-label">Addons</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">1.2K</div>
                            <div class="stat-label">Descargas</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="profile-content">
                <?php if ($error): ?>
                    <div class="alert error"><?= $error ?></div>
                <?php endif; ?>
                
                <?php if ($success): ?>
                    <div class="alert success"><?= $success ?></div>
                <?php endif; ?>
                
                <div class="profile-section">
                    <h3 class="section-title">Información del Perfil</h3>
                    <form action="profile.php" method="post" enctype="multipart/form-data">
                        <div class="form-group">
                            <label for="profile_pic">Foto de perfil</label>
                            <input type="file" id="profile_pic" name="profile_pic" accept="image/*">
                        </div>
                        
                        <div class="form-group">
                            <label for="username">Nombre de usuario</label>
                            <input type="text" id="username" name="username" value="<?= htmlspecialchars($user['username']) ?>" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Preferencias de tema</label>
                            <div class="theme-options">
                                <label>
                                    <input type="radio" name="theme" value="light" <?= $user['theme'] === 'light' ? 'checked' : '' ?> onchange="this.form.submit()">
                                    <span class="theme-option light">Claro</span>
                                </label>
                                <label>
                                    <input type="radio" name="theme" value="dark" <?= $user['theme'] === 'dark' ? 'checked' : '' ?> onchange="this.form.submit()">
                                    <span class="theme-option dark">Oscuro</span>
                                </label>
                            </div>
                            <input type="hidden" name="change_theme" value="1">
                        </div>
                        
                        <button type="submit" name="update_profile" class="btn btn-primary">Guardar cambios</button>
                    </form>
                </div>
                
                <div class="profile-section">
                    <h3 class="section-title">Cambiar Contraseña</h3>
                    <form action="profile.php" method="post">
                        <div class="form-group">
                            <label for="current_password">Contraseña actual</label>
                            <input type="password" id="current_password" name="current_password">
                        </div>
                        
                        <div class="form-group">
                            <label for="new_password">Nueva contraseña</label>
                            <input type="password" id="new_password" name="new_password">
                        </div>
                        
                        <div class="form-group">
                            <label for="confirm_password">Confirmar nueva contraseña</label>
                            <input type="password" id="confirm_password" name="confirm_password">
                        </div>
                        
                        <button type="submit" name="update_profile" class="btn btn-primary">Cambiar contraseña</button>
                    </form>
                </div>
            </div>
        </div>
    </main>

    <script>
        // Dropdown del perfil
        document.getElementById('profileDropdown')?.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = document.getElementById('dropdownMenu');
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Cerrar dropdown al hacer clic fuera
        window.addEventListener('click', function() {
            const dropdown = document.getElementById('dropdownMenu');
            if (dropdown) dropdown.style.display = 'none';
        });

        // Previsualización de la imagen de perfil
        document.getElementById('profile_pic')?.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('profilePicPreview');
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });

        // Validación de cambio de contraseña
        document.querySelector('form[action="profile.php"]:last-of-type')?.addEventListener('submit', function(e) {
            const newPassword = document.getElementById('new_password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            if (newPassword !== confirmPassword) {
                e.preventDefault();
                alert('Las contraseñas no coinciden');
            }
        });
    </script>
</body>
</html>