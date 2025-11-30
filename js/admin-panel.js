class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.currentProfile = null;
        this.users = [];
        this.addons = [];
        this.currentUsersPage = 1;
        this.currentAddonsPage = 1;
        this.itemsPerPage = 10;
        this.selectedUserId = null;
        this.selectedAddonId = null;
        
        this.init();
    }

    async init() {
        await this.checkAdminAccess();
    }

    async checkAdminAccess() {
        try {
            if (!window.authSystem) {
                setTimeout(() => this.checkAdminAccess(), 100);
                return;
            }

            if (!window.authSystem.currentUser) {
                setTimeout(() => this.checkAdminAccess(), 100);
                return;
            }

            this.currentUser = window.authSystem.getCurrentUser();
            this.currentProfile = window.authSystem.getCurrentProfile();

            await this.verifyAdminFromDatabase();

        } catch (error) {
            this.showAccessDenied();
        }
    }

    async verifyAdminFromDatabase() {
        try {
            if (!this.currentUser) {
                this.showAccessDenied();
                return;
            }

            const { data: currentProfile, error } = await window.supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', this.currentUser.id)
                .single();

            if (error) {
                this.showAccessDenied();
                return;
            }

            const isAdmin = currentProfile.is_admin === true || currentProfile.is_admin === 'true';

            if (isAdmin) {
                this.currentProfile.is_admin = currentProfile.is_admin;
                window.authSystem.currentProfile.is_admin = currentProfile.is_admin;
                
                await this.loadData();
                this.setupEventListeners();
                this.updateStats();
                document.getElementById('loading').style.display = 'none';
                document.getElementById('adminContent').style.display = 'block';
                
                document.getElementById('adminInfo').innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${this.currentProfile.avatar_url || '../img/default-avatar.png'}" 
                             alt="${this.currentProfile.username}" 
                             style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--accent);">
                        <div>
                            <div style="font-weight: 600;">${this.currentProfile.username}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">Administrador</div>
                        </div>
                    </div>
                `;
            } else {
                this.showAccessDenied();
            }

        } catch (error) {
            this.showAccessDenied();
        }
    }

    showAccessDenied() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('accessDenied').style.display = 'block';
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 3000);
    }

    async loadData() {
        await this.loadUsers();
        await this.loadAddons();
    }

    async loadUsers() {
        try {
            const { data: users, error } = await window.supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error cargando usuarios:', error);
                throw error;
            }

            this.users = users || [];
            this.renderUsers();
        } catch (error) {
            this.showError('Error al cargar los usuarios: ' + error.message);
        }
    }

    async loadAddons() {
        try {
            const { data: addons, error } = await window.supabase
                .from('addons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error cargando addons:', error);
                throw error;
            }

            console.log('Addons cargados:', addons);
            this.addons = addons || [];
            this.renderAddons();
        } catch (error) {
            this.showError('Error al cargar los addons: ' + error.message);
        }
    }

    formatId(id) {
        if (!id) return 'N/A';
        const idStr = id.toString();
        return idStr.substring(0, 8) + '...';
    }

    renderUsers() {
        const tableBody = document.getElementById('usersTableBody');
        const searchTerm = document.getElementById('searchUsers').value.toLowerCase();
        
        let filteredUsers = this.users;
        if (searchTerm) {
            filteredUsers = this.users.filter(user => 
                user.username.toLowerCase().includes(searchTerm) ||
                (user.email && user.email.toLowerCase().includes(searchTerm)) ||
                (user.id && user.id.toString().toLowerCase().includes(searchTerm))
            );
        }

        const totalPages = Math.ceil(filteredUsers.length / this.itemsPerPage);
        const startIndex = (this.currentUsersPage - 1) * this.itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + this.itemsPerPage);

        if (paginatedUsers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        No se encontraron usuarios
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = paginatedUsers.map(user => `
            <tr>
                <td>${this.formatId(user.id)}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${user.avatar_url || '../img/default-avatar.png'}" 
                             alt="${user.username}" 
                             style="width: 32px; height: 32px; border-radius: 50%;">
                        ${user.username}
                        ${user.is_verified ? '<i class="fas fa-check-circle" style="color: var(--verified-color);"></i>' : ''}
                    </div>
                </td>
                <td>${user.email || 'No disponible'}</td>
                <td>
                    <span class="status-badge ${user.is_banned ? 'status-banned' : 'status-active'}">
                        ${user.is_banned ? 'Baneado' : 'Activo'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.is_verified ? 'status-active' : 'status-pending'}">
                        ${user.is_verified ? 'Verificado' : 'No verificado'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.is_admin ? 'status-active' : 'status-pending'}">
                        ${user.is_admin ? 'Admin' : 'Usuario'}
                    </span>
                </td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        ${!user.is_banned ? `
                            <button class="action-btn btn-ban" onclick="adminPanel.banUserPrompt('${user.id}')" title="Banear usuario">
                                <i class="fas fa-ban"></i> Ban
                            </button>
                        ` : `
                            <button class="action-btn btn-unban" onclick="adminPanel.unbanUser('${user.id}')" title="Desbanear usuario">
                                <i class="fas fa-check-circle"></i> Desban
                            </button>
                        `}
                        ${user.id !== this.currentUser.id ? `
                            <button class="action-btn btn-delete" onclick="adminPanel.deleteUser('${user.id}')" title="Eliminar usuario">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        ` : ''}
                        ${!user.is_admin && user.id !== this.currentUser.id ? `
                            <button class="action-btn" onclick="adminPanel.makeAdmin('${user.id}')" title="Hacer administrador" style="color: var(--accent);">
                                <i class="fas fa-shield-alt"></i> Hacer Admin
                            </button>
                        ` : ''}
                        ${user.is_admin && user.id !== this.currentUser.id ? `
                            <button class="action-btn" onclick="adminPanel.removeAdmin('${user.id}')" title="Quitar administrador" style="color: var(--text-secondary);">
                                <i class="fas fa-user"></i> Quitar Admin
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        this.renderPagination('usersPagination', this.currentUsersPage, totalPages, 'users');
    }

    renderAddons() {
        const tableBody = document.getElementById('addonsTableBody');
        const searchTerm = document.getElementById('searchAddons').value.toLowerCase();
        
        let filteredAddons = this.addons;
        if (searchTerm) {
            filteredAddons = this.addons.filter(addon => 
                (addon.title && addon.title.toLowerCase().includes(searchTerm)) ||
                (addon.description && addon.description.toLowerCase().includes(searchTerm)) ||
                (addon.creator && addon.creator.toLowerCase().includes(searchTerm)) ||
                (addon.id && addon.id.toString().toLowerCase().includes(searchTerm))
            );
        }

        const totalPages = Math.ceil(filteredAddons.length / this.itemsPerPage);
        const startIndex = (this.currentAddonsPage - 1) * this.itemsPerPage;
        const paginatedAddons = filteredAddons.slice(startIndex, startIndex + this.itemsPerPage);

        if (paginatedAddons.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        No se encontraron addons
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = paginatedAddons.map(addon => `
            <tr>
                <td>${this.formatId(addon.id)}</td>
                <td>${addon.title || 'Sin título'}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${addon.creator_avatar || '../img/default-avatar.png'}" 
                             alt="${addon.creator || 'Anónimo'}" 
                             style="width: 24px; height: 24px; border-radius: 50%;">
                        ${addon.creator || 'Anónimo'}
                    </div>
                </td>
                <td>${addon.downloads || 0}</td>
                <td>v${addon.version || '1.0.0'}</td>
                <td>
                    <span class="status-badge ${addon.is_blocked ? 'status-banned' : 'status-active'}">
                        ${addon.is_blocked ? 'Bloqueado' : 'Activo'}
                    </span>
                </td>
                <td>${new Date(addon.created_at).toLocaleDateString()}</td>
                <td>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        ${addon.id ? `
                            <button class="action-btn" onclick="window.open('../sc/view.html?id=${addon.id}', '_blank')" title="Ver addon">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                            ${!addon.is_blocked ? `
                                <button class="action-btn btn-ban" onclick="adminPanel.blockAddon('${addon.id}')" title="Bloquear addon">
                                    <i class="fas fa-ban"></i> Bloquear
                                </button>
                            ` : `
                                <button class="action-btn btn-unban" onclick="adminPanel.unblockAddon('${addon.id}')" title="Desbloquear addon">
                                    <i class="fas fa-check-circle"></i> Desbloquear
                                </button>
                            `}
                            <button class="action-btn btn-delete" onclick="adminPanel.deleteAddonPrompt('${addon.id}')" title="Eliminar addon">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        this.renderPagination('addonsPagination', this.currentAddonsPage, totalPages, 'addons');
    }

    renderPagination(containerId, currentPage, totalPages, type) {
        const container = document.getElementById(containerId);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        if (currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="adminPanel.changePage('${type}', ${currentPage - 1})">Anterior</button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                paginationHTML += `
                    <button class="page-btn ${i === currentPage ? 'active' : ''}" 
                            onclick="adminPanel.changePage('${type}', ${i})">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += `<span class="page-btn" style="background: transparent; border: none;">...</span>`;
            }
        }

        if (currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" onclick="adminPanel.changePage('${type}', ${currentPage + 1})">Siguiente</button>`;
        }

        container.innerHTML = paginationHTML;
    }

    changePage(type, page) {
        if (type === 'users') {
            this.currentUsersPage = page;
            this.renderUsers();
        } else {
            this.currentAddonsPage = page;
            this.renderAddons();
        }
    }

    updateStats() {
        const totalUsers = this.users.length;
        const totalAddons = this.addons.length;
        const bannedUsers = this.users.filter(user => user.is_banned).length;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAddons = this.addons.filter(addon => {
            const addonDate = new Date(addon.created_at);
            addonDate.setHours(0, 0, 0, 0);
            return addonDate.getTime() === today.getTime();
        }).length;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalAddons').textContent = totalAddons;
        document.getElementById('bannedUsers').textContent = bannedUsers;
        document.getElementById('todayAddons').textContent = todayAddons;
    }

    setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        document.getElementById('searchUsers').addEventListener('input', () => {
            this.currentUsersPage = 1;
            this.renderUsers();
        });

        document.getElementById('searchAddons').addEventListener('input', () => {
            this.currentAddonsPage = 1;
            this.renderAddons();
        });
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    }

    banUserPrompt(userId) {
        this.selectedUserId = userId;
        const user = this.users.find(u => u.id === userId);
        
        const reason = prompt(`¿Banear a ${user.username}? Ingresa el motivo:`);
        if (reason === null) return;
        
        if (!reason.trim()) {
            this.showError('Debes ingresar un motivo para el baneo');
            return;
        }

        const duration = prompt('Duración del baneo:\n1 - 1 día\n7 - 1 semana\n30 - 1 mes\n365 - 1 año\npermanent - Permanente', '7');
        if (duration === null) return;

        this.banUser(reason, duration);
    }

    async banUser(reason, duration) {
        if (!this.selectedUserId) return;

        try {
            const { error } = await window.supabase
                .from('profiles')
                .update({ 
                    is_banned: true,
                    ban_reason: reason,
                    banned_until: duration === 'permanent' ? null : this.calculateBanDate(parseInt(duration))
                })
                .eq('id', this.selectedUserId);

            if (error) throw error;

            this.showSuccess('Usuario baneado correctamente');
            await this.loadUsers();
            this.updateStats();
        } catch (error) {
            this.showError('Error al banear el usuario: ' + error.message);
        }
    }

    calculateBanDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }

    async unbanUser(userId) {
        if (!confirm('¿Estás seguro de que deseas desbanear a este usuario?')) return;

        try {
            const { error } = await window.supabase
                .from('profiles')
                .update({ 
                    is_banned: false,
                    ban_reason: null,
                    banned_until: null
                })
                .eq('id', userId);

            if (error) throw error;

            this.showSuccess('Usuario desbaneado correctamente');
            await this.loadUsers();
            this.updateStats();
        } catch (error) {
            this.showError('Error al desbanear el usuario: ' + error.message);
        }
    }

    async makeAdmin(userId) {
        if (!confirm('¿Estás seguro de que deseas hacer administrador a este usuario?')) return;

        try {
            const { error } = await window.supabase
                .from('profiles')
                .update({ is_admin: true })
                .eq('id', userId);

            if (error) throw error;

            this.showSuccess('Usuario ahora es administrador');
            await this.loadUsers();
        } catch (error) {
            this.showError('Error al hacer administrador: ' + error.message);
        }
    }

    async removeAdmin(userId) {
        if (!confirm('¿Estás seguro de que deseas quitar los permisos de administrador a este usuario?')) return;

        try {
            const { error } = await window.supabase
                .from('profiles')
                .update({ is_admin: false })
                .eq('id', userId);

            if (error) throw error;

            this.showSuccess('Permisos de administrador removidos');
            await this.loadUsers();
        } catch (error) {
            this.showError('Error al remover administrador: ' + error.message);
        }
    }

    async deleteUser(userId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción eliminará todos sus addons y no se puede deshacer.')) return;

        try {
            const { error: addonsError } = await window.supabase
                .from('addons')
                .delete()
                .eq('user_id', userId);

            if (addonsError) {
                console.error('Error eliminando addons:', addonsError);
            }

            const { error } = await window.supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            this.showSuccess('Usuario eliminado correctamente');
            await this.loadData();
            this.updateStats();
        } catch (error) {
            this.showError('Error al eliminar el usuario: ' + error.message);
        }
    }

    async blockAddon(addonId) {
        if (!confirm('¿Estás seguro de que deseas bloquear este addon?')) return;

        try {
            const { error } = await window.supabase
                .from('addons')
                .update({ is_blocked: true })
                .eq('id', addonId);

            if (error) throw error;

            this.showSuccess('Addon bloqueado correctamente');
            await this.loadAddons();
        } catch (error) {
            this.showError('Error al bloquear el addon: ' + error.message);
        }
    }

    async unblockAddon(addonId) {
        if (!confirm('¿Estás seguro de que deseas desbloquear este addon?')) return;

        try {
            const { error } = await window.supabase
                .from('addons')
                .update({ is_blocked: false })
                .eq('id', addonId);

            if (error) throw error;

            this.showSuccess('Addon desbloqueado correctamente');
            await this.loadAddons();
        } catch (error) {
            this.showError('Error al desbloquear el addon: ' + error.message);
        }
    }

    deleteAddonPrompt(addonId) {
        this.selectedAddonId = addonId;
        const addon = this.addons.find(a => a.id === addonId);
        
        const reason = prompt(`¿Eliminar el addon "${addon.title}"? Ingresa el motivo:`);
        if (reason === null) return;
        
        if (!reason.trim()) {
            this.showError('Debes ingresar un motivo para la eliminación');
            return;
        }

        this.deleteAddon(reason);
    }

    async deleteAddon(reason) {
        if (!this.selectedAddonId) return;

        try {
            const { error } = await window.supabase
                .from('addons')
                .delete()
                .eq('id', this.selectedAddonId);

            if (error) throw error;

            this.showSuccess('Addon eliminado correctamente');
            await this.loadAddons();
            this.updateStats();
        } catch (error) {
            this.showError('Error al eliminar el addon: ' + error.message);
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        const existingMessages = document.querySelectorAll('.message-temp');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `message-temp ${type === 'error' ? 'error-message' : 'success-message'}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'}"></i>
            ${message}
        `;

        const container = document.querySelector('.admin-container');
        container.insertBefore(messageDiv, container.firstChild);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
