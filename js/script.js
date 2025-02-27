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

// Función para buscar addons
function searchAddons() {
    const searchText = document.getElementById("searchInput").value.toLowerCase();
    const addonGrid = document.getElementById("addonGrid");
    const addonCards = addonGrid.querySelectorAll(".addon-card");
    const noResults = document.getElementById("noResults");
    const searchTextSpan = document.getElementById("searchText");

    let found = false;

    addonCards.forEach(card => {
        const title = card.querySelector("h3").textContent.toLowerCase();
        if (title.includes(searchText)) {
            card.style.display = "block";
            card.style.animation = "fadeInUp 0.5s ease-out";
            found = true;
        } else {
            card.style.display = "none";
        }
    });

    if (!found) {
        searchTextSpan.textContent = searchText;
        noResults.style.display = "block";
        noResults.style.animation = "fadeIn 0.5s ease-out";
    } else {
        noResults.style.display = "none";
    }
}

// Función para mostrar detalles del addon
function showAddonDetails(card) {
    const image = card.querySelector("img").src;
    const title = card.querySelector("h3").textContent;
    const description = card.querySelector(".hidden-data .description").textContent;
    const downloadLink = card.querySelector(".hidden-data .download-link").href;
    const category = card.querySelector(".category-tag").textContent.trim();
    const uploadedBy = card.querySelector(".uploaded-by").textContent;

    // Actualizar la interfaz de detalles
    document.getElementById("detail-image").src = image;
    document.getElementById("detail-title").textContent = title;
    document.getElementById("detail-description").textContent = description;
    document.getElementById("detail-download-link").href = downloadLink;
    document.getElementById("detail-category").textContent = category;
    document.getElementById("detail-uploaded-by").textContent = uploadedBy;

    // Mostrar la interfaz de detalles
    document.getElementById("addonDetails").style.display = "flex";
}

// Función para cerrar detalles del addon
function closeAddonDetails() {
    document.getElementById("addonDetails").style.display = "none";
}

// Carrusel funcion
let currentSlide = 0;
let carouselInterval;

// Función para mostrar el slide actual
function showSlide(index) {
    const carouselInner = document.querySelector(".carousel-inner");
    const slides = document.querySelectorAll(".carousel-item");
    const indicators = document.querySelectorAll(".carousel-indicators .indicator");
    const totalSlides = slides.length;

    // Asegura que el índice esté dentro del rango
    if (index >= totalSlides) currentSlide = 0;
    if (index < 0) currentSlide = totalSlides - 1;

    // Calcula el desplazamiento
    const offset = -currentSlide * 100;
    carouselInner.style.transform = `translateX(${offset}%)`;

    // Actualiza los indicadores
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle("active", i === currentSlide);
    });
}

// Función para avanzar al siguiente slide
function nextSlide() {
    currentSlide++;
    showSlide(currentSlide);
}

// Función para retroceder al slide anterior
function prevSlide() {
    currentSlide--;
    showSlide(currentSlide);
}

// Función para ir a un slide específico
function goToSlide(index) {
    currentSlide = index;
    showSlide(currentSlide);
}

// Iniciar el carrusel automático
function startCarousel() {
    carouselInterval = setInterval(nextSlide, 6000); // Cambia de slide cada 6 segundos
}

// Detener el carrusel automático
function stopCarousel() {
    clearInterval(carouselInterval);
}

// Reiniciar el carrusel automático
function resetCarousel() {
    stopCarousel();
    startCarousel();
}

// Pausar el carrusel cuando el mouse está sobre él
document.querySelector(".carousel").addEventListener("mouseenter", stopCarousel);

// Reanudar el carrusel cuando el mouse sale
document.querySelector(".carousel").addEventListener("mouseleave", startCarousel);

// Iniciar el carrusel al cargar la página
window.onload = function () {
    startCarousel();
};

// Función para mostrar detalles del addon desde un banner
function showAddonFromBanner(addonId) {
    const card = document.querySelector(`.addon-card[data-id="${addonId}"]`);
    if (card) {
        showAddonDetails(card);
    }
}

// Asignar eventos a los banners
document.querySelectorAll(".carousel-item").forEach(banner => {
    banner.addEventListener("click", () => {
        const addonId = banner.getAttribute("data-id");
        showAddonFromBanner(addonId);
    });
});

// Función para reiniciar la base de datos local (localStorage)
function resetLocalStorage() {
    localStorage.removeItem("termsAccepted");
    console.log("Base de datos local reiniciada. Los términos y condiciones aparecerán nuevamente.");
}

// Mostrar la interfaz de términos y condiciones al cargar la página
window.onload = function () {
    const termsAccepted = localStorage.getItem("termsAccepted");
    if (!termsAccepted) {
        document.getElementById("termsModal").style.display = "flex";
    }
};

// Función para aceptar los términos
function acceptTerms() {
    localStorage.setItem("termsAccepted", "true");
    document.getElementById("termsModal").style.display = "none";
}

// Función para rechazar los términos
function rejectTerms() {
    document.getElementById("termsModal").style.display = "none";
    document.getElementById("rejectModal").style.display = "flex";
}

// Función para volver a la interfaz de términos
function backToTerms() {
    document.getElementById("rejectModal").style.display = "none";
    document.getElementById("termsModal").style.display = "flex";
}

// Llamar a esta función si necesitas reiniciar el localStorage
// resetLocalStorage();.