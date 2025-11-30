class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.currentProfile = null;
        this.init();
    }

    init() {
        this.loadSession();
    }

    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async verifyPassword(password, hash) {
        const hashedPassword = await this.hashPassword(password);
        return hashedPassword === hash;
    }

    loadSession() {
        try {
            const savedUser = localStorage.getItem('mcpixel_user');
            const savedProfile = localStorage.getItem('mcpixel_profile');
            
            if (savedUser && savedProfile) {
                this.currentUser = JSON.parse(savedUser);
                this.currentProfile = JSON.parse(savedProfile);
                
                if (this.currentProfile.is_admin === undefined) {
                    this.currentProfile.is_admin = false;
                }
                
                const sessionTime = localStorage.getItem('mcpixel_session_time');
                if (sessionTime) {
                    const sessionAge = Date.now() - parseInt(sessionTime);
                    if (sessionAge > 24 * 60 * 60 * 1000) {
                        this.clearSession();
                    }
                }
            }
        } catch (error) {
            console.error('Error cargando sesión:', error);
            this.clearSession();
        }
    }

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

    clearSession() {
        localStorage.removeItem('mcpixel_user');
        localStorage.removeItem('mcpixel_profile');
        localStorage.removeItem('mcpixel_session_time');
        this.currentUser = null;
        this.currentProfile = null;
    }

    async login(username, password) {
        try {
            if (!username || !password) {
                throw new Error('Usuario y contraseña son requeridos');
            }

            const { data: profile, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();

            if (error || !profile) {
                throw new Error('Usuario no encontrado');
            }

            const isPasswordValid = await this.verifyPassword(password, profile.password_hash);
            
            if (!isPasswordValid) {
                throw new Error('Contraseña incorrecta');
            }

            if (profile.is_banned) {
                throw new Error('Usuario baneado. Contacta al administrador.');
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
                is_admin: profile.is_admin || false,
                created_at: profile.created_at
            };

            this.saveSession(user, userProfile);
            return { data: { user, profile: userProfile }, error: null };

        } catch (error) {
            console.error('Error en login:', error);
            return { data: null, error };
        }
    }

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

            const { data: existingUser } = await window.supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (existingUser) {
                throw new Error('El nombre de usuario ya está en uso');
            }

            const passwordHash = await this.hashPassword(password);

            const newUser = {
                username: username,
                password_hash: passwordHash,
                avatar_url: avatar_url,
                is_verified: false,
                is_admin: false
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
                is_admin: profile.is_admin || false,
                created_at: profile.created_at
            };

            this.saveSession(user, userProfile);
            return { data: { user, profile: userProfile }, error: null };

        } catch (error) {
            console.error('Error en registro:', error);
            return { data: null, error };
        }
    }

    async logout() {
        this.clearSession();
        return { error: null };
    }

    isAuthenticated() {
        return this.currentUser !== null && this.currentUser.loggedIn === true;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentProfile() {
        return this.currentProfile;
    }

    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.currentUser) {
                throw new Error('No hay usuario autenticado');
            }

            const { data: profile, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error || !profile) {
                throw new Error('Error al obtener el perfil');
            }

            const isCurrentPasswordValid = await this.verifyPassword(currentPassword, profile.password_hash);
            
            if (!isCurrentPasswordValid) {
                throw new Error('Contraseña actual incorrecta');
            }

            const newPasswordHash = await this.hashPassword(newPassword);

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

    isAdmin() {
        return this.currentProfile && (this.currentProfile.is_admin === true || this.currentProfile.is_admin === 'true');
    }

    async updateProfile(updates) {
        try {
            if (!this.currentUser) {
                throw new Error('No hay usuario autenticado');
            }

            const { error } = await window.supabase
                .from('profiles')
                .update(updates)
                .eq('id', this.currentUser.id);

            if (error) {
                throw new Error('Error al actualizar el perfil');
            }

            if (updates.avatar_url) {
                this.currentProfile.avatar_url = updates.avatar_url;
            }

            if (updates.username) {
                this.currentProfile.username = updates.username;
                this.currentUser.username = updates.username;
            }

            this.saveSession(this.currentUser, this.currentProfile);

            return { error: null };

        } catch (error) {
            return { error };
        }
    }
}

window.authSystem = new AuthSystem();

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

async function requireAuth(redirectTo = 'security.html') {
    if (!window.authSystem.isAuthenticated()) {
        window.location.href = redirectTo;
        return null;
    }
    return window.authSystem.getCurrentUser();
}

async function requireAdmin(redirectTo = 'index.html') {
    if (!window.authSystem.isAuthenticated() || !window.authSystem.isAdmin()) {
        window.location.href = redirectTo;
        return null;
    }
    return window.authSystem.getCurrentUser();
}

function isAuthenticated() {
    return window.authSystem.isAuthenticated();
}

function isAdmin() {
    return window.authSystem.isAdmin();
}

async function changePassword(currentPassword, newPassword) {
    return await window.authSystem.changePassword(currentPassword, newPassword);
}

async function updateProfile(updates) {
    return await window.authSystem.updateProfile(updates);
}
