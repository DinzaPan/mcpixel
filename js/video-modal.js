class VideoModal {
    constructor() {
        this.modal = document.getElementById('videoModal');
        this.video = document.getElementById('diciembreVideo');
        this.closeBtn = document.getElementById('closeVideoModal');
        this.replayBtn = document.getElementById('replayVideo');
        this.continueBtn = document.getElementById('continueWithoutVideo');
        this.hasBeenClosed = localStorage.getItem('videoModalClosed') === 'true';
        
        this.init();
    }
    
    init() {
        if (this.hasBeenClosed) {
            this.hideModal();
            return;
        }
        
        setTimeout(() => {
            this.showModal();
            this.setupEventListeners();
            this.playVideo();
        }, 1000);
    }
    
    showModal() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.pauseVideo();
        }
    }
    
    playVideo() {
        if (this.video) {
            this.video.play().catch(error => {
                console.warn('Video autoplay prevented:', error);
            });
        }
    }
    
    pauseVideo() {
        if (this.video) {
            this.video.pause();
            this.video.currentTime = 0;
        }
    }
    
    replayVideo() {
        if (this.video) {
            this.video.currentTime = 0;
            this.video.play().catch(error => {
                console.warn('Video replay failed:', error);
            });
        }
    }
    
    closeModal() {
        this.hideModal();
        localStorage.setItem('videoModalClosed', 'true');
    }
    
    setupEventListeners() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        if (this.replayBtn) {
            this.replayBtn.addEventListener('click', () => {
                this.replayVideo();
            });
        }
        
        if (this.continueBtn) {
            this.continueBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        if (this.video) {
            this.video.addEventListener('ended', () => {
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.closeModal();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VideoModal();
});
