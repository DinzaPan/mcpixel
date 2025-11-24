let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBannerBtn = document.getElementById('installBannerBtn');
const installCancelBtn = document.getElementById('installCancelBtn');
const installAppBtn = document.getElementById('installAppBtn');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registrado con éxito: ', registration.scope);
            })
            .catch(function(error) {
                console.log('Error registrando ServiceWorker: ', error);
            });
    });
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
