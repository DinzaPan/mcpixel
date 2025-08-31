// api/proxy.js
const https = require('https');
const http = require('http');

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
    const { action } = req.query;
    
    if (!action) {
      res.status(400).json({ error: 'Parámetro action requerido' });
      return;
    }

    // Construir URL de la API destino
    const apiUrl = `http://87.106.36.114:6322/api.php?action=${action}`;
    
    // Realizar solicitud a la API
    const protocol = apiUrl.startsWith('https') ? https : http;
    
    protocol.get(apiUrl, (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
          // Intentar parsear como JSON
          const jsonData = JSON.parse(data);
          res.status(200).json(jsonData);
        } catch (e) {
          // Si no es JSON, devolver como texto
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
