# Production Pipeline — Hướng dẫn Deploy

Tool tạo G-Labs prompts tự động từ kịch bản. Có 3 sub-tool: Asset Generator, Scene Breakdown, Image Renamer.

## Cấu trúc files

```
deploy/
├── index.html       ← Frontend (giao diện)
├── api/
│   └── claude.js    ← Backend proxy (giữ API key bí mật)
├── vercel.json      ← Cấu hình Vercel
├── package.json     ← Khai báo Node project
└── README.md        ← File này
```

## Yêu cầu

1. **Anthropic API key** — đăng ký tại https://console.anthropic.com → API Keys → Create Key. Nạp tối thiểu $5 credit.
2. **Vercel account** — đăng ký free tại https://vercel.com (signup bằng GitHub là nhanh nhất).

## Cách 1: Deploy bằng Vercel CLI (nhanh nhất, 2 phút)

```bash
# 1. Cài Vercel CLI (chỉ làm 1 lần)
npm install -g vercel

# 2. Vào folder deploy
cd deploy

# 3. Deploy
vercel

# 4. Sau khi deploy xong, set API key:
vercel env add ANTHROPIC_API_KEY
# Paste API key của bạn, chọn cả 3 environments (Production, Preview, Development)

# 5. Re-deploy để áp dụng env
vercel --prod
```

Xong. Vercel sẽ in ra URL kiểu `https://your-project.vercel.app`. Mở là dùng.

## Cách 2: Deploy qua GitHub (recommended cho team)

```bash
# 1. Tạo repo mới trên GitHub
# 2. Push folder deploy lên repo đó:
cd deploy
git init
git add .
git commit -m "init"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

Sau đó:
1. Vào https://vercel.com/new
2. Click "Import" cạnh repo vừa tạo
3. Click "Environment Variables", thêm:
   - Name: `ANTHROPIC_API_KEY`
   - Value: [API key của bạn]
4. Click "Deploy"

Mỗi lần `git push`, Vercel tự deploy lại.

## Cách 3: Drag & drop (không cần code)

1. Zip folder `deploy` thành `deploy.zip`
2. Vào https://vercel.com/new
3. Kéo file zip vào ô upload (hoặc dùng "Deploy from CLI/Upload")
4. Sau khi deploy, vào Settings → Environment Variables, thêm `ANTHROPIC_API_KEY`
5. Vào Deployments → click "..." trên bản mới nhất → "Redeploy"

## Test sau khi deploy

1. Mở URL Vercel cấp
2. Vào tab "02 Scene Breakdown"
3. Paste vài câu script
4. Chọn "Smart Split (AI semantic)"
5. Bấm "Split Scenes"

Nếu chạy → OK.
Nếu vẫn lỗi → mở DevTools (F12) → tab Network → bấm Split → xem request `/api/claude` trả status gì:
- 401: API key sai
- 500: API key chưa set trong env
- 529: Anthropic đang quá tải, thử lại
- 200: OK, lỗi ở chỗ khác (xem tab Console)

## Chi phí

- Vercel: **Free** cho project cá nhân (hobby tier đủ rộng rãi)
- Anthropic API: pay-per-use. Claude Sonnet 4 ~$3/triệu input tokens, $15/triệu output. 1 video ~5-10k tokens = vài cent. $5 credit chạy được vài chục video.

## Bảo mật

API key chỉ nằm ở Vercel env vars (server-side), KHÔNG bao giờ lộ ra browser. An toàn dùng cho team / public.

Nếu muốn giới hạn ai dùng được tool (tránh người lạ phá credit), thêm password check ở đầu `api/claude.js`:

```js
const PASSWORD = process.env.APP_PASSWORD;
if (req.headers['x-app-password'] !== PASSWORD) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

Rồi trong `index.html` thêm `'x-app-password': prompt('Mật khẩu?')` vào headers.

## Update tool

Khi muốn sửa giao diện hoặc logic:
- Cách 1 (CLI): sửa file → `vercel --prod`
- Cách 2 (GitHub): sửa file → `git push` → Vercel tự build
- Cách 3 (drag-drop): sửa file → zip lại → upload lại

## Troubleshooting

**"Failed to fetch" sau khi deploy**
→ Chưa set env var. Vào Vercel dashboard → Settings → Environment Variables → thêm `ANTHROPIC_API_KEY` → Redeploy.

**Function timeout sau 10s**
→ Free tier giới hạn 10s. Đã set 60s trong `vercel.json` nhưng cần upgrade lên Pro tier mới được dùng. Hoặc giảm Batch xuống 2-3 để mỗi request ngắn hơn.

**"Insufficient credits"**
→ Nạp thêm tiền vào Anthropic console.

**Storage data mất sau khi deploy mới**
→ Dữ liệu lưu ở `localStorage` của browser (per-device). Dùng nút "Export Project" thường xuyên để backup ra file JSON.
