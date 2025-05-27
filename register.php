<?php
session_start();
require_once 'includes/db.php';
require_once 'includes/functions.php';

if (isLoggedIn()) {
    header('Location: index.php');
    exit;
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username']);
    $password = $_POST['password'];
    $email = trim($_POST['email']);
    
    if (empty($username) || empty($password) || empty($email)) {
        $error = 'Por favor completa todos los campos';
    } else {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->fetch()) {
            $error = 'El nombre de usuario o correo ya está en uso';
        } else {
            // Subir imagen de perfil
            $profile_pic = 'default.png';
            if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === UPLOAD_ERR_OK) {
                $upload_dir = 'uploads/profile_pics/';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0777, true);
                }
                
                $ext = pathinfo($_FILES['profile_pic']['name'], PATHINFO_EXTENSION);
                $filename = uniqid() . '.' . $ext;
                $destination = $upload_dir . $filename;
                
                if (move_uploaded_file($_FILES['profile_pic']['tmp_name'], $destination)) {
                    $profile_pic = $filename;
                }
            }
            
            // Crear usuario
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (username, email, password, profile_pic) VALUES (?, ?, ?, ?)");
            if ($stmt->execute([$username, $email, $hashed_password, $profile_pic])) {
                $success = 'Cuenta creada exitosamente. <a href="login.php">Inicia sesión</a>';
            } else {
                $error = 'Error al crear la cuenta';
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro - MCPixel</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        /* ESTILOS GENERALES */
        :root {
            --primary-color: #6c5ce7;
            --primary-dark: #5649c0;
            --text-color: #2d3436;
            --text-light: #636e72;
            --bg-color: #f5f6fa;
            --card-bg: #ffffff;
            --border-color: #dfe6e9;
            --shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            --radius: 8px;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        /* FORMULARIO DE REGISTRO */
        .auth-container {
            background-color: var(--card-bg);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            padding: 30px;
            width: 100%;
            max-width: 500px;
        }

        .auth-container h1 {
            text-align: center;
            margin-bottom: 20px;
            color: var(--primary-color);
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

        .form-group input[type="file"] {
            padding: 5px;
        }

        .btn {
            display: inline-block;
            padding: 10px 20px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: var(--radius);
            cursor: pointer;
            text-decoration: none;
            font-weight: 500;
            width: 100%;
            text-align: center;
        }

        .btn:hover {
            background-color: var(--primary-dark);
        }

        .profile-pic-preview {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            margin: 0 auto 15px;
            display: block;
            border: 3px solid var(--primary-color);
            background-color: #f0f0f0;
        }

        .text-center {
            text-align: center;
        }

        .mt-3 {
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <h1>Regístrate en MCPixel</h1>
        
        <?php if ($error): ?>
            <div class="alert error"><?= $error ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="alert success"><?= $success ?></div>
        <?php endif; ?>
        
        <form action="register.php" method="post" enctype="multipart/form-data">
            <div class="form-group text-center">
                <div id="profilePreview" class="profile-pic-preview">
                    <i class="fas fa-user" style="font-size: 40px; color: #999; display: block; padding-top: 25px;"></i>
                </div>
                <label for="profile_pic">Foto de perfil (opcional)</label>
                <input type="file" id="profile_pic" name="profile_pic" accept="image/*">
            </div>
            
            <div class="form-group">
                <label for="username">Nombre de usuario</label>
                <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
                <label for="email">Correo electrónico</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Contraseña</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <div class="form-group">
                <label for="confirm_password">Confirmar contraseña</label>
                <input type="password" id="confirm_password" name="confirm_password" required>
            </div>
            
            <button type="submit" class="btn">Registrarse</button>
        </form>
        
        <div class="text-center mt-3">
            ¿Ya tienes una cuenta? <a href="login.php">Inicia sesión</a>
        </div>
    </div>

    <script>
        // Previsualización de la imagen de perfil
        document.getElementById('profile_pic').addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('profilePreview');
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    preview.appendChild(img);
                }
                reader.readAsDataURL(file);
            }
        });

        // Validación de contraseña
        document.querySelector('form').addEventListener('submit', function(e) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            if (password !== confirmPassword) {
                e.preventDefault();
                alert('Las contraseñas no coinciden');
            }
        });
    </script>
</body>
</html>