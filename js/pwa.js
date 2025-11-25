let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBannerBtn = document.getElementById('installBannerBtn');
const installCancelBtn = document.getElementById('installCancelBtn');
const installAppBtn = document.getElementById('installAppBtn');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async function() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registrado con éxito: ', registration.scope);
      
      setTimeout(() => {
        requestNotificationPermission();
      }, 2000);
      
    } catch (error) {
      console.log('Error registrando ServiceWorker: ', error);
    }
  });
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return;
  }

  if (Notification.permission === 'granted') {
    console.log('Permisos de notificación ya concedidos');
    await subscribeToPush();
    return;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Permisos de notificación concedidos');
        await subscribeToPush();
      } else {
        console.log('Permisos de notificación denegados');
      }
    } catch (error) {
      console.error('Error solicitando permisos:', error);
    }
  }
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    
    const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('Subscripción a push notifications exitosa');
    
    localStorage.setItem('pushSubscription', JSON.stringify(subscription));
    
  } catch (error) {
    console.error('Error en subscripción push:', error);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendPushNotification(title, body, url = '/') {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      body: body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: { url: url },
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Cerrar' }
      ]
    });
    
    console.log('Notificación enviada:', title);
  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  if (installAppBtn) {
    installAppBtn.style.display = 'flex';
  }
  
  if (!sessionStorage.getItem('installBannerShown')) {
    setTimeout(() => {
      showInstallBanner();
    }, 5000);
  }
});

function showInstallBanner() {
  if (installBanner && !isAppInstalled()) {
    installBanner.style.display = 'block';
    sessionStorage.setItem('installBannerShown', 'true');
  }
}

function hideInstallBanner() {
  if (installBanner) {
    installBanner.style.display = 'none';
  }
}

function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

async function installApp() {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    console.log('Usuario aceptó instalar la app');
    hideInstallBanner();
    if (installAppBtn) {
      installAppBtn.style.display = 'none';
    }
  } else {
    console.log('Usuario rechazó instalar la app');
  }
  
  deferredPrompt = null;
}

if (installBannerBtn) {
  installBannerBtn.addEventListener('click', installApp);
}

if (installCancelBtn) {
  installCancelBtn.addEventListener('click', hideInstallBanner);
}

if (installAppBtn) {
  installAppBtn.addEventListener('click', (e) => {
    e.preventDefault();
    installApp();
  });
}

window.addEventListener('appinstalled', () => {
  console.log('App instalada exitosamente');
  hideInstallBanner();
  if (installAppBtn) {
    installAppBtn.style.display = 'none';
  }
  deferredPrompt = null;
});

if (isAppInstalled() && installAppBtn) {
  installAppBtn.style.display = 'none';
}

window.sendPushNotification = sendPushNotification;
window.requestNotificationPermission = requestNotificationPermission;
