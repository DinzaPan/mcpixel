// Sistema de autenticación propio con verificación real de contraseñas
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.currentProfile = null;
        this.init();
    }

    init() {
        this.loadSession();
    }

    // Función para hashear contraseñas (simple pero funcional)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Verificar contraseña
    async verifyPassword(password, hash) {
        const hashedPassword = await this.hashPassword(password);
        return hashedPassword === hash;
    }

    // Cargar sesión desde localStorage
    loadSession() {
        try {
            const savedUser = localStorage.getItem('mcpixel_user');
            const savedProfile = localStorage.getItem('mcpixel_profile');
            
            if (savedUser && savedProfile) {
                this.currentUser = JSON.parse(savedUser);
                this.currentProfile = JSON.parse(savedProfile);
                
                // Verificar que la sesión no haya expirado (24 horas)
                const sessionTime = localStorage.getItem('mcpixel_session_time');
                if (sessionTime) {
                    const sessionAge = Date.now() - parseInt(sessionTime);
                    if (sessionAge > 24 * 60 * 60 * 1000) { // 24 horas
                        this.clearSession();
                    }
                }
            }
        } catch (error) {
            console.error('Error cargando sesión:', error);
            this.clearSession();
        }
    }

    // Guardar sesión en localStorage
    saveSession(user, profile) {
        try {
            localStorage.setItem('mcpixel_user', JSON.stringify(user));
            localStorage.setItem('mcpixel_profile', JSON.stringify(profile));
            localStorage.setItem('mcpixel_session_time', Date.now().toString());
            this.currentUser = user;
            this.currentProfile = profile;
        } catch (error) {
            console.error('Error guardando sesión:', error);
        }
    }

    // Limpiar sesión
    clearSession() {
        localStorage.removeItem('mcpixel_user');
        localStorage.removeItem('mcpixel_profile');
        localStorage.removeItem('mcpixel_session_time');
        this.currentUser = null;
        this.currentProfile = null;
    }

    // Login con verificación real de contraseña
    async login(username, password) {
        try {
            if (!username || !password) {
                throw new Error('Usuario y contraseña son requeridos');
            }

            // Buscar usuario por username
            const { data: profile, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();

            if (error || !profile) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar contraseña
            const isPasswordValid = await this.verifyPassword(password, profile.password_hash);
            
            if (!isPasswordValid) {
                throw new Error('Contraseña incorrecta');
            }

            const user = {
                id: profile.id,
                username: profile.username,
                loggedIn: true
            };

            const userProfile = {
                id: profile.id,
                username: profile.username,
                avatar_url: profile.avatar_url,
                is_verified: profile.is_verified,
                created_at: profile.created_at
            };

            this.saveSession(user, userProfile);
            return { data: { user, profile: userProfile }, error: null };

        } catch (error) {
            console.error('Error en login:', error);
            return { data: null, error };
        }
    }

    // Registro con hash de contraseña
    async register(username, password, avatar_url = null) {
        try {
            if (!username || !password) {
                throw new Error('Usuario y contraseña son requeridos');
            }

            if (username.length < 3) {
                throw new Error('El usuario debe tener al menos 3 caracteres');
            }

            if (password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            // Verificar si el usuario ya existe
            const { data: existingUser } = await window.supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (existingUser) {
                throw new Error('El nombre de usuario ya está en uso');
            }

            // Hashear contraseña
            const passwordHash = await this.hashPassword(password);

            // Crear nuevo usuario
            const newUser = {
                username: username,
                password_hash: passwordHash,
                avatar_url: avatar_url,
                is_verified: false
            };

            const { data: profile, error } = await window.supabase
                .from('profiles')
                .insert([newUser])
                .select()
                .single();

            if (error) {
                console.error('Error creando usuario:', error);
                throw new Error('Error al crear el usuario');
            }

            const user = {
                id: profile.id,
                username: profile.username,
                loggedIn: true
            };

            const userProfile = {
                id: profile.id,
                username: profile.username,
                avatar_url: profile.avatar_url,
                is_verified: profile.is_verified,
                created_at: profile.created_at
            };

            this.saveSession(user, userProfile);
            return { data: { user, profile: userProfile }, error: null };

        } catch (error) {
            console.error('Error en registro:', error);
            return { data: null, error };
        }
    }

    // Logout
    async logout() {
        this.clearSession();
        return { error: null };
    }

    // Verificar si está autenticado
    isAuthenticated() {
        return this.currentUser !== null && this.currentUser.loggedIn === true;
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }

    // Obtener perfil actual
    getCurrentProfile() {
        return this.currentProfile;
    }

    // Cambiar contraseña (función adicional)
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.currentUser) {
                throw new Error('No hay usuario autenticado');
            }

            // Obtener perfil actual desde la base de datos
            const { data: profile, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error || !profile) {
                throw new Error('Error al obtener el perfil');
            }

            // Verificar contraseña actual
            const isCurrentPasswordValid = await this.verifyPassword(currentPassword, profile.password_hash);
            
            if (!isCurrentPasswordValid) {
                throw new Error('Contraseña actual incorrecta');
            }

            // Hashear nueva contraseña
            const newPasswordHash = await this.hashPassword(newPassword);

            // Actualizar contraseña
            const { error: updateError } = await window.supabase
                .from('profiles')
                .update({ password_hash: newPasswordHash })
                .eq('id', this.currentUser.id);

            if (updateError) {
                throw new Error('Error al actualizar la contraseña');
            }

            return { error: null };

        } catch (error) {
            return { error };
        }
    }
}

// Instancia global del sistema de autenticación
window.authSystem = new AuthSystem();

// Funciones de autenticación para compatibilidad
async function getCurrentUser() {
    return window.authSystem.getCurrentUser();
}

async function getCurrentProfile() {
    return window.authSystem.getCurrentProfile();
}

async function login(username, password) {
    return await window.authSystem.login(username, password);
}

async function register(username, password, avatar_url = null) {
    return await window.authSystem.register(username, password, avatar_url);
}

async function logout() {
    return await window.authSystem.logout();
}

// Función para verificar autenticación en páginas protegidas
async function requireAuth(redirectTo = 'security.html') {
    if (!window.authSystem.isAuthenticated()) {
        window.location.href = redirectTo;
        return null;
    }
    return window.authSystem.getCurrentUser();
}