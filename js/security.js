// Página de seguridad con verificación real
document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
    setupTabs();
    setupForms();
});

// Verificar si ya hay una sesión activa
function checkExistingSession() {
    if (window.authSystem.isAuthenticated()) {
        window.location.href = 'post.html';
    }
}

// Configurar pestañas
function setupTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${tabName}Form`).classList.add('active');
            
            clearErrors();
        });
    });
}

// Configurar formularios
function setupForms() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');
    const button = document.getElementById('loginBtn');
    
    if (!username || !password) {
        showError(errorElement, 'Completa todos los campos');
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';

    try {
        const { data, error } = await login(username, password);
        
        if (error) throw error;

        // Redirigir inmediatamente después del login exitoso
        showError(errorElement, '¡Login exitoso! Redirigiendo...', 'success');
        setTimeout(() => {
            window.location.href = 'post.html';
        }, 1000);
        
    } catch (error) {
        console.error('Error en login:', error);
        showError(errorElement, getAuthErrorMessage(error));
        button.disabled = false;
        button.innerHTML = 'Iniciar Sesión';
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const avatar = document.getElementById('registerAvatar').value.trim();
    const errorElement = document.getElementById('registerError');
    const button = document.getElementById('registerBtn');
    
    // Validaciones
    if (!username || !password) {
        showError(errorElement, 'Completa todos los campos');
        return;
    }
    
    if (username.length < 3) {
        showError(errorElement, 'Usuario debe tener al menos 3 caracteres');
        return;
    }
    
    if (password.length < 6) {
        showError(errorElement, 'Contraseña debe tener al menos 6 caracteres');
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';

    try {
        const { data, error } = await register(username, password, avatar || null);
        
        if (error) throw error;

        // Registro exitoso
        showError(errorElement, '¡Cuenta creada exitosamente! Redirigiendo...', 'success');
        
        setTimeout(() => {
            window.location.href = 'post.html';
        }, 1000);
        
    } catch (error) {
        console.error('Error en registro:', error);
        showError(errorElement, getAuthErrorMessage(error));
        button.disabled = false;
        button.innerHTML = 'Crear Cuenta';
    }
}

// Obtener mensajes de error amigables
function getAuthErrorMessage(error) {
    const errorMessages = {
        'Usuario no encontrado': 'Usuario no encontrado',
        'Contraseña incorrecta': 'Contraseña incorrecta',
        'El nombre de usuario ya está en uso': 'Este usuario ya está registrado',
        'Usuario y contraseña son requeridos': 'Completa todos los campos',
        'El usuario debe tener al menos 3 caracteres': 'El usuario debe tener al menos 3 caracteres',
        'La contraseña debe tener al menos 6 caracteres': 'La contraseña debe tener al menos 6 caracteres'
    };
    
    return errorMessages[error.message] || error.message || 'Error desconocido';
}

// Mostrar errores
function showError(element, message, type = 'error') {
    element.textContent = message;
    element.style.color = type === 'success' ? '#4ade80' : '#f87171';
    element.style.display = 'block';
    
    if (type === 'error') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// Limpiar errores
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
    });
}