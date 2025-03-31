document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const elements = {
        registerForm: document.getElementById('register-form'),
        editForm: document.getElementById('edit-form'),
        registerSection: document.getElementById('register-section'),
        badgeSection: document.getElementById('badge-section'),
        editSection: document.getElementById('edit-section'),
        editProfileBtn: document.getElementById('edit-profile-btn'),
        cancelEditBtn: document.getElementById('cancel-edit'),
        avatarUpload: document.getElementById('avatar-upload'),
        badgeAvatar: document.getElementById('badge-avatar'),
        editAvatarPreview: document.getElementById('edit-avatar-preview'),
        mainHeader: document.querySelector('.main-header'),
        registerUsername: document.getElementById('register-username'),
        registerPassword: document.getElementById('register-password'),
        registerEmail: document.getElementById('register-email'),
        editUsername: document.getElementById('edit-username'),
        editPassword: document.getElementById('edit-password'),
        editEmail: document.getElementById('edit-email')
    };

    // Constantes
    const DEFAULT_AVATAR = 'https://i.imgur.com/J6l19aX.png';
    const USER_KEY = 'mcPixelUser';
    const STREAK_KEY = 'mcPixelStreak';

    // Inicialización
    initApp();

    function initApp() {
        checkUserSession();
        setupEventListeners();
    }

    function checkUserSession() {
        const userData = getUserData();
        
        if (userData) {
            showUserProfile(userData);
        } else {
            showRegisterForm();
        }
    }

    function setupEventListeners() {
        // Formulario de registro
        elements.registerForm.addEventListener('submit', handleRegister);
        
        // Formulario de edición
        elements.editForm.addEventListener('submit', handleProfileUpdate);
        elements.cancelEditBtn.addEventListener('click', cancelEdit);
        elements.editProfileBtn.addEventListener('click', showEditForm);
        
        // Cambio de avatar
        elements.avatarUpload.addEventListener('change', handleAvatarChange);
    }

    function handleRegister(e) {
        e.preventDefault();
        
        const username = elements.registerUsername.value.trim();
        const password = elements.registerPassword.value;
        const email = elements.registerEmail.value.trim() || 'No especificado';

        if (!validateRegisterForm(username, password)) return;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        showLoadingState(submitBtn, 'Registrando...');

        setTimeout(() => {
            const newUser = createUser(username, password, email);
            saveUserData(newUser);
            createConfetti();
            
            setTimeout(() => {
                showUserProfile(newUser);
                resetLoadingState(submitBtn, 'Registrar');
            }, 800);
        }, 1500);
    }

    function validateRegisterForm(username, password) {
        if (username.length < 3) {
            showError('El nombre de usuario debe tener al menos 3 caracteres');
            return false;
        }

        if (password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres');
            return false;
        }

        return true;
    }

    function createUser(username, password, email) {
        return {
            username,
            password,
            email,
            id: generateUserId(),
            joinDate: getCurrentDate(),
            avatar: DEFAULT_AVATAR
        };
    }

    function handleProfileUpdate(e) {
        e.preventDefault();
        
        const userData = getUserData();
        const updatedData = {
            username: elements.editUsername.value.trim() || userData.username,
            password: elements.editPassword.value || userData.password,
            email: elements.editEmail.value.trim() || userData.email,
            id: userData.id,
            joinDate: userData.joinDate,
            avatar: userData.avatar
        };

        saveUserData(updatedData);
        showUserProfile(updatedData);
    }

    function handleAvatarChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!validateImage(file)) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const userData = getUserData();
            userData.avatar = event.target.result;
            saveUserData(userData);
            
            elements.badgeAvatar.src = event.target.result;
            elements.editAvatarPreview.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function validateImage(file) {
        if (!file.type.match('image.*')) {
            showError('Por favor selecciona una imagen válida');
            return false;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            showError('La imagen debe ser menor a 2MB');
            return false;
        }

        return true;
    }

    function showUserProfile(userData) {
        // Actualizar UI
        elements.registerSection.classList.add('hidden');
        elements.badgeSection.classList.remove('hidden');
        elements.editSection.classList.add('hidden');
        elements.mainHeader.classList.remove('hidden');

        // Actualizar datos del perfil
        document.getElementById('badge-username').textContent = userData.username;
        document.getElementById('badge-id').textContent = userData.id;
        document.getElementById('badge-joindate').innerHTML = 
            `<i class="fas fa-calendar-day icon-calendar"></i> ${userData.joinDate}`;
        elements.badgeAvatar.src = userData.avatar;
        elements.editAvatarPreview.src = userData.avatar;

        // Iniciar sistema de rachas
        initializeStreakSystem();
    }

    function showRegisterForm() {
        elements.registerSection.classList.remove('hidden');
        elements.badgeSection.classList.add('hidden');
        elements.editSection.classList.add('hidden');
        elements.mainHeader.classList.add('hidden');
    }

    function showEditForm() {
        const userData = getUserData();
        elements.badgeSection.classList.add('hidden');
        elements.editSection.classList.remove('hidden');
        
        elements.editUsername.value = userData.username;
        elements.editEmail.value = userData.email;
        elements.editPassword.value = '';
    }

    function cancelEdit() {
        showUserProfile(getUserData());
    }

    // Sistema de rachas
    function initializeStreakSystem() {
        let streakData = getStreakData() || {
            currentStreak: 0,
            lastLogin: null,
            nextUpdate: null
        };

        const now = new Date();
        const lastLogin = streakData.lastLogin ? new Date(streakData.lastLogin) : null;
        const nextUpdate = streakData.nextUpdate ? new Date(streakData.nextUpdate) : null;

        // Lógica de actualización de racha
        if (!streakData.lastLogin) {
            streakData = createNewStreak(now);
        } else if (nextUpdate && now >= nextUpdate) {
            streakData = updateStreak(streakData, now);
        }

        saveStreakData(streakData);
        updateStreakDisplay(streakData);
        startStreakTimer(streakData);
    }

    function createNewStreak(date) {
        return {
            currentStreak: 1,
            lastLogin: date.toISOString(),
            nextUpdate: getNextUpdateTime(date).toISOString()
        };
    }

    function updateStreak(streakData, currentDate) {
        const timeDiff = currentDate - new Date(streakData.lastLogin);
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        return {
            currentStreak: hoursDiff <= 48 ? streakData.currentStreak + 1 : 1,
            lastLogin: currentDate.toISOString(),
            nextUpdate: getNextUpdateTime(currentDate).toISOString()
        };
    }

    function updateStreakDisplay(streakData) {
        const streakCount = document.getElementById('streak-count');
        const streakRow = document.querySelector('.streak-row');
        
        streakCount.textContent = streakData.currentStreak;
        streakRow.classList.toggle('streak-5', streakData.currentStreak >= 5);
    }

    function startStreakTimer(streakData) {
        const nextUpdate = new Date(streakData.nextUpdate);
        const timeRemaining = document.getElementById('time-remaining');
        const progressBar = document.getElementById('streak-progress');
        
        function updateTimer() {
            const now = new Date();
            const diff = nextUpdate - now;
            
            if (diff <= 0) {
                initializeStreakSystem();
                return;
            }
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            timeRemaining.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            progressBar.style.width = `${100 - (diff / 86400000 * 100)}%`;
        }
        
        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        
        window.addEventListener('beforeunload', () => clearInterval(timer));
    }

    // Helpers
    function getNextUpdateTime(date) {
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        return next;
    }

    function generateUserId() {
        return `MP-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    function getCurrentDate() {
        const now = new Date();
        return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    }

    function showLoadingState(button, text) {
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        button.disabled = true;
    }

    function resetLoadingState(button, text) {
        button.innerHTML = `<i class="fas fa-user-plus"></i> ${text}`;
        button.disabled = false;
    }

    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        document.body.appendChild(errorElement);
        
        setTimeout(() => {
            errorElement.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => errorElement.remove(), 500);
        }, 3000);
    }

    function createConfetti() {
        const colors = ['#6c5ce7', '#00cec9', '#a29bfe', '#00b894', '#fdcb6e'];
        const container = document.querySelector('.form-card');
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.top = '100%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = `${Math.random() * 8 + 5}px`;
            confetti.style.height = confetti.style.width;
            confetti.style.animationDuration = `${Math.random() * 2 + 1}s`;
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            
            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 2000);
        }
    }

    // Storage helpers
    function getUserData() {
        return JSON.parse(localStorage.getItem(USER_KEY));
    }

    function saveUserData(userData) {
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }

    function getStreakData() {
        return JSON.parse(localStorage.getItem(STREAK_KEY));
    }

    function saveStreakData(streakData) {
        localStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
    }
});