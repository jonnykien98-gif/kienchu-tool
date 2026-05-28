// api/openai-image.js — Vercel proxy cho OpenAI image API (gpt-image-1)
// Nhận JSON { model, prompt, size, n, images:[{b64,mime}] } từ browser.
// Nếu có images → gọi /v1/images/edits (multipart, match style ảnh mẫu).
// Nếu không → gọi /v1/images/generations (text-to-image).
export const config = { maxDuration: 60, api: { bodyParser: { sizeLimit: '12mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'POST only' } });

  const key = req.headers['x-api-key'];
  if (!key) return res.status(400).json({ error: { message: 'Thiếu OpenAI API key (header X-Api-Key)' } });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { model = 'gpt-image-1', prompt = '', size = '1536x1024', n = 1, images = [] } = body || {};

  try {
    let upstream;
    if (images && images.length) {
      // Edits endpoint (multipart) — dùng ảnh mẫu làm reference
      const form = new FormData();
      form.append('model', model);
      form.append('prompt', prompt);
      form.append('size', size);
      form.append('n', String(n));
      images.forEach((img, i) => {
        const buf = Buffer.from(img.b64, 'base64');
        const ext = (img.mime && img.mime.split('/')[1]) || 'png';
        const blob = new Blob([buf], { type: img.mime || 'image/png' });
        form.append('image[]', blob, `ref${i}.${ext === 'jpeg' ? 'jpg' : ext}`);
      });
      upstream = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + key },
        body: form
      });
    } else {
      // Generations endpoint (text-to-image)
      upstream = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, size, n })
      });
    }
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (e) {
    return res.status(500).json({ error: { message: String(e.message || e) } });
  }
}
