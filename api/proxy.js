// api/proxy.js
const https = require('https');

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manejar solicitudes preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { query } = req;
  const path = req.url.replace('/api/proxy', '');
  
  // Construir la URL de destino
  const targetUrl = `http://87.106.36.114:6322${path}`;
  
  try {
    // Realizar la solicitud al servidor de destino
    https.get(targetUrl, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        res.status(response.statusCode).send(data);
      });
    }).on('error', (err) => {
      console.error('Error en el proxy:', err);
      res.status(500).json({ error: 'Error en el proxy' });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
