# 🚀 Triển khai AUTO-QUEST (bản thuần Web)

App là **trang tĩnh thuần HTML/CSS/JS** — không backend, không Electron, không proxy.
Token Discord chỉ nằm trong **IndexedDB của trình duyệt người dùng** (AES-GCM), không
bao giờ đi qua máy chủ của bạn.

---

## 1. Yêu cầu

| Thứ | Ghi chú |
| --- | --- |
| **HTTPS** | **Bắt buộc** khi chạy trên domain thật. `crypto.subtle`, Service Worker, Web Locks và Wake Lock đều yêu cầu secure context. `http://localhost` / `127.0.0.1` là ngoại lệ. |
| **Node.js ≥ 20** | Chỉ dùng để build (không cần cài trên server host tĩnh). |
| **Trình duyệt** | Chrome / Edge / Brave / Firefox bản mới. Phải bật cookie + lưu trữ trang. |

---

## 2. Build bản tĩnh

```bash
npm run build:engine   # chỉ khi sửa engine-src/ (TS) — sinh web/engine-bundle.js
npm run build:static   # đóng gói ra web-dist/
```

Kết quả: thư mục **`web-dist/`** — chính là document root để deploy.

```
web-dist/
├── index.html
├── renderer.js · styles.css · mobile.css · fonts.css
├── manifest.webmanifest · sw.js · icon.png
├── assets/
└── web/
    ├── identity.js · display-name-style.js · bridge.js
    ├── engine-worker.js · engine-bundle.js
    └── fonts/
```

> ⚠️ **Không mở `index.html` bằng `file://`.** Worker, module và Service Worker sẽ bị
> chặn. Luôn chạy qua HTTP(S) — local dùng `npm start` (http://127.0.0.1:4173).

Đường dẫn trong app đều **tương đối**, nên deploy ở domain gốc hoặc thư mục con đều
được. Khuyến nghị **domain gốc** để phạm vi Service Worker phủ toàn bộ app.

---

## 3. Cloudflare Pages

1. Push repo lên GitHub/GitLab (khi chủ dự án cho phép).
2. **Workers & Pages → Create → Pages → Connect to Git**.
3. Cấu hình:
   - **Framework preset:** None
   - **Build command:** `npm run build:static`
   - **Build output directory:** `web-dist`
4. Deploy. Mỗi lần push nhánh chính sẽ tự build lại.

Nếu không muốn build trên CI, chạy `npm run build:static` ở máy rồi kéo-thả thư mục
`web-dist/` vào **Direct Upload**.

---

## 4. Netlify

Tạo `netlify.toml` ở gốc repo:

```toml
[build]
  command = "npm run build:static"
  publish = "web-dist"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-store"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-store"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"
```

Hoặc kéo-thả `web-dist/` vào **Netlify Drop**.

---

## 5. Nginx (VPS / domain riêng)

```nginx
server {
    listen 443 ssl http2;
    server_name autoquest.example.com;

    ssl_certificate     /etc/letsencrypt/live/autoquest.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/autoquest.example.com/privkey.pem;

    root /var/www/autoquest/web-dist;
    index index.html;

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy no-referrer always;

    types {
        application/manifest+json webmanifest;
        font/woff2 woff2;
    }

    # Vỏ app + Service Worker: luôn lấy bản mới
    location = /index.html { add_header Cache-Control "no-store" always; }
    location = /sw.js      { add_header Cache-Control "no-store" always; }

    # JS/CSS không hash tên → để no-cache, SW lo phần offline
    location ~* \.(js|css)$ { add_header Cache-Control "no-cache" always; }

    # Font/ảnh tĩnh: cache dài
    location ~* \.(woff2?|png|jpg|jpeg|gif|webp|svg|ico)$ {
        add_header Cache-Control "public, max-age=604800" always;
    }

    location / { try_files $uri $uri/ /index.html; }
}
```

```bash
# Build ở máy, rồi đồng bộ lên VPS
npm run build:static
rsync -av --delete web-dist/ user@vps:/var/www/autoquest/web-dist/
```

Nhớ mở firewall 443 và gia hạn chứng chỉ (certbot).

---

## 6. Cache & cập nhật phiên bản

- `index.html` và `sw.js` → **`no-store`** (bắt buộc, để bản mới lên ngay).
- Service Worker dùng **stale-while-revalidate** cho vỏ app, **network-first** cho điều hướng.
- Khi sửa danh sách file vỏ, **tăng `VERSION` trong [`web/app/sw.js`](../web/app/sw.js)**
  (ví dụ `autoquest-shell-v2`) để trình duyệt bỏ cache cũ.
- Người dùng đang mở tab có thể cần **Ctrl/Cmd + Shift + R** một lần sau khi cập nhật lớn.

---

## 7. Bảo mật & giới hạn

- **Không có endpoint nhận token.** App gọi trực tiếp `https://discord.com/api/...` từ trình duyệt.
- CSP trong `index.html` chỉ cho phép: `self` + Discord + hCaptcha. Nếu bạn thêm CDN khác,
  phải sửa `connect-src`/`script-src` tương ứng — đừng nới rộng thành `*`.
- **Không log token** ở server/CDN/analytics. Không gắn session replay hoặc form recorder —
  chúng có thể ghi lại ô token.
- Mỗi profile trình duyệt giữ token riêng. Máy dùng chung nên dùng cửa sổ ẩn danh và
  **xoá dữ liệu trang** sau khi dùng.
- App **không tự nhận nhiệm vụ** và **không bỏ qua / tự giải captcha**. Khi Discord yêu cầu
  captcha, app dừng và để người dùng tự giải.
- Chỉ mở **một tab** AUTO-QUEST cho mỗi tài khoản (Web Locks sẽ chặn tab thứ hai).

---

## 8. Kiểm tra sau khi deploy

1. Mở `https://<domain>/` → app hiển thị, không lỗi console.
2. DevTools → **Application → Service Workers**: trạng thái *activated*.
3. **Application → Manifest**: tên + icon đọc được (cài PWA được).
4. **Network**: không có request nào chứa token tới domain của bạn.
5. Dán token → quét thử → chạy một nhiệm vụ ngắn.
6. `npm test` ở máy để chạy self-test tĩnh trước khi deploy.

---

## 9. Sự cố thường gặp

| Triệu chứng | Nguyên nhân / cách xử lý |
| --- | --- |
| Worker không chạy, nút Auto ORBs báo lỗi | Thiếu file `web/engine-worker.js` hoặc CSP `worker-src` bị chặn. Build lại `npm run build:static`. |
| Captcha không hiện | `frame-src`/`script-src` thiếu `*.hcaptcha.com`, hoặc trình chặn quảng cáo đang chặn. |
| Đăng nhập xong nhưng mất token sau khi đóng tab | Trình duyệt chặn IndexedDB (chế độ riêng tư nghiêm ngặt / xoá dữ liệu khi thoát). |
| Bản mới không lên | `index.html`/`sw.js` bị cache. Kiểm tra header `no-store`, tăng `VERSION`, hard reload. |
| PWA không cài được | Thiếu HTTPS hoặc manifest/icon 404. Kiểm tra tab Manifest. |
| “Another tab is running” | Đang mở AUTO-QUEST ở tab khác — đóng tab cũ. |
