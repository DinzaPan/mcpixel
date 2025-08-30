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
    
    // Determinar el tipo de contenido basado en la URL
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(decodedUrl);
    
    // Hacer la solicitud a la API externa o recurso
    const apiResponse = await fetch(decodedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'MCPixel-Vercel-Proxy/1.0'
      }
    });

    // Verificar si la respuesta es exitosa
    if (!apiResponse.ok) {
      throw new Error(`API responded with status ${apiResponse.status}`);
    }

    // Manejar diferentes tipos de contenido
    if (isImage) {
      // Para imágenes, obtener el buffer y servir con el tipo de contenido correcto
      const imageBuffer = await apiResponse.arrayBuffer();
      const contentType = apiResponse.headers.get('content-type') || 'image/jpeg';
      
      response.setHeader('Content-Type', contentType);
      response.setHeader('Cache-Control', 'public, max-age=86400'); // Cache de 1 día para imágenes
      response.status(200).send(Buffer.from(imageBuffer));
    } else {
      // Para JSON y otros contenidos
      const data = await apiResponse.json();
      response.setHeader('Content-Type', 'application/json');
      response.status(200).json(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    response.status(500).json({ 
      error: 'Failed to fetch data from external API',
      details: error.message 
    });
  }
}
