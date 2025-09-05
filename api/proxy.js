// api/proxy.js
const https = require('https');
const http = require('http');
const { parse } = require('url');
const querystring = require('querystring');

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar solicitudes preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir solicitudes GET
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    // Obtener parámetros de consulta
    const { action, image, id, tag } = req.query;
    
    // Si es una solicitud de imagen
    if (image) {
      const imageUrl = `http://87.106.36.114:6322${image}`;
      const protocol = imageUrl.startsWith('https') ? https : http;
      
      protocol.get(imageUrl, (imageRes) => {
        res.setHeader('Content-Type', imageRes.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache de 1 día
        imageRes.pipe(res);
      }).on('error', (err) => {
        console.error('Error al obtener imagen:', err);
        res.status(500).json({ error: 'Error al obtener imagen' });
      });
      return;
    }

    // Si es una solicitud de API normal
    if (!action) {
      res.status(400).json({ error: 'Parámetro action requerido' });
      return;
    }

    // Construir URL de la API destino según el action
    let apiUrl;
    if (action === 'get_addons') {
      apiUrl = 'http://87.106.36.114:6322/api.php?action=get_addons';
      
      // Si hay un parámetro de tag, añadirlo a la URL
      if (tag) {
        apiUrl += `&tag=${encodeURIComponent(tag)}`;
      }
    } else if (action === 'get_addon' && id) {
      apiUrl = `http://87.106.36.114:6322/api.php?action=get_addon&id=${id}`;
    } else if (action === 'get_tags') {
      apiUrl = 'http://87.106.36.114:6322/api.php?action=get_tags';
    } else {
      res.status(400).json({ error: 'Parámetros inválidos para la acción solicitada' });
      return;
    }
    
    // Realizar solicitud a la API
    const protocol = apiUrl.startsWith('https') ? https : http;
    
    protocol.get(apiUrl, (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
          // Parsear JSON y modificar URLs de imágenes
          const jsonData = JSON.parse(data);
          
          // Función para modificar URLs de imágenes
          const modifyImageUrls = (obj) => {
            if (obj && typeof obj === 'object') {
              for (let key in obj) {
                if (typeof obj[key] === 'string' && 
                    (obj[key].includes('/uploads/') || obj[key].includes('87.106.36.114:6322'))) {
                  // Reemplazar con ruta del proxy
                  obj[key] = obj[key].replace(
                    'http://87.106.36.114:6322', 
                    ''
                  ).replace(
                    './uploads/', 
                    '/api/proxy?image=/uploads/'
                  );
                } else if (typeof obj[key] === 'object') {
                  modifyImageUrls(obj[key]);
                }
              }
            }
          };
          
          // Modificar URLs en la respuesta
          modifyImageUrls(jsonData);
          
          res.status(200).json(jsonData);
        } catch (e) {
          // Si no es JSON, devolver como texto
          console.log('La respuesta no es JSON, devolviendo como texto:', data.substring(0, 100));
          res.status(200).send(data);
        }
      });
    }).on('error', (err) => {
      console.error('Error al conectar con la API:', err);
      res.status(500).json({ 
        error: 'Error al conectar con el servidor de API',
        details: err.message 
      });
    });
  } catch (error) {
    console.error('Error en el proxy:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};
