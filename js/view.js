const favoritesManager = {
    getFavorites: () => {
        const favorites = localStorage.getItem('favorites');
        return favorites ? JSON.parse(favorites) : [];
    },
    
    isFavorite: (addonId) => {
        const favorites = favoritesManager.getFavorites();
        return favorites.includes(addonId);
    },
    
    toggleFavorite: (addonId) => {
        const favorites = favoritesManager.getFavorites();
        const index = favorites.indexOf(addonId);
        
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(addonId);
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
        return true;
    }
};

const downloadManager = {
    lastDownloadTime: 0,
    downloadCooldown: 3000,
    
    canDownload: function(addonId) {
        const now = Date.now();
        const lastTime = this.lastDownloadTime;
        
        if (now - lastTime < this.downloadCooldown) {
            return false;
        }
        
        const addonLastDownload = parseInt(localStorage.getItem(`lastDownload_${addonId}`)) || 0;
        if (now - addonLastDownload < this.downloadCooldown) {
            return false;
        }
        
        return true;
    },
    
    recordDownload: async function(addonId) {
        const now = Date.now();
        this.lastDownloadTime = now;
        localStorage.setItem(`lastDownload_${addonId}`, now.toString());
        
        try {
            const { data: addon, error } = await window.supabase
                .from('addons')
                .select('downloads')
                .eq('id', addonId)
                .single();
            
            if (error) throw error;
            
            const newDownloadCount = (addon.downloads || 0) + 1;
            
            const { error: updateError } = await window.supabase
                .from('addons')
                .update({ 
                    downloads: newDownloadCount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', addonId);
            
            if (updateError) throw updateError;
            
            return newDownloadCount;
        } catch (error) {
            console.error('Error registrando descarga:', error);
            throw error;
        }
    },
    
    formatDownloadCount: function(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return count.toString();
    }
};

function generateSlug(text) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

function updateURLWithAddonName(addon) {
    const slug = generateSlug(addon.title);
    const prettyUrl = `${window.location.origin}/sc/view.html?id=${addon.id}&name=${slug}`;
    window.history.replaceState({}, '', prettyUrl);
    return prettyUrl;
}

function getAbsoluteImageUrl(imageUrl) {
    if (!imageUrl) {
        return `${window.location.origin}/img/default-addon.jpg`;
    }
    
    if (imageUrl.startsWith('http')) {
        return imageUrl;
    }
    
    if (imageUrl.startsWith('//')) {
        return `https:${imageUrl}`;
    }
    
    if (imageUrl.startsWith('/')) {
        return `${window.location.origin}${imageUrl}`;
    }
    
    return `${window.location.origin}/${imageUrl}`;
}

function updateMetaTags(addon) {
    const fullImageUrl = getAbsoluteImageUrl(addon.image);
    const currentUrl = `${window.location.origin}/sc/view.html?id=${addon.id}&name=${generateSlug(addon.title)}`;
    
    const truncatedDescription = addon.description 
        ? (addon.description.length > 150 
            ? addon.description.substring(0, 150) + '...' 
            : addon.description)
        : 'Descubre este increíble addon para Minecraft en MCPixel';

    document.title = `${addon.title} - MCPixel`;

    const metaTags = {
        'og:title': `${addon.title} - MCPixel`,
        'og:description': truncatedDescription,
        'og:image': fullImageUrl,
        'og:url': currentUrl,
        'og:type': 'website',
        'og:site_name': 'MCPixel',
        'twitter:card': 'summary_large_image',
        'twitter:title': `${addon.title} - MCPixel`,
        'twitter:description': truncatedDescription,
        'twitter:image': fullImageUrl,
        'twitter:site': '@MCPixel',
        'description': truncatedDescription
    };

    Object.keys(metaTags).forEach(key => {
        const selector = key.startsWith('og:') ? `meta[property="${key}"]` : `meta[name="${key}"]`;
        let element = document.querySelector(selector);
        
        if (!element) {
            element = document.createElement('meta');
            if (key.startsWith('og:')) {
                element.setAttribute('property', key);
            } else {
                element.setAttribute('name', key);
            }
            document.head.appendChild(element);
        }
        
        element.setAttribute('content', metaTags[key]);
    });

    const linkCanonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    linkCanonical.setAttribute('href', currentUrl);
    if (!document.querySelector('link[rel="canonical"]')) {
        document.head.appendChild(linkCanonical);
    }
}

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const left = Math.random() * 100;
        const size = Math.random() * 3 + 1;
        const opacity = Math.random() * 0.3 + 0.1;
        const animationDuration = Math.random() * 20 + 10;
        
        particle.style.cssText = `
            position: fixed;
            left: ${left}%;
            top: -20px;
            width: ${size}px;
            height: ${size}px;
            background: var(--accent);
            border-radius: 50%;
            opacity: ${opacity};
            animation: float ${animationDuration}s linear infinite;
            z-index: -1;
        `;
        
        particlesContainer.appendChild(particle);
    }
}

async function loadAddonDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const addonId = urlParams.get('id');
    
    if (!addonId) {
        showError('ID de addon no especificado');
        return;
    }

    try {
        const { data: addon, error } = await window.supabase
            .from('addons')
            .select(`
                *,
                profiles:user_id (
                    username,
                    is_verified
                )
            `)
            .eq('id', addonId)
            .single();

        if (error) throw error;
        if (!addon) throw new Error('Addon no encontrado');

        updateURLWithAddonName(addon);
        updateMetaTags(addon);
        renderAddonDetails(addon);
    } catch (error) {
        console.error('Error cargando addon:', error);
        showError('Addon no encontrado o ha sido removido');
    }
}

function renderAddonDetails(addon) {
    const container = document.getElementById('addon-details');
    if (!container) return;

    const isVerified = addon.profiles?.is_verified || false;
    const creatorName = addon.profiles?.username || addon.creator || 'Anónimo';
    
    const tags = addon.tags || [];
    const tagsHtml = tags.map(tag => `
        <div class="tag">
            <i class="fas fa-tag"></i>
            ${tag}
        </div>
    `).join('');
    
    const isFav = favoritesManager.isFavorite(addon.id);
    const downloadCount = addon.downloads || 0;
    const formattedDownloadCount = downloadManager.formatDownloadCount(downloadCount);
    
    const displayImageUrl = addon.image || '../img/default-addon.jpg';
    
    container.innerHTML = `
        <div class="detail-cover" style="background-image: url('${displayImageUrl}')"></div>
        
        <div class="detail-header">
            <div class="detail-title-section">
                <h1 class="detail-title">${addon.title}</h1>
                <button class="favorite-btn-detail" data-id="${addon.id}">
                    <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
            
            <div class="detail-meta">
                <div class="creator-by">
                    <i class="fas fa-user"></i>
                    by ${creatorName}
                    ${isVerified ? `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="verified-user-icon" width="18" height="18">
                            <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                        </svg>
                    ` : ''}
                </div>
                <div class="version-info">
                    <i class="fas fa-download"></i>
                    ${formattedDownloadCount} descargas
                </div>
            </div>
            
            ${tags.length > 0 ? `
                <div class="tags-container">
                    ${tagsHtml}
                </div>
            ` : ''}
        </div>
        
        <div class="content-section">
            <h3 class="section-title">
                <i class="fas fa-file-alt"></i>
                Descripción
            </h3>
            <p class="full-description">${addon.description || 'No hay descripción disponible.'}</p>
        </div>
        
        ${addon.download_url ? `
            <div class="download-section">
                <button class="download-btn" data-id="${addon.id}" data-url="${addon.download_url}">
                    <i class="fas fa-download"></i>
                    Descargar Addon
                </button>
                <div class="file-info">
                    <div class="file-info-item">
                        <i class="fas fa-code-branch"></i>
                        <span>Versión ${addon.version || '1.0.0'}</span>
                    </div>
                    <div class="file-info-item">
                        <i class="fas fa-calendar"></i>
                        <span>Publicado: ${formatDate(addon.created_at)}</span>
                    </div>
                </div>
            </div>
        ` : ''}
    `;
    
    setupFavoriteButton();
    setupDownloadButton();
}

function setupDownloadButton() {
    const downloadBtn = document.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const addonId = parseInt(this.dataset.id);
            const downloadUrl = this.dataset.url;
            
            if (!downloadManager.canDownload(addonId)) {
                return;
            }
            
            try {
                const newDownloadCount = await downloadManager.recordDownload(addonId);
                
                updateDownloadCount(addonId, newDownloadCount);
                
                window.open(downloadUrl, '_blank');
                
            } catch (error) {
                console.error('Error en la descarga:', error);
            }
        });
    }
}

function updateDownloadCount(addonId, newDownloadCount) {
    const formattedDownloadCount = downloadManager.formatDownloadCount(newDownloadCount);
    
    const versionInfo = document.querySelector('.version-info');
    if (versionInfo) {
        versionInfo.innerHTML = `<i class="fas fa-download"></i> ${formattedDownloadCount} descargas`;
    }
}

function setupFavoriteButton() {
    const favoriteBtn = document.querySelector('.favorite-btn-detail');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const addonId = parseInt(this.dataset.id);
            
            const success = favoritesManager.toggleFavorite(addonId);
            if (success) {
                updateFavoriteButton(this, favoritesManager.isFavorite(addonId));
            }
        });
    }
}

function updateFavoriteButton(btn, isFavorite) {
    if (isFavorite) {
        btn.innerHTML = '<i class="fas fa-heart"></i>';
        btn.style.color = 'var(--error-color)';
        btn.style.transform = 'scale(1.1)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 200);
        
        showNotification('Añadido a favoritos', 'success');
    } else {
        btn.innerHTML = '<i class="far fa-heart"></i>';
        btn.style.color = 'var(--text-secondary)';
        showNotification('Eliminado de favoritos', 'info');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? 'var(--error-color)' : 
                   type === 'warning' ? '#f59e0b' : 
                   type === 'success' ? 'var(--verified-color)' : 'var(--accent)';
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--card-bg);
        color: var(--text-primary);
        padding: 15px 20px;
        border-radius: 10px;
        border: 1px solid var(--border-color);
        border-left: 4px solid ${bgColor};
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.3s ease;
        transform: translateX(100%);
        opacity: 0;
        max-width: 300px;
    `;
    
    const icon = type === 'error' ? 'fa-exclamation-circle' :
                type === 'warning' ? 'fa-exclamation-triangle' :
                type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}" style="color: ${bgColor};"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function showError(message) {
    const container = document.getElementById('addon-details');
    container.innerHTML = `
        <div class="no-results">
            <div class="no-results-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>${message}</h3>
            <p>El addon que buscas no existe o ha sido removido.</p>
            <button class="back-btn" onclick="window.history.back()" style="margin-top: 20px;">
                <i class="fas fa-arrow-left"></i>
                Volver atrás
            </button>
        </div>
    `;
}

function formatDate(dateString) {
    if (!dateString) return 'Fecha desconocida';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    loadAddonDetails();
    
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.history.back();
        });
    }
});
