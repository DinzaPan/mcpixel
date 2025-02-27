// Función para mostrar los detalles del servidor
function showServerDetails(card) {
    const serverDetails = document.getElementById("serverDetails");
    const detailImage = document.getElementById("detail-image");
    const detailTitle = document.getElementById("detail-title");
    const detailTags = document.getElementById("detail-tags");
    const detailDescription = document.getElementById("detail-description");
    const detailDiscordLink = document.getElementById("detail-discord-link");
    const detailIp = document.getElementById("detail-ip");
    const detailPort = document.getElementById("detail-port");

    // Obtener datos de la tarjeta
    const image = card.querySelector("img").src;
    const title = card.querySelector("h3").textContent;
    const tags = card.querySelector(".tags").innerHTML;
    const description = card.querySelector(".description").textContent;
    const discordLink = card.querySelector(".discord-link").href;
    const ip = card.querySelector(".ip").textContent;
    const port = card.querySelector(".port").textContent;

    // Asignar datos a la interfaz
    detailImage.src = image;
    detailTitle.textContent = title;
    detailTags.innerHTML = tags;
    detailDescription.textContent = description;
    detailDiscordLink.href = discordLink;
    detailIp.textContent = ip;
    detailPort.textContent = port;

    // Mostrar la interfaz
    serverDetails.style.display = "flex";
}

// Función para cerrar los detalles del servidor
function closeServerDetails() {
    const serverDetails = document.getElementById("serverDetails");
    serverDetails.style.display = "none";
}

// Función para alternar el menú desplegable
function toggleMenu() {
    const navMenu = document.getElementById("navMenu");
    const menuIcon = document.getElementById("menuIcon");
    navMenu.classList.toggle("active");
    menuIcon.classList.toggle("active");
}