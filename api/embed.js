export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return sendGenericEmbed(res);
  }

  try {
    const SUPABASE_URL = 'https://dgmsyuzxsvjfkjdyecer.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbXN5dXp4c3ZqZmtqZHllY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjI5OTUsImV4cCI6MjA3OTEzODk5NX0._SQAuzRejAi-tghTh8hTk_dvaZooEMZBbHAQw4hyA3I';
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/addons?id=eq.${id}&select=*,profiles(username,is_verified)`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return sendGenericEmbed(res);
    }
    
    const addon = data[0];
    const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://mcpixel.vercel.app';
    
    const imageUrl = getAbsoluteImageUrl(addon.image, siteUrl);
    const description = truncateDescription(addon.description || 'Descubre este increíble addon para Minecraft en MCPixel', 150);
    const creatorName = addon.profiles?.username || addon.creator || 'Anónimo';
    const isVerified = addon.profiles?.is_verified || false;
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(addon.title)} - MCPixel</title>
    
    <meta property="og:title" content="${escapeHtml(addon.title)} - MCPixel">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(imageUrl)}">
    <meta property="og:url" content="${siteUrl}/sc/view.html?id=${id}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="MCPixel">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(addon.title)} - MCPixel">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
    <meta name="twitter:site" content="@MCPixel">
</head>
<body>
</body>
</html>
    `;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    
  } catch (error) {
    console.error('Error:', error);
    sendGenericEmbed(res);
  }
}

function sendGenericEmbed(res) {
  const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://mcpixel.vercel.app';
  
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCPixel - Descubre Addons para Minecraft</title>
    
    <meta property="og:title" content="MCPixel - Descubre Addons para Minecraft">
    <meta property="og:description" content="Explora la mejor colección de addons para Minecraft. Texturas, mods, shaders y más.">
    <meta property="og:image" content="${siteUrl}/img/logo.png">
    <meta property="og:url" content="${siteUrl}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="MCPixel">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="MCPixel - Descubre Addons para Minecraft">
    <meta name="twitter:description" content="Explora la mejor colección de addons para Minecraft">
    <meta name="twitter:image" content="${siteUrl}/img/logo.png">
    <meta name="twitter:site" content="@MCPixel">
</head>
<body>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

function getAbsoluteImageUrl(imageUrl, siteUrl) {
  if (!imageUrl) return `${siteUrl}/img/default-addon.jpg`;
  if (imageUrl.startsWith('http')) return imageUrl;
  if (imageUrl.startsWith('//')) return `https:${imageUrl}`;
  if (imageUrl.startsWith('/')) return `${siteUrl}${imageUrl}`;
  return `${siteUrl}/${imageUrl}`;
}

function truncateDescription(description, length) {
  if (!description || description.length <= length) return description;
  const truncated = description.substring(0, length);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
