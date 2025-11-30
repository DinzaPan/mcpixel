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
        
        const debugInfo = document.getElementById('debugInfo');
        const debugContent = document.getElementById('debugContent');
        
        if (debugInfo && debugContent) {
            debugInfo.style.display = 'block';
            let debugHTML = '<div style="font-family: monospace; font-size: 12px;">';
            
            if (window.authSystem) {
                debugHTML += `<p><strong>Usuario autenticado:</strong> ${window.authSystem.isAuthenticated()}</p>`;
                debugHTML += `<p><strong>Es admin:</strong> ${window.authSystem.isAdmin()}</p>`;
                
                const user = window.authSystem.getCurrentUser();
                const profile = window.authSystem.getCurrentProfile();
                
                if (user) {
                    debugHTML += `<p><strong>Usuario:</strong> ${JSON.stringify(user)}</p>`;
                }
                if (profile) {
                    debugHTML += `<p><strong>Perfil:</strong> ${JSON.stringify(profile)}</p>`;
                }
            } else {
                debugHTML += `<p><strong>authSystem:</strong> No disponible</p>`;
            }
            
            debugHTML += `<p><strong>LocalStorage user:</strong> ${localStorage.getItem('mcpixel_user')}</p>`;
            debugHTML += `<p><strong>LocalStorage profile:</strong> ${localStorage.getItem('mcpixel_profile')}</p>`;
            debugHTML += '</div>';
            
            debugContent.innerHTML = debugHTML;
        }
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 5000);
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

            if (error) throw error;

            this.users = users || [];
            this.renderUsers();
        } catch (error) {
            this.showError('Error al cargar los usuarios');
        }
    }

    async loadAddons() {
        try {
            const { data: addons, error } = await window.supabase
                .from('addons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.addons = addons || [];
            this.renderAddons();
        } catch (error) {
            this.showError('Error al cargar los addons');
        }
    }

    renderUsers() {
        const tableBody = document.getElementById('usersTableBody');
        const searchTerm = document.getElementById('searchUsers').value.toLowerCase();
        
        let filteredUsers = this.users;
        if (searchTerm) {
            filteredUsers = this.users.filter(user => 
                user.username.toLowerCase().includes(searchTerm) ||
                (user.email && user.email.toLowerCase().includes(searchTerm)) ||
                user.id.toLowerCase().includes(searchTerm)
            );
        }

        const totalPages = Math.ceil(filteredUsers.length / this.itemsPerPage);
        const startIndex = (this.currentUsersPage - 1) * this.itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + this.itemsPerPage);

        tableBody.innerHTML = paginatedUsers.map(user => `
            <tr>
                <td>${user.id.substring(0, 8)}...</td>
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
                            <button class="action-btn btn-ban" onclick="adminPanel.openBanModal('${user.id}')" title="Banear usuario">
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
                addon.title.toLowerCase().includes(searchTerm) ||
                (addon.description && addon.description.toLowerCase().includes(searchTerm)) ||
                (addon.creator && addon.creator.toLowerCase().includes(searchTerm))
            );
        }

        const totalPages = Math.ceil(filteredAddons.length / this.itemsPerPage);
        const startIndex = (this.currentAddonsPage - 1) * this.itemsPerPage;
        const paginatedAddons = filteredAddons.slice(startIndex, startIndex + this.itemsPerPage);

        tableBody.innerHTML = paginatedAddons.map(addon => `
            <tr>
                <td>${addon.id.substring(0, 8)}...</td>
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
                        <button class="action-btn btn-delete" onclick="adminPanel.openDeleteAddonModal('${addon.id}')" title="Eliminar addon">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
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

        document.getElementById('closeBanModal').addEventListener('click', () => this.closeBanModal());
        document.getElementById('cancelBan').addEventListener('click', () => this.closeBanModal());
        document.getElementById('confirmBan').addEventListener('click', () => this.banUser());

        document.getElementById('closeDeleteAddonModal').addEventListener('click', () => this.closeDeleteAddonModal());
        document.getElementById('cancelDeleteAddon').addEventListener('click', () => this.closeDeleteAddonModal());
        document.getElementById('confirmDeleteAddon').addEventListener('click', () => this.deleteAddon());
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    }

    openBanModal(userId) {
        this.selectedUserId = userId;
        const user = this.users.find(u => u.id === userId);
        document.getElementById('banModalTitle').textContent = `Banear a ${user.username}`;
        document.getElementById('banModal').classList.add('active');
    }

    closeBanModal() {
        document.getElementById('banModal').classList.remove('active');
        this.selectedUserId = null;
        document.getElementById('banReason').value = '';
        document.getElementById('banDuration').value = '1';
    }

    async banUser() {
        if (!this.selectedUserId) return;

        const reason = document.getElementById('banReason').value.trim();
        const duration = document.getElementById('banDuration').value;

        if (!reason) {
            this.showError('Por favor, proporciona un motivo para el baneo');
            return;
        }

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
            this.closeBanModal();
            await this.loadUsers();
            this.updateStats();
        } catch (error) {
            this.showError('Error al banear el usuario');
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
            this.showError('Error al desbanear el usuario');
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
            this.showError('Error al hacer administrador');
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
            this.showError('Error al remover administrador');
        }
    }

    async deleteUser(userId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción eliminará todos sus addons y no se puede deshacer.')) return;

        try {
            const { error: addonsError } = await window.supabase
                .from('addons')
                .delete()
                .eq('user_id', userId);

            if (addonsError) throw addonsError;

            const { error } = await window.supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            this.showSuccess('Usuario eliminado correctamente');
            await this.loadData();
            this.updateStats();
        } catch (error) {
            this.showError('Error al eliminar el usuario');
        }
    }

    async blockAddon(addonId) {
        try {
            const { error } = await window.supabase
                .from('addons')
                .update({ is_blocked: true })
                .eq('id', addonId);

            if (error) throw error;

            this.showSuccess('Addon bloqueado correctamente');
            await this.loadAddons();
        } catch (error) {
            this.showError('Error al bloquear el addon');
        }
    }

    async unblockAddon(addonId) {
        try {
            const { error } = await window.supabase
                .from('addons')
                .update({ is_blocked: false })
                .eq('id', addonId);

            if (error) throw error;

            this.showSuccess('Addon desbloqueado correctamente');
            await this.loadAddons();
        } catch (error) {
            this.showError('Error al desbloquear el addon');
        }
    }

    openDeleteAddonModal(addonId) {
        this.selectedAddonId = addonId;
        document.getElementById('deleteAddonModal').classList.add('active');
    }

    closeDeleteAddonModal() {
        document.getElementById('deleteAddonModal').classList.remove('active');
        this.selectedAddonId = null;
        document.getElementById('deleteReason').value = '';
    }

    async deleteAddon() {
        if (!this.selectedAddonId) return;

        const reason = document.getElementById('deleteReason').value.trim();

        if (!reason) {
            this.showError('Por favor, proporciona un motivo para la eliminación');
            return;
        }

        try {
            const { error } = await window.supabase
                .from('addons')
                .delete()
                .eq('id', this.selectedAddonId);

            if (error) throw error;

            this.showSuccess('Addon eliminado correctamente');
            this.closeDeleteAddonModal();
            await this.loadAddons();
            this.updateStats();
        } catch (error) {
            this.showError('Error al eliminar el addon');
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
