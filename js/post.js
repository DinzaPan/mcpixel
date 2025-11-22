let userAddons = [];
let currentUser = null;
let currentProfile = null;
let editingAddonId = null;
let currentTags = [];

document.addEventListener('DOMContentLoaded', async function() {
    currentUser = await getCurrentUser();
    if (!currentUser) {
        window.location.href = 'security.html';
        return;
    }

    currentProfile = await getCurrentProfile();
    if (!currentProfile) {
        window.location.href = 'security.html';
        return;
    }

    await loadUserData();
    setupMenu();
    setupEventListeners();
    setupModal();
    setupProfileModal();
});

async function loadUserData() {
    document.getElementById('userName').textContent = currentProfile.username;
    
    const userAvatar = document.getElementById('userAvatar');
    if (currentProfile.avatar_url) {
        userAvatar.innerHTML = `<img src="${currentProfile.avatar_url}" alt="${currentProfile.username}" class="avatar-img">`;
    } else {
        userAvatar.style.background = 'var(--gradient)';
        userAvatar.style.display = 'flex';
        userAvatar.style.alignItems = 'center';
        userAvatar.style.justifyContent = 'center';
        userAvatar.innerHTML = '<i class="fas fa-user" style="color: white; font-size: 1.5rem;"></i>';
    }
    
    const userStatus = document.getElementById('userStatus');
    if (currentProfile.is_verified) {
        userStatus.innerHTML = '<i class="fas fa-check-circle"></i> Verificado';
        userStatus.style.color = 'var(--verified-color)';
    } else {
        userStatus.innerHTML = '<i class="fas fa-user"></i> Usuario';
        userStatus.style.color = 'var(--text-secondary)';
    }

    try {
        const { data: addons, error } = await window.supabase
            .from('addons')
            .select('*')
            .eq('user_id', currentProfile.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        userAddons = addons || [];
        renderUserAddons();
        updateStats();
        
    } catch (error) {
        console.error('Error cargando addons:', error);
        userAddons = [];
        renderUserAddons();
        updateStats();
    }
}

function renderUserAddons() {
    const container = document.getElementById('myAddonsContainer');
    if (!container) return;
    
    container.innerHTML = '';

    if (userAddons.length === 0) {
        container.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1;">
                <div class="no-results-icon">
                    <i class="fas fa-cube"></i>
                </div>
                <h3>No tienes addons publicados</h3>
                <p>Crea tu primer addon usando el botón flotante.</p>
            </div>
        `;
        return;
    }

    userAddons.forEach((addon, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        const versionDisplay = currentProfile.is_verified ? `
            <div class="version">
                <i class="fas fa-code-branch"></i>
                v${addon.version}
            </div>
        ` : '';

        // Crear etiquetas HTML si existen
        const tagsHTML = addon.tags && addon.tags.length > 0 ? 
            `<div class="tags-container">${addon.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : '';

        card.innerHTML = `
            <div class="card-cover" style="background-image: url('${addon.image || 'img/default-addon.jpg'}')">
                <div class="card-actions">
                    <span class="downloads-count">
                        <i class="fas fa-download"></i>
                        ${addon.downloads || 0}
                    </span>
                </div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${addon.title}</h3>
                <p class="card-description">${addon.description}</p>
                ${tagsHTML}
                <div class="card-details">
                    <div class="creator">
                        <div class="creator-avatar">
                            ${currentProfile.avatar_url ? 
                                `<img src="${currentProfile.avatar_url}" alt="${currentProfile.username}" class="avatar-img">` : 
                                `<i class="fas fa-user"></i>`
                            }
                        </div>
                        <div class="creator-info">
                            <span class="creator-name">${currentProfile.username}</span>
                            ${currentProfile.is_verified ? `
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="verified-user-icon" width="16" height="16">
                                    <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                                </svg>
                            ` : ''}
                        </div>
                    </div>
                    ${versionDisplay}
                </div>
                <div class="addon-actions">
                    <button class="action-btn edit-btn" data-id="${addon.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="action-btn delete-btn" data-id="${addon.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    // Agregar event listeners para los botones de editar y eliminar
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const addonId = btn.getAttribute('data-id');
            editAddon(addonId);
        });
    });
    
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const addonId = btn.getAttribute('data-id');
            deleteAddon(addonId);
        });
    });
}

function updateStats() {
    const totalAddons = userAddons.length;
    document.getElementById('addonsCount').textContent = totalAddons;
}

function setupEventListeners() {
    const fab = document.getElementById('fab');
    const logoutBtn = document.getElementById('logoutBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    
    if (fab) {
        fab.addEventListener('click', () => {
            openModal();
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const { error } = await logout();
            if (!error) {
                window.location.href = 'index.html';
            }
        });
    }

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            openProfileModal();
        });
    }
}

function setupModal() {
    const modal = document.getElementById('addonModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const addonForm = document.getElementById('addonForm');
    const addonImage = document.getElementById('addonImage');
    const addonTags = document.getElementById('addonTags');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    if (addonImage) {
        addonImage.addEventListener('input', function() {
            const preview = document.getElementById('imagePreview');
            if (this.value) {
                preview.style.backgroundImage = `url('${this.value}')`;
                preview.classList.add('active');
            } else {
                preview.classList.remove('active');
            }
        });
    }

    if (addonTags) {
        addonTags.addEventListener('keypress', function(e) {
            if (e.key === ',' || e.key === 'Enter') {
                e.preventDefault();
                const tag = this.value.trim();
                if (tag && !currentTags.includes(tag)) {
                    currentTags.push(tag);
                    updateTagsDisplay();
                }
                this.value = '';
            }
        });
    }

    if (addonForm) {
        addonForm.addEventListener('submit', handleAddonSubmit);
    }
}

function setupProfileModal() {
    const modal = document.getElementById('profileModal');
    const cancelBtn = document.getElementById('cancelProfileBtn');
    const profileForm = document.getElementById('profileForm');
    const profileAvatar = document.getElementById('profileAvatar');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeProfileModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProfileModal();
            }
        });
    }

    if (profileAvatar) {
        profileAvatar.addEventListener('input', function() {
            const preview = document.getElementById('avatarPreview');
            const errorElement = document.getElementById('avatarError');
            
            if (this.value) {
                // Validar formato de imagen (excluye PNG)
                const isValidImageUrl = validateImageUrl(this.value);
                
                if (isValidImageUrl) {
                    preview.style.backgroundImage = `url('${this.value}')`;
                    preview.classList.add('active');
                    errorElement.classList.remove('show');
                } else {
                    preview.classList.remove('active');
                    errorElement.classList.add('show');
                }
            } else {
                preview.classList.remove('active');
                errorElement.classList.remove('show');
            }
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
}

function validateImageUrl(url) {
    // Expresión regular para validar URLs de imágenes (excluye PNG)
    const imagePattern = /\.(jpg|jpeg|gif|webp)(\?.*)?$/i;
    return imagePattern.test(url);
}

function openProfileModal() {
    const modal = document.getElementById('profileModal');
    const profileAvatar = document.getElementById('profileAvatar');
    const preview = document.getElementById('avatarPreview');
    
    // Llenar el formulario con los datos actuales
    profileAvatar.value = currentProfile.avatar_url || '';
    
    // Mostrar preview si existe avatar
    if (currentProfile.avatar_url) {
        preview.style.backgroundImage = `url('${currentProfile.avatar_url}')`;
        preview.classList.add('active');
    } else {
        preview.classList.remove('active');
    }
    
    // Ocultar mensaje de error
    document.getElementById('avatarError').classList.remove('show');
    
    modal.style.display = 'flex';
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.style.display = 'none';
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const profileAvatar = document.getElementById('profileAvatar').value.trim();
    const errorElement = document.getElementById('avatarError');
    
    // Validar URL de imagen si se proporciona (excluye PNG)
    if (profileAvatar && !validateImageUrl(profileAvatar)) {
        errorElement.classList.add('show');
        return;
    }
    
    try {
        const { error } = await window.supabase
            .from('profiles')
            .update({
                avatar_url: profileAvatar || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentProfile.id);
        
        if (error) throw error;
        
        // Actualizar perfil local
        currentProfile.avatar_url = profileAvatar || null;
        
        // Actualizar sesión
        const savedProfile = localStorage.getItem('mcpixel_profile');
        if (savedProfile) {
            const profileData = JSON.parse(savedProfile);
            profileData.avatar_url = profileAvatar || null;
            localStorage.setItem('mcpixel_profile', JSON.stringify(profileData));
        }
        
        alert('Perfil actualizado exitosamente');
        closeProfileModal();
        await loadUserData(); // Recargar datos para mostrar cambios
        
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        alert('Error al actualizar el perfil: ' + error.message);
    }
}

function openModal(addon = null) {
    const modal = document.getElementById('addonModal');
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');

    if (addon) {
        modalTitle.textContent = 'Editar Addon';
        submitBtn.textContent = 'Actualizar';
        editingAddonId = addon.id;
        
        document.getElementById('addonImage').value = addon.image || '';
        document.getElementById('addonTitle').value = addon.title;
        document.getElementById('addonDescription').value = addon.description;
        document.getElementById('addonVersion').value = addon.version;
        document.getElementById('addonDownloadUrl').value = addon.download_url || '';
        
        currentTags = addon.tags || [];
        updateTagsDisplay();
        
        const preview = document.getElementById('imagePreview');
        if (addon.image) {
            preview.style.backgroundImage = `url('${addon.image}')`;
            preview.classList.add('active');
        }
        
    } else {
        modalTitle.textContent = 'Crear Nuevo Addon';
        submitBtn.textContent = 'Publicar';
        editingAddonId = null;
        
        document.getElementById('addonForm').reset();
        currentTags = [];
        updateTagsDisplay();
        document.getElementById('imagePreview').classList.remove('active');
    }
    
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('addonModal');
    modal.style.display = 'none';
    editingAddonId = null;
}

function updateTagsDisplay() {
    const container = document.getElementById('tagsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    currentTags.forEach((tag, index) => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tag}
            <span class="tag-remove" data-index="${index}">×</span>
        `;
        container.appendChild(tagElement);
    });
    
    container.querySelectorAll('.tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            currentTags.splice(index, 1);
            updateTagsDisplay();
        });
    });
}

async function handleAddonSubmit(e) {
    e.preventDefault();
    
    const formData = {
        image: document.getElementById('addonImage').value,
        title: document.getElementById('addonTitle').value,
        description: document.getElementById('addonDescription').value,
        version: document.getElementById('addonVersion').value,
        download_url: document.getElementById('addonDownloadUrl').value,
        tags: currentTags,
        creator: currentProfile.username
    };
    
    if (!formData.title || !formData.description || !formData.version || !formData.download_url) {
        alert('Por favor, completa todos los campos obligatorios.');
        return;
    }
    
    try {
        if (editingAddonId) {
            const { error } = await window.supabase
                .from('addons')
                .update({
                    image: formData.image,
                    title: formData.title,
                    description: formData.description,
                    version: formData.version,
                    download_url: formData.download_url,
                    tags: formData.tags,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingAddonId)
                .eq('user_id', currentProfile.id);
            
            if (error) throw error;
            
            alert('Addon actualizado exitosamente');
            
        } else {
            const { error } = await window.supabase
                .from('addons')
                .insert([
                    {
                        user_id: currentProfile.id,
                        creator: formData.creator,
                        image: formData.image,
                        title: formData.title,
                        description: formData.description,
                        version: formData.version,
                        download_url: formData.download_url,
                        tags: formData.tags,
                        downloads: 0
                    }
                ]);
            
            if (error) throw error;
            
            alert('Addon publicado exitosamente');
        }
        
        closeModal();
        await loadUserData();
        
    } catch (error) {
        console.error('Error al guardar el addon:', error);
        alert('Error al guardar el addon: ' + error.message);
    }
}

function editAddon(addonId) {
    const addon = userAddons.find(a => a.id == addonId);
    if (addon) {
        openModal(addon);
    }
}

async function deleteAddon(addonId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este addon? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const { error } = await window.supabase
            .from('addons')
            .delete()
            .eq('id', addonId)
            .eq('user_id', currentProfile.id);
        
        if (error) throw error;

        userAddons = userAddons.filter(addon => addon.id != addonId);
        renderUserAddons();
        updateStats();
        
        alert('Addon eliminado exitosamente');
        
    } catch (error) {
        console.error('Error al eliminar el addon:', error);
        alert('Error al eliminar el addon: ' + error.message);
    }
}

function setupMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const floatingMenu = document.getElementById('floatingMenu');

    if (!menuToggle || !floatingMenu) return;

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        floatingMenu.classList.toggle('active');
        
        const icon = menuToggle.querySelector('i');
        if (floatingMenu.classList.contains('active')) {
            icon.className = 'fas fa-times';
        } else {
            icon.className = 'fas fa-bars';
        }
    });

    document.addEventListener('click', (e) => {
        if (!floatingMenu.contains(e.target) && e.target !== menuToggle) {
            floatingMenu.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            icon.className = 'fas fa-bars';
        }
    });

    floatingMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}
