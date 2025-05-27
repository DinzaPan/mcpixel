<?php
session_start();
require_once 'includes/db.php';
require_once 'includes/functions.php';

if (isLoggedIn()) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username']);
    $password = $_POST['password'];
    
    if (empty($username) || empty($password)) {
        $error = 'Por favor completa todos los campos';
    } else {
        $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            header('Location: index.php');
            exit;
        } else {
            $error = 'Nombre de usuario o contraseña incorrectos';
        }
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar sesión - MCPixel</title>
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

        /* FORMULARIO DE LOGIN */
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

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            background-color: var(--card-bg);
            color: var(--text-color);
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

        .text-center {
            text-align: center;
        }

        .mt-3 {
            margin-top: 15px;
        }

        .remember-me {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }

        .remember-me input {
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <h1>Iniciar sesión</h1>
        
        <?php if ($error): ?>
            <div class="alert error"><?= $error ?></div>
        <?php endif; ?>
        
        <form action="login.php" method="post">
            <div class="form-group">
                <label for="username">Nombre de usuario</label>
                <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
                <label for="password">Contraseña</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <div class="remember-me">
                <input type="checkbox" id="remember" name="remember">
                <label for="remember">Recordar mi sesión</label>
            </div>
            
            <button type="submit" class="btn">Iniciar sesión</button>
        </form>
        
        <div class="text-center mt-3">
            ¿No tienes una cuenta? <a href="register.php">Regístrate</a>
        </div>
    </div>
</body>
</html>