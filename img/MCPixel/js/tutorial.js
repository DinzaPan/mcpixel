// Animación de copos de nieve
document.addEventListener("DOMContentLoaded", function() {
    const snowflakesContainer = document.querySelector('.snowflakes');
    const numSnowflakes = 10;

    for (let i = 0; i < numSnowflakes; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        snowflake.style.left = `${Math.random() * 100}vw`;
        snowflake.style.animationDuration = `${Math.random() * 5 + 5}s`;
        snowflake.style.animationDelay = `${Math.random() * 5}s`;
        snowflakesContainer.appendChild(snowflake);
    }
});

// Animación de código
document.addEventListener("DOMContentLoaded", function () {
    const codeElement = document.getElementById("code-animation");
    const codeSnippets = [
        // HTML
        `<span style="color: #569cd6;">&lt;!DOCTYPE html&gt;</span>\n` +
        `<span style="color: #569cd6;">&lt;html&gt;</span>\n` +
        `<span style="color: #569cd6;">&lt;head&gt;</span>\n` +
        `    <span style="color: #569cd6;">&lt;title&gt;</span><span style="color: #ce9178;">Mi Página</span><span style="color: #569cd6;">&lt;/title&gt;</span>\n` +
        `<span style="color: #569cd6;">&lt;/head&gt;</span>\n` +
        `<span style="color: #569cd6;">&lt;body&gt;</span>\n` +
        `    <span style="color: #569cd6;">&lt;h1&gt;</span><span style="color: #ce9178;">Hola Mundo</span><span style="color: #569cd6;">&lt;/h1&gt;</span>\n` +
        `<span style="color: #569cd6;">&lt;/body&gt;</span>\n` +
        `<span style="color: #569cd6;">&lt;/html&gt;</span>`,

        // CSS
        `<span style="color: #569cd6;">body</span> <span style="color: #dcdcaa;">{</span>\n` +
        `    <span style="color: #dcdcaa;">background-color</span>: <span style="color: #ce9178;">#1e1e2f</span>;\n` +
        `    <span style="color: #dcdcaa;">color</span>: <span style="color: #ce9178;">#e0e0e0</span>;\n` +
        `<span style="color: #dcdcaa;">}</span>`,

        // JavaScript
        `<span style="color: #569cd6;">function</span> <span style="color: #dcdcaa;">saludar</span><span style="color: #dcdcaa;">()</span> <span style="color: #dcdcaa;">{</span>\n` +
        `    <span style="color: #569cd6;">console</span>.<span style="color: #dcdcaa;">log</span><span style="color: #dcdcaa;">(</span><span style="color: #ce9178;">"Hola Mundo"</span><span style="color: #dcdcaa;">)</span>;\n` +
        `<span style="color: #dcdcaa;">}</span>`
    ];

    let currentSnippet = 0;
    let charIndex = 0;

    function typeCode() {
        if (charIndex < codeSnippets[currentSnippet].length) {
            codeElement.innerHTML += codeSnippets[currentSnippet].charAt(charIndex);
            charIndex++;
            setTimeout(typeCode, 50); // Velocidad de escritura
        } else {
            setTimeout(() => {
                codeElement.innerHTML = ""; // Limpiar el código
                charIndex = 0;
                currentSnippet = (currentSnippet + 1) % codeSnippets.length; // Cambiar al siguiente snippet
                typeCode();
            }, 2000); // Tiempo de espera antes de borrar
        }
    }

    typeCode(); // Iniciar la animación
});

// Función para alternar el menú desplegable
function toggleMenu() {
    const menuIcon = document.getElementById("menuIcon");
    const navMenu = document.getElementById("navMenu");

    menuIcon.classList.toggle("active");
    navMenu.classList.toggle("active");

    if (navMenu.classList.contains("active")) {
        navMenu.style.display = "block";
        navMenu.style.animation = "slideDown 0.3s ease-out";
    } else {
        navMenu.style.animation = "slideUp 0.3s ease-out";
        setTimeout(() => {
            navMenu.style.display = "none";
        }, 300);
    }
}