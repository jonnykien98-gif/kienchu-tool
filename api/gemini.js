// api/gemini.js — Vercel serverless proxy cho Google Gemini image API (Nano Banana)
// Tránh lỗi CORS khi gọi từ browser. Key truyền qua header X-Api-Key, model qua X-Model.
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, X-Model');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'POST only' } });

  const key = req.headers['x-api-key'];
  const model = req.headers['x-model'] || 'gemini-2.5-flash-image';
  if (!key) return res.status(400).json({ error: { message: 'Thiếu API key (header X-Api-Key)' } });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (e) {
    return res.status(500).json({ error: { message: String(e.message || e) } });
  }
}
