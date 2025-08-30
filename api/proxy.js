// api/proxy.js
export default async function handler(request, response) {
  // Permitir CORS
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manejar preflight requests
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    // Obtener la URL del parámetro de consulta
    const targetUrl = request.query.url;
    
    if (!targetUrl) {
      response.status(400).json({ error: 'URL parameter is required' });
      return;
    }

    // Decodificar la URL
    const decodedUrl = decodeURIComponent(targetUrl);
    
    // Hacer la solicitud a la API externa
    const apiResponse = await fetch(decodedUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCPixel-Vercel-Proxy/1.0'
      }
    });

    // Verificar si la respuesta es exitosa
    if (!apiResponse.ok) {
      throw new Error(`API responded with status ${apiResponse.status}`);
    }

    // Obtener los datos de la respuesta
    const data = await apiResponse.json();

    // Devolver los datos al cliente
    response.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    response.status(500).json({ 
      error: 'Failed to fetch data from external API',
      details: error.message 
    });
  }
}
