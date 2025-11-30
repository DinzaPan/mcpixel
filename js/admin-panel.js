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
        if (this.currentUser && this.currentProfile.is_admin) {
            await this.loadData();
            this.setupEventListeners();
            this.updateStats();
            document.getElementById('loading').style.display = 'none';
            document.getElementById('adminContent').style.display = 'block';
        }
    }

    async checkAdminAccess() {
        try {
            const savedUser = localStorage.getItem('mcpixel_user');
            const savedProfile = localStorage.getItem('mcpixel_profile');
            
            if (!savedUser || !savedProfile) {
                this.showAccessDenied();
                return;
            }

            this.currentUser = JSON.parse(savedUser);
            this.currentProfile = JSON.parse(savedProfile);

            if (!this.currentProfile.is_admin) {
                this.showAccessDenied();
                return;
            }

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

        } catch (error) {
            console.error('Error verificando acceso de administrador:', error);
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

            if (error) throw error;

            this.users = users || [];
            this.renderUsers();
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            this.showError('Error al cargar los usuarios');
        }
    }

    async loadAddons() {
        try {
            const { data: addons, error } = await window.supabase
                .from('addons')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        is_verified,
                        avatar_url
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.addons = addons || [];
            this.renderAddons();
        } catch (error) {
            console.error('Error cargando addons:', error);
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
                user.email?.toLowerCase().includes(searchTerm) ||
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
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    ${!user.is_banned ? `
                        <button class="action-btn btn-ban" onclick="adminPanel.openBanModal('${user.id}')" title="Banear usuario">
                            <i class="fas fa-ban"></i>
                        </button>
                    ` : `
                        <button class="action-btn btn-unban" onclick="adminPanel.unbanUser('${user.id}')" title="Desbanear usuario">
                            <i class="fas fa-check-circle"></i>
                        </button>
                    `}
                    <button class="action-btn btn-delete" onclick="adminPanel.deleteUser('${user.id}')" title="Eliminar usuario">
                        <i class="fas fa-trash"></i>
                    </button>
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
                addon.description.toLowerCase().includes(searchTerm) ||
                addon.profiles?.username.toLowerCase().includes(searchTerm)
            );
        }

        const totalPages = Math.ceil(filteredAddons.length / this.itemsPerPage);
        const startIndex = (this.currentAddonsPage - 1) * this.itemsPerPage;
        const paginatedAddons = filteredAddons.slice(startIndex, startIndex + this.itemsPerPage);

        tableBody.innerHTML = paginatedAddons.map(addon => `
            <tr>
                <td>${addon.id.substring(0, 8)}...</td>
                <td>${addon.title}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${addon.profiles?.avatar_url || '../img/default-avatar.png'}" 
                             alt="${addon.profiles?.username}" 
                             style="width: 24px; height: 24px; border-radius: 50%;">
                        ${addon.profiles?.username || 'Anónimo'}
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
                    <button class="action-btn" onclick="window.open('../sc/view.html?id=${addon.id}', '_blank')" title="Ver addon">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!addon.is_blocked ? `
                        <button class="action-btn btn-ban" onclick="adminPanel.blockAddon('${addon.id}')" title="Bloquear addon">
                            <i class="fas fa-ban"></i>
                        </button>
                    ` : `
                        <button class="action-btn btn-unban" onclick="adminPanel.unblockAddon('${addon.id}')" title="Desbloquear addon">
                            <i class="fas fa-check-circle"></i>
                        </button>
                    `}
                    <button class="action-btn btn-delete" onclick="adminPanel.openDeleteAddonModal('${addon.id}')" title="Eliminar addon">
                        <i class="fas fa-trash"></i>
                    </button>
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
            console.error('Error baneando usuario:', error);
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
            console.error('Error desbaneando usuario:', error);
            this.showError('Error al desbanear el usuario');
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
            console.error('Error eliminando usuario:', error);
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
            console.error('Error bloqueando addon:', error);
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
            console.error('Error desbloqueando addon:', error);
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
            console.error('Error eliminando addon:', error);
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
