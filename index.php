<?php
// Forzar conexión SSL
if ($_SERVER['HTTPS'] != "on" && !isset($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
    $url = "https://". $_SERVER['SERVER_NAME'] . $_SERVER['REQUEST_URI'];
    header("Location: $url");
    exit;
}

session_start();
require_once 'includes/db.php';
require_once 'includes/functions.php';

$addons = getAddons();
$searchResults = [];
$searchQuery = '';

if (isset($_GET['search']) && !empty($_GET['search'])) {
    $searchQuery = trim($_GET['search']);
    $searchResults = searchAddons($searchQuery);
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCPixel - Descubre Addons Increíbles</title>
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
            --text-light: #bbb;
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

        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 15px;
        }

        .logo {
            font-size: 24px;
            font-weight: 700;
            color: var(--primary-color);
            text-decoration: none;
        }

        /* NUEVO DISEÑO PARA BOTONES DE LOGIN/REGISTER */
        .auth-buttons {
            display: flex;
            gap: 12px;
        }

        .auth-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 20px;
            border-radius: var(--radius);
            font-weight: 500;
            text-decoration: none;
            transition: all 0.3s ease;
            font-size: 15px;
        }

        .auth-btn i {
            margin-right: 8px;
        }

        .auth-btn-login {
            border: 2px solid var(--primary-color);
            color: var(--primary-color);
            background-color: transparent;
        }

        .auth-btn-login:hover {
            background-color: rgba(108, 92, 231, 0.1);
            transform: translateY(-2px);
        }

        .auth-btn-register {
            background-color: var(--primary-color);
            color: white;
            box-shadow: 0 4px 6px rgba(108, 92, 231, 0.2);
        }

        .auth-btn-register:hover {
            background-color: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(108, 92, 231, 0.3);
        }

        .profile-pic {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            cursor: pointer;
            transition: transform 0.3s ease;
        }

        .profile-pic:hover {
            transform: scale(1.1);
        }

        /* BARRA DE BÚSQUEDA */
        .search-bar {
            background-color: var(--card-bg);
            padding: 15px 0;
            margin-bottom: 20px;
        }

        .search-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 15px;
        }

        .search-form {
            display: flex;
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
        }

        .search-input {
            flex-grow: 1;
            padding: 12px 15px;
            border: 2px solid var(--border-color);
            border-radius: var(--radius) 0 0 var(--radius);
            background-color: var(--card-bg);
            color: var(--text-color);
            outline: none;
            transition: border-color 0.3s;
        }

        .search-input:focus {
            border-color: var(--primary-color);
        }

        .search-button {
            padding: 0 20px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 0 var(--radius) var(--radius) 0;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        .search-button:hover {
            background-color: var(--primary-dark);
        }

        /* TARJETAS DE ADDONS */
        .addons-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 25px;
            margin: 30px 0;
        }

        .addon-card {
            background-color: var(--card-bg);
            border-radius: var(--radius);
            overflow: hidden;
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
        }

        .addon-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
        }

        .addon-cover {
            width: 100%;
            height: 160px;
            object-fit: cover;
            transition: transform 0.5s ease;
        }

        .addon-card:hover .addon-cover {
            transform: scale(1.05);
        }

        .addon-cover.placeholder {
            background-color: var(--primary-color);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 40px;
        }

        .addon-body {
            padding: 15px;
        }

        .addon-title {
            font-size: 18px;
            margin-bottom: 10px;
            color: var(--primary-color);
        }

        .addon-desc {
            color: var(--text-light);
            font-size: 14px;
            margin-bottom: 15px;
            line-height: 1.5;
        }

        .addon-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .user-pic {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            object-fit: cover;
        }

        .version {
            font-size: 14px;
            color: var(--text-light);
            background-color: rgba(108, 92, 231, 0.1);
            padding: 3px 8px;
            border-radius: 12px;
        }

        /* MODAL DE PUBLICACIÓN */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background-color: var(--card-bg);
            border-radius: var(--radius);
            width: 90%;
            max-width: 500px;
            padding: 20px;
            position: relative;
            animation: modalFadeIn 0.3s ease-out;
        }

        @keyframes modalFadeIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .close-modal {
            position: absolute;
            top: 15px;
            right: 15px;
            font-size: 24px;
            cursor: pointer;
            color: var(--text-light);
            transition: color 0.3s;
        }

        .close-modal:hover {
            color: var(--primary-color);
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            background-color: var(--card-bg);
            color: var(--text-color);
            transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
            border-color: var(--primary-color);
            outline: none;
        }

        .form-group textarea {
            min-height: 100px;
            resize: vertical;
        }

        /* INTERFAZ MINIMIZADA (Diseño anterior mejorado) */
        .detail-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-y: auto;
        }

        .detail-content {
            background-color: var(--card-bg);
            border-radius: var(--radius);
            width: 100%;
            max-width: 800px;
            overflow: hidden;
            box-shadow: var(--shadow);
            animation: modalFadeIn 0.3s ease-out;
        }

        .detail-cover-container {
            position: relative;
            width: 100%;
            padding-top: 40%; /* Relación de aspecto */
            background-color: var(--bg-color);
        }

        .detail-cover {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .detail-body {
            padding: 25px;
        }

        .detail-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }

        .detail-user-pic {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
            margin-right: 15px;
            border: 2px solid var(--primary-light);
        }

        .detail-user-info {
            flex: 1;
        }

        .detail-username {
            font-weight: 600;
            margin-bottom: 5px;
        }

        .detail-version {
            font-size: 14px;
            color: var(--text-light);
        }

        .detail-title {
            font-size: 24px;
            margin-bottom: 15px;
            color: var(--primary-color);
        }

        .detail-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
        }

        .detail-tag {
            background-color: var(--primary-light);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }

        .detail-desc {
            margin-bottom: 25px;
            line-height: 1.7;
            font-size: 15px;
        }

        .detail-download-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 25px;
            background-color: var(--primary-color);
            color: white;
            border-radius: var(--radius);
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s;
            width: 100%;
            text-align: center;
        }

        .detail-download-btn i {
            margin-right: 10px;
        }

        .detail-download-btn:hover {
            background-color: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(108, 92, 231, 0.3);
        }

        /* BOTÓN FLOTANTE */
        .floating-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: var(--primary-color);
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 900;
            transition: all 0.3s;
        }

        .floating-btn:hover {
            transform: scale(1.1) translateY(-5px);
            background-color: var(--primary-dark);
        }

        /* DROPDOWN DE PERFIL */
        #dropdownMenu {
            display: none;
            position: absolute;
            background: var(--card-bg);
            box-shadow: var(--shadow);
            padding: 10px;
            border-radius: var(--radius);
            right: 15px;
            top: 70px;
            z-index: 101;
            min-width: 180px;
            animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        #dropdownMenu a {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            color: var(--text-color);
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.2s;
        }

        #dropdownMenu a i {
            margin-right: 10px;
            width: 20px;
            text-align: center;
        }

        #dropdownMenu a:hover {
            background-color: rgba(108, 92, 231, 0.1);
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
            .addons-grid {
                grid-template-columns: 1fr;
            }
            
            .detail-cover-container {
                padding-top: 60%;
            }
            
            .detail-title {
                font-size: 20px;
            }
            
            .detail-user-pic {
                width: 50px;
                height: 50px;
            }
        }

        @media (max-width: 480px) {
            .auth-buttons {
                gap: 8px;
            }
            
            .auth-btn {
                padding: 8px 15px;
                font-size: 14px;
            }
            
            .detail-cover-container {
                padding-top: 80%;
            }
            
            .detail-body {
                padding: 20px;
            }
            
            .detail-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .detail-user-pic {
                margin-right: 0;
                margin-bottom: 15px;
            }
            
            .detail-desc {
                font-size: 14px;
            }
        }
    </style>
</head>
<body class="<?= isLoggedIn() && getUser($_SESSION['user_id'])['theme'] === 'dark' ? 'dark-theme' : 'light-theme' ?>">
    <header>
        <div class="header-container">
            <a href="index.php" class="logo">MCPixel</a>
            <nav>
                <?php if (isLoggedIn()): ?>
                    <?php 
                    $user = getUser($_SESSION['user_id']);
                    $profile_pic = !empty($user['profile_pic']) ? 'uploads/profile_pics/' . $user['profile_pic'] : 'https://via.placeholder.com/40';
                    ?>
                    <img src="<?= $profile_pic ?>" alt="Foto de perfil" class="profile-pic" id="profileDropdown">
                    <div id="dropdownMenu">
                        <a href="profile.php"><i class="fas fa-user"></i>Perfil</a>
                        <a href="logout.php"><i class="fas fa-sign-out-alt"></i>Cerrar sesión</a>
                    </div>
                <?php else: ?>
                    <div class="auth-buttons">
                        <a href="login.php" class="auth-btn auth-btn-login"><i class="fas fa-sign-in-alt"></i>Iniciar sesión</a>
                        <a href="register.php" class="auth-btn auth-btn-register"><i class="fas fa-user-plus"></i>Registrarse</a>
                    </div>
                <?php endif; ?>
            </nav>
        </div>
    </header>

    <div class="search-bar">
        <div class="search-container">
            <form class="search-form" action="index.php" method="get">
                <input type="text" name="search" class="search-input" placeholder="Buscar addons..." value="<?= htmlspecialchars($searchQuery) ?>">
                <button type="submit" class="search-button"><i class="fas fa-search"></i></button>
            </form>
        </div>
    </div>

    <main class="container">
        <div class="addons-grid">
            <?php if (!empty($searchQuery)): ?>
                <?php if (!empty($searchResults)): ?>
                    <?php foreach ($searchResults as $addon): ?>
                        <div class="addon-card" data-addon-id="<?= $addon['id'] ?>">
                            <?php if (!empty($addon['cover_image'])): ?>
                                <img src="uploads/addon_covers/<?= $addon['cover_image'] ?>" alt="<?= htmlspecialchars($addon['name']) ?>" class="addon-cover">
                            <?php else: ?>
                                <div class="addon-cover placeholder">
                                    <i class="fas fa-cube"></i>
                                </div>
                            <?php endif; ?>
                            
                            <div class="addon-body">
                                <h3 class="addon-title"><?= htmlspecialchars($addon['name']) ?></h3>
                                <p class="addon-desc">
                                    <?= strlen($addon['description']) > 100 ? 
                                        htmlspecialchars(substr($addon['description'], 0, 100)) . '...' : 
                                        htmlspecialchars($addon['description']) ?>
                                </p>
                                
                                <div class="addon-meta">
                                    <div class="user-info">
                                        <?php 
                                        $profile_pic = !empty($addon['profile_pic']) ? 'uploads/profile_pics/' . $addon['profile_pic'] : 'https://via.placeholder.com/30';
                                        ?>
                                        <img src="<?= $profile_pic ?>" alt="Foto de perfil" class="user-pic">
                                        <span><?= htmlspecialchars($addon['username']) ?></span>
                                    </div>
                                    <span class="version">v<?= htmlspecialchars($addon['version']) ?></span>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div style="grid-column: 1 / -1; text-align: center; padding: 50px 0;">
                        <i class="fas fa-search-minus" style="font-size: 50px; color: var(--text-light); margin-bottom: 20px;"></i>
                        <p style="font-size: 18px; color: var(--text-light);">No se encontraron addons que coincidan con "<?= htmlspecialchars($searchQuery) ?>"</p>
                    </div>
                <?php endif; ?>
            <?php else: ?>
                <?php foreach ($addons as $addon): ?>
                    <div class="addon-card" data-addon-id="<?= $addon['id'] ?>">
                        <?php if (!empty($addon['cover_image'])): ?>
                            <img src="uploads/addon_covers/<?= $addon['cover_image'] ?>" alt="<?= htmlspecialchars($addon['name']) ?>" class="addon-cover">
                        <?php else: ?>
                            <div class="addon-cover placeholder">
                                <i class="fas fa-cube"></i>
                            </div>
                        <?php endif; ?>
                        
                        <div class="addon-body">
                            <h3 class="addon-title"><?= htmlspecialchars($addon['name']) ?></h3>
                            <p class="addon-desc">
                                <?= strlen($addon['description']) > 100 ? 
                                    htmlspecialchars(substr($addon['description'], 0, 100)) . '...' : 
                                    htmlspecialchars($addon['description']) ?>
                            </p>
                            
                            <div class="addon-meta">
                                <div class="user-info">
                                    <?php 
                                    $profile_pic = !empty($addon['profile_pic']) ? 'uploads/profile_pics/' . $addon['profile_pic'] : 'https://via.placeholder.com/30';
                                    ?>
                                    <img src="<?= $profile_pic ?>" alt="Foto de perfil" class="user-pic">
                                    <span><?= htmlspecialchars($addon['username']) ?></span>
                                </div>
                                <span class="version">v<?= htmlspecialchars($addon['version']) ?></span>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </main>

    <?php if (isLoggedIn()): ?>
        <button class="floating-btn" id="addAddonBtn">
            <i class="fas fa-plus"></i>
        </button>

        <div class="modal" id="addonFormModal">
            <div class="modal-content">
                <span class="close-modal" id="closeModalBtn">&times;</span>
                <h2>Publicar nuevo Addon</h2>
                <form id="addonForm" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="addonName">Nombre del Addon</label>
                        <input type="text" id="addonName" name="name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="addonDesc">Descripción</label>
                        <textarea id="addonDesc" name="description" required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="addonVersion">Versión</label>
                        <input type="text" id="addonVersion" name="version" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="addonLink">Link de descarga</label>
                        <input type="url" id="addonLink" name="link" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="addonCover">Imagen de portada (opcional)</label>
                        <input type="file" id="addonCover" name="cover_image" accept="image/*">
                    </div>
                    
                    <div class="form-group">
                        <label for="addonTags">Etiquetas (máx. 3, separadas por comas)</label>
                        <input type="text" id="addonTags" name="tags" placeholder="Ej: decoración, construcción, herramientas">
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 15px;">Publicar Addon</button>
                </form>
            </div>
        </div>
    <?php endif; ?>

    <div class="detail-modal" id="addonDetailModal">
        <div class="detail-content">
            <span class="close-modal" id="closeDetailBtn">&times;</span>
            <div class="detail-cover-container">
                <img id="detailCover" class="detail-cover" src="" alt="Portada del addon">
            </div>
            <div class="detail-body">
                <div class="detail-header">
                    <img id="detailUserPic" class="detail-user-pic" src="" alt="Foto de perfil">
                    <div class="detail-user-info">
                        <div id="detailUsername" class="detail-username"></div>
                        <div id="detailVersion" class="detail-version"></div>
                    </div>
                </div>
                
                <h2 id="detailName" class="detail-title"></h2>
                
                <div id="detailTags" class="detail-tags"></div>
                
                <p id="detailDesc" class="detail-desc"></p>
                
                <a href="#" id="detailLink" class="detail-download-btn">
                    <i class="fas fa-download"></i> Descargar Addon
                </a>
            </div>
        </div>
    </div>

    <script>
        // Dropdown del perfil
        document.getElementById('profileDropdown')?.addEventListener('click', function() {
            const dropdown = document.getElementById('dropdownMenu');
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Cerrar dropdown al hacer clic fuera
        window.addEventListener('click', function(e) {
            if (!e.target.matches('#profileDropdown')) {
                const dropdown = document.getElementById('dropdownMenu');
                if (dropdown) dropdown.style.display = 'none';
            }
        });

        // Modal para agregar addons
        const addAddonBtn = document.getElementById('addAddonBtn');
        const addonFormModal = document.getElementById('addonFormModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        
        if (addAddonBtn) {
            addAddonBtn.addEventListener('click', function() {
                addonFormModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function() {
                addonFormModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }
        
        // Cerrar modal al hacer clic fuera
        addonFormModal?.addEventListener('click', function(e) {
            if (e.target === addonFormModal) {
                addonFormModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
        
        // Enviar formulario de addon
        document.getElementById('addonForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            fetch('api/add_addon.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.reload();
                } else {
                    alert(data.message || 'Error al publicar el addon');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al publicar el addon');
            });
        });
        
        // Modal de detalle de addon
        const addonCards = document.querySelectorAll('.addon-card');
        const addonDetailModal = document.getElementById('addonDetailModal');
        const closeDetailBtn = document.getElementById('closeDetailBtn');
        
        addonCards.forEach(card => {
            card.addEventListener('click', function() {
                const addonId = this.getAttribute('data-addon-id');
                
                fetch(`api/get_addon.php?id=${addonId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            const addon = data.addon;
                            
                            // Mostrar la imagen de portada
                            const detailCover = document.getElementById('detailCover');
                            if (addon.cover_image) {
                                detailCover.src = `uploads/addon_covers/${addon.cover_image}`;
                                detailCover.style.display = 'block';
                            } else {
                                detailCover.src = '';
                                detailCover.style.display = 'flex';
                                detailCover.style.alignItems = 'center';
                                detailCover.style.justifyContent = 'center';
                                detailCover.innerHTML = '<i class="fas fa-cube" style="color: white; font-size: 60px;"></i>';
                            }
                            
                            // Mostrar foto de perfil del usuario
                            const detailUserPic = document.getElementById('detailUserPic');
                            detailUserPic.src = addon.profile_pic ? `uploads/profile_pics/${addon.profile_pic}` : 'https://via.placeholder.com/50';
                            
                            // Mostrar otros datos
                            document.getElementById('detailUsername').textContent = addon.username;
                            document.getElementById('detailVersion').textContent = `v${addon.version}`;
                            document.getElementById('detailName').textContent = addon.name;
                            document.getElementById('detailDesc').textContent = addon.description;
                            document.getElementById('detailLink').href = addon.link;
                            
                            // Mostrar etiquetas
                            const tagsContainer = document.getElementById('detailTags');
                            tagsContainer.innerHTML = '';
                            
                            if (data.tags && data.tags.length > 0) {
                                data.tags.forEach(tag => {
                                    const tagElement = document.createElement('span');
                                    tagElement.className = 'detail-tag';
                                    tagElement.textContent = tag;
                                    tagsContainer.appendChild(tagElement);
                                });
                            }
                            
                            addonDetailModal.style.display = 'flex';
                            document.body.style.overflow = 'hidden';
                        } else {
                            alert(data.message || 'Error al cargar el addon');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Error al cargar el addon');
                    });
            });
        });
        
        if (closeDetailBtn) {
            closeDetailBtn.addEventListener('click', function() {
                addonDetailModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }
        
        // Cerrar modal de detalle al hacer clic fuera
        addonDetailModal?.addEventListener('click', function(e) {
            if (e.target === addonDetailModal) {
                addonDetailModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    </script>
</body>
</html>