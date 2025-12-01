let allAddons = [];
let allNotifications = [];
let videoModalInitialized = false;

const downloadManager = {
    formatDownloadCount: function(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return count.toString();
    }
};

document.addEventListener('DOMContentLoaded', async function() {
  videoModalInitialized = true;
  
  await checkAuth();
  await loadAddons();
  await loadNotifications();
  setupMenu();
  setupSearch();
  createParticles();
  updateNotificationBadge();
  
  initializePushNotifications();
});

function initializePushNotifications() {
  setTimeout(() => {
    if (window.requestNotificationPermission) {
      window.requestNotificationPermission();
    }
  }, 3000);
}

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

async function checkAuth() {
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
  } catch (error) {
    console.error('Error verificando autenticación:', error);
  }
}

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
    const downloadCount = addon.downloads || 0;
    const formattedDownloadCount = downloadManager.formatDownloadCount(downloadCount);
    
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${index * 0.1}s`;
    card.innerHTML = `
      <div class="card-cover" style="background-image: url('${addon.image || 'img/default-addon.jpg'}')">
        <div class="download-badge">
          <i class="fas fa-download"></i>
          ${formattedDownloadCount}
        </div>
      </div>
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
      window.location.href = `sc/view.html?id=${addon.id}`;
    });

    container.appendChild(card);
  });
}

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

function deleteOldNotifications() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const savedNotifications = JSON.parse(localStorage.getItem('mcPixelNotifications') || '[]');
    const filteredNotifications = savedNotifications.filter(notification => {
      const notificationDate = new Date(notification.timestamp);
      return notificationDate >= thirtyDaysAgo;
    });
    
    if (filteredNotifications.length < savedNotifications.length) {
      saveNotifications(filteredNotifications);
    }
    
    return filteredNotifications;
  } catch (error) {
    console.error('Error eliminando notificaciones antiguas:', error);
    return [];
  }
}

function loadSavedNotifications() {
  try {
    const filteredNotifications = deleteOldNotifications();
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    
    filteredNotifications.forEach(notification => {
      notification.read = readNotifications.includes(notification.id);
    });
    
    return filteredNotifications;
  } catch (error) {
    console.error('Error cargando notificaciones guardadas:', error);
    return [];
  }
}

function saveNotifications(notifications) {
  try {
    localStorage.setItem('mcPixelNotifications', JSON.stringify(notifications));
    
    const readNotifications = notifications
      .filter(n => n.read)
      .map(n => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
  } catch (error) {
    console.error('Error guardando notificaciones:', error);
  }
}

function loadPreviousAddonsState() {
  try {
    return JSON.parse(localStorage.getItem('previousAddonsState') || '{}');
  } catch (error) {
    console.error('Error cargando estado anterior:', error);
    return {};
  }
}

function saveCurrentAddonsState(addons) {
  try {
    const currentState = {};
    addons.forEach(addon => {
      currentState[addon.id] = {
        title: addon.title,
        description: addon.description,
        version: addon.version,
        image: addon.image,
        updated_at: addon.updated_at,
        created_at: addon.created_at
      };
    });
    localStorage.setItem('previousAddonsState', JSON.stringify(currentState));
  } catch (error) {
    console.error('Error guardando estado actual:', error);
  }
}

async function loadNotifications() {
  try {
    const savedNotifications = loadSavedNotifications();
    
    const { data: addons, error } = await window.supabase
      .from('addons')
      .select(`
          id,
          title,
          description,
          version,
          image,
          updated_at,
          created_at,
          profiles:user_id (
              username,
              is_verified,
              avatar_url
          )
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const previousAddonsState = loadPreviousAddonsState();

    const newNotifications = detectChangesAndCreateNotifications(addons, previousAddonsState);

    newNotifications.forEach(notification => {
      if (window.sendPushNotification) {
        window.sendPushNotification(notification.title, notification.content, `/sc/view.html?id=${notification.addonId}`);
      }
    });

    allNotifications = mergeNotifications(savedNotifications, newNotifications);

    saveCurrentAddonsState(addons);

    saveNotifications(allNotifications);

    updateNotificationBadge();

  } catch (error) {
    console.error('Error cargando notificaciones:', error);
    allNotifications = loadSavedNotifications();
    updateNotificationBadge();
  }
}

function mergeNotifications(existing, newOnes) {
  const merged = [...existing];
  
  newOnes.forEach(newNotif => {
    const exists = existing.some(existingNotif => 
      existingNotif.id === newNotif.id
    );
    
    if (!exists) {
      merged.push(newNotif);
    }
  });
  
  return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function detectChangesAndCreateNotifications(currentAddons, previousAddonsState) {
  const notifications = [];
  
  const isFirstTime = Object.keys(previousAddonsState).length === 0;
  if (isFirstTime) {
    return notifications;
  }

  for (const addon of currentAddons) {
    const previousAddon = previousAddonsState[addon.id];
    
    if (!previousAddon) {
      notifications.push({
        id: `new-${addon.id}-${Date.now()}`,
        type: 'new',
        title: `Nuevo addon: ${addon.title}`,
        content: `${addon.profiles?.username || 'Un usuario'} ha publicado un nuevo addon.`,
        addonId: addon.id,
        addonTitle: addon.title,
        timestamp: addon.created_at,
        read: false
      });
      continue;
    }

    const onlyTimestampChanged = hasOnlyTimestampChanged(addon, previousAddon);
    
    if (onlyTimestampChanged) {
      console.log('Solo cambió el timestamp (probablemente por descargas), ignorando:', addon.title);
      continue;
    }

    if (addon.version !== previousAddon.version) {
      notifications.push({
        id: `version-${addon.id}-${Date.now()}`,
        type: 'version',
        title: `Nueva versión: ${addon.title} v${addon.version}`,
        content: `${addon.profiles?.username || 'El creador'} ha actualizado a la versión ${addon.version}.`,
        addonId: addon.id,
        addonTitle: addon.title,
        timestamp: addon.updated_at,
        read: false
      });
    }

    if (addon.title !== previousAddon.title) {
      notifications.push({
        id: `title-${addon.id}-${Date.now()}`,
        type: 'content',
        title: `Título actualizado: ${previousAddon.title} → ${addon.title}`,
        content: `${addon.profiles?.username || 'El creador'} ha cambiado el título del addon.`,
        addonId: addon.id,
        addonTitle: addon.title,
        timestamp: addon.updated_at,
        read: false
      });
    }

    if (addon.description !== previousAddon.description) {
      notifications.push({
        id: `desc-${addon.id}-${Date.now()}`,
        type: 'content',
        title: `Descripción actualizada: ${addon.title}`,
        content: `${addon.profiles?.username || 'El creador'} ha modificado la descripción del addon.`,
        addonId: addon.id,
        addonTitle: addon.title,
        timestamp: addon.updated_at,
        read: false
      });
    }

    if (addon.image !== previousAddon.image) {
      notifications.push({
        id: `image-${addon.id}-${Date.now()}`,
        type: 'content',
        title: `Imagen actualizada: ${addon.title}`,
        content: `${addon.profiles?.username || 'El creador'} ha cambiado la imagen del addon.`,
        addonId: addon.id,
        addonTitle: addon.title,
        timestamp: addon.updated_at,
        read: false
      });
    }

    if (addon.updated_at !== previousAddon.updated_at && 
      addon.title === previousAddon.title &&
      addon.description === previousAddon.description &&
      addon.version === previousAddon.version &&
      addon.image === previousAddon.image &&
      !onlyTimestampChanged) {
      
      notifications.push({
        id: `update-${addon.id}-${Date.now()}`,
        type: 'update',
        title: `Actualización: ${addon.title}`,
        content: `${addon.profiles?.username || 'El creador'} ha actualizado este addon.`,
        addonId: addon.id,
        addonTitle: addon.title,
        timestamp: addon.updated_at,
        read: false
      });
    }
  }

  return notifications;
}

function hasOnlyTimestampChanged(currentAddon, previousAddon) {
  const relevantFields = ['title', 'description', 'version', 'image'];
  const relevantFieldsUnchanged = relevantFields.every(field => 
    currentAddon[field] === previousAddon[field]
  );
  
  return relevantFieldsUnchanged && currentAddon.updated_at !== previousAddon.updated_at;
}

function updateNotificationBadge() {
  const notificationBadge = document.getElementById('notificationBadge');
  const unreadCount = allNotifications.filter(notification => !notification.read).length;
  
  if (notificationBadge) {
    if (unreadCount > 0) {
      notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      notificationBadge.style.display = 'flex';
    } else {
      notificationBadge.style.display = 'none';
    }
  }
}

async function refreshNotifications() {
  await loadNotifications();
}

setInterval(refreshNotifications, 2 * 60 * 1000);
