# MCPixel - Plataforma de Addons para Minecraft Bedrock

![MCPixel Logo](https://raw.githubusercontent.com/DinzaPan/mcpixel/main/img/logo.png)

## 📖 Descripción

**MCPixel** es una página web de código abierto dedicada a la comunidad de Minecraft Bedrock, diseñada como una plataforma gratuita y sin fines de lucro para compartir, descubrir y publicar addons de manera libre y accesible para todos.

**Versión Actual:** 1.7.9

## 🌐 Enlaces Oficiales

- **Página Web Oficial:** [https://mcpixel.vercel.app/](https://mcpixel.vercel.app/)
- **Discord Oficial MCPixel:** [https://discord.gg/9EkhYdV325](https://discord.gg/9EkhYdV325)
- **Discord MegaPixel:** [https://discord.gg/RMfzSyNxjT](https://discord.gg/RMfzSyNxjT)
- **Repositorio GitHub:** [https://github.com/DinzaPan/mcpixel](https://github.com/DinzaPan/mcpixel)

## 🏗️ Arquitectura del Proyecto

### Estructura Única de Archivos
**Todos los códigos están contenidos en archivos HTML individuales** que incluyen:
- **HTML** para la estructura
- **CSS** embebido para los estilos  
- **JavaScript** embebido para la funcionalidad
- **Configuración de API** integrada

### Sistema de Cache con LocalStorage
MCPixel implementa un **sistema inteligente de cache** que:
- **Almacena los addons en localStorage** por 5 minutos
- **Reduce significativamente las llamadas a la API** de JSONBin.io
- **Mejora el rendimiento** y velocidad de carga
- **Puede ser removido o modificado** según las necesidades del proyecto
- **Verifica cambios en los datos** antes de actualizar el cache

## ✨ Características

- 🎮 **Especializado en Minecraft Bedrock** - Plataforma optimizada para addons de Bedrock Edition
- 🌐 **Interfaz Moderna** - Diseño responsive y user-friendly
- 📱 **Compatible con Móviles** - Funciona perfectamente en dispositivos móviles
- 🔍 **Sistema de Búsqueda Avanzado** - Encuentra addons por título, autor, descripción o etiquetas
- 🚀 **Publicación Sencilla** - Sistema intuitivo para publicar nuevos addons
- ⭐ **Sistema de Verificación** - Autores verificados para mayor confianza
- 🔄 **Cache Inteligente** - Almacenamiento local para optimizar rendimiento
- ⚡ **Actualización Automática** - Verifica nuevos addons cada 5 minutos

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript Vanilla (todo en un solo archivo)
- **Almacenamiento Local:** localStorage para cache de addons
- **Backend API:** [JSONBin.io](https://jsonbin.io) para datos en tiempo real
- **Iconos:** Font Awesome 6.4.0
- **Hosting:** Compatible con GitHub Pages, Netlify, Vercel, etc.

## 📋 Requisitos del Sistema

- Navegador web moderno (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Conexión a Internet para cargar los addons desde la API
- JavaScript habilitado
- localStorage disponible en el navegador

## 🚀 Instalación y Uso

### Para Usuarios Finales:
Simplemente visita [https://mcpixel.vercel.app/](https://mcpixel.vercel.app/) para comenzar a explorar addons.

### Para Desarrolladores:

1. Clona el repositorio:
```bash
git clone https://github.com/DinzaPan/mcpixel.git# mcpixel
