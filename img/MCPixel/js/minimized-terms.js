// Función para cerrar la interfaz minimizada
function closeMinimizedTerms() {
    const minimizedTerms = document.getElementById('minimizedTermsOverlay');
    minimizedTerms.style.display = 'none';
}

// Función para obtener el hash del contenido de "terminos.html"
async function getTermsHash() {
    try {
        const response = await fetch('terminos.html');
        const text = await response.text();
        return hashCode(text); // Generar un hash del contenido completo
    } catch (error) {
        console.error('Error al obtener el contenido de terminos.html:', error);
        return null;
    }
}

// Función para verificar si hay cambios en los términos y condiciones
async function checkForTermsChanges() {
    const currentHash = await getTermsHash();
    const lastHash = localStorage.getItem('termsLastHash');

    if (lastHash !== currentHash) {
        // Si hay cambios, mostrar la interfaz minimizada
        const minimizedTerms = document.getElementById('minimizedTermsOverlay');
        minimizedTerms.style.display = 'flex';
        // Guardar el nuevo hash en localStorage
        localStorage.setItem('termsLastHash', currentHash);
    }
}

// Función para generar un hash simple del contenido
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convertir a entero de 32 bits
    }
    return hash.toString();
}

// Verificar cambios en los términos y condiciones cada cierto tiempo
function startTermsCheckInterval() {
    setInterval(checkForTermsChanges, 5000); // Verificar cada 5 segundos
}

// Iniciar el sistema al cargar la página
window.onload = function () {
    checkForTermsChanges(); // Verificar cambios al cargar la página
    startTermsCheckInterval(); // Iniciar la verificación periódica
};