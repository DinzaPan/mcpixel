let allAddons = [];

// Inicializar página principal
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    await loadAddons();
    setupMenu();
    setupSearch();
    createParticles();
});

// Crear partículas de fondo
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const left = Math.random() * 100;
        const size = Math.random() * 3 + 1;
        const opacity = Math.random() * 0.3 + 0.1;
        const animationDuration = Math.random() * 20 + 10;
        
        particle.style.left = `${left}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = opacity;
        particle.style.animationDuration = `${animationDuration}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Verificar autenticación y actualizar UI
async function checkAuth() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        // Aquí puedes agregar lógica de autenticación si es necesario
    } catch (error) {
        console.error('Error verificando autenticación:', error);
    }
}

// Cargar addons
async function loadAddons() {
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

        allAddons = addons || [];
        renderAddons(allAddons);
    } catch (error) {
        console.error('Error cargando addons:', error);
        showNoAddons();
    }
}

// Renderizar addons
function renderAddons(addons) {
    const container = document.getElementById('cards-container');
    if (!container) return;

    container.innerHTML = '';

    if (addons.length === 0) {
        showNoAddons();
        return;
    }

    addons.forEach((addon, index) => {
        const isVerified = addon.profiles?.is_verified || false;
        const creatorName = addon.profiles?.username || addon.creator || 'Anónimo';
        const avatarUrl = addon.profiles?.avatar_url || 'img/default-avatar.png';
        
        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <div class="card-cover" style="background-image: url('${addon.image || 'img/default-addon.jpg'}')"></div>
            <div class="card-content">
                <h3 class="card-title">${addon.title}</h3>
                <p class="card-description">${addon.description || 'Sin descripción disponible.'}</p>
                <div class="card-details">
                    <div class="creator">
                        <div class="creator-avatar">
                            <img src="${avatarUrl}" alt="${creatorName}" class="avatar-img">
                        </div>
                        <div class="creator-info">
                            <span class="creator-name">${creatorName}</span>
                            ${isVerified ? `
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="verified-user-icon" width="16" height="16">
                                    <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                                </svg>
                            ` : ''}
                        </div>
                    </div>
                    <div class="version">
                        <i class="fas fa-code-branch"></i>
                        v${addon.version || '1.0.0'}
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            // Redirigir a view.html en la carpeta sc con el ID del addon
            window.location.href = `sc/view.html?id=${addon.id}`;
        });

        container.appendChild(card);
    });
}

// Mostrar mensaje sin addons
function showNoAddons() {
    const container = document.getElementById('cards-container');
    container.innerHTML = `
        <div class="no-results">
            <div class="no-results-icon">
                <i class="fas fa-cube"></i>
            </div>
            <h3>No hay addons disponibles</h3>
            <p>Sé el primero en publicar un addon.</p>
        </div>
    `;
}

// Configurar búsqueda
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            renderAddons(allAddons);
            return;
        }

        const filtered = allAddons.filter(addon => 
            addon.title?.toLowerCase().includes(searchTerm) ||
            addon.description?.toLowerCase().includes(searchTerm) ||
            addon.profiles?.username?.toLowerCase().includes(searchTerm)
        );

        renderAddons(filtered);
    });
}

// Configurar menú
function setupMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const floatingMenu = document.getElementById('floatingMenu');

    if (!menuToggle || !floatingMenu) return;

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menuToggle.classList.toggle('active');
        floatingMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        floatingMenu.classList.remove('active');
    });

    floatingMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}