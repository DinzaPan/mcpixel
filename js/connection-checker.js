// Sistema de verificación de conexión con Supabase
class ConnectionChecker {
    constructor() {
        this.notification = null;
        this.lastStatus = null;
        this.checkInterval = null;
        this.init();
    }

    init() {
        this.createNotificationElement();
        // Esperar a que Supabase esté listo
        this.waitForSupabase().then(() => {
            this.startChecking();
        }).catch(error => {
            console.error('Supabase no disponible:', error);
            this.showError();
        });
    }

    waitForSupabase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkSupabase = () => {
                attempts++;
                if (typeof window.supabase !== 'undefined' && window.supabase) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Supabase no se cargó después de ' + maxAttempts + ' intentos'));
                } else {
                    setTimeout(checkSupabase, 500);
                }
            };
            
            checkSupabase();
        });
    }

    createNotificationElement() {
        if (!document.getElementById('connectionNotification')) {
            this.notification = document.createElement('div');
            this.notification.id = 'connectionNotification';
            this.notification.className = 'connection-notification';
            this.notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-icon"></div>
                    <div class="notification-message"></div>
                </div>
            `;
            document.body.appendChild(this.notification);
        } else {
            this.notification = document.getElementById('connectionNotification');
        }
    }

    async checkConnection() {
        try {
            if (!window.supabase) {
                throw new Error('Supabase no inicializado');
            }

            // Intentar una consulta simple
            const { error } = await window.supabase
                .from('profiles')
                .select('id')
                .limit(1);

            if (!error) {
                this.showSuccess();
            } else {
                throw error;
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            this.showError();
        }
    }

    showSuccess() {
        if (this.lastStatus === 'connected') return;
        
        this.lastStatus = 'connected';
        this.notification.className = 'connection-notification success show';
        this.notification.querySelector('.notification-icon').innerHTML = '<i class="fas fa-check-circle"></i>';
        this.notification.querySelector('.notification-message').textContent = 'Servidor Conectado';
        
        setTimeout(() => {
            this.hideNotification();
        }, 3000);
    }

    showError() {
        if (this.lastStatus === 'error') return;
        
        this.lastStatus = 'error';
        this.notification.className = 'connection-notification error show';
        this.notification.querySelector('.notification-icon').innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        this.notification.querySelector('.notification-message').textContent = 'No se pudo conectar con el servidor';
    }

    hideNotification() {
        this.notification.classList.remove('show');
    }

    startChecking() {
        this.checkConnection();
        
        this.checkInterval = setInterval(() => {
            this.checkConnection();
        }, 30000);

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkConnection();
            }
        });

        window.addEventListener('online', () => {
            this.checkConnection();
        });

        window.addEventListener('offline', () => {
            this.showError();
        });
    }

    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
}

// Inicializar cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.connectionChecker = new ConnectionChecker();
    }, 1000);
});