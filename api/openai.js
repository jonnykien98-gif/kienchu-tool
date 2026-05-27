// Vercel serverless function — proxy cho OpenAI Chat Completions
// Client gửi: POST /api/openai với header X-Api-Key và body OpenAI format

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'POST only' } });
  }

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({
      error: { message: 'Thiếu X-Api-Key header. Cấu hình API key trong sidebar.' }
    });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(req.body)
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (e) {
    console.error('OpenAI proxy error:', e);
    return res.status(500).json({
      error: { message: 'Proxy error: ' + (e.message || 'unknown') }
    });
  }
}
