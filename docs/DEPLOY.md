> **Waves#200 — kiến trúc hiện tại (Web PWA v2.0.0):** UI `web/app/` (`index.html`, `renderer.js`, `styles.css`, `sw.js`), adapter `web/bridge.js` (token IndexedDB AES-GCM), danh tính duy nhất `web/identity.js` (build number là placeholder, một điểm cập nhật), engine web `web/engine/` + `web/engine-bundle.js` (sinh bởi `npm run build:engine`, không sửa tay), `engine-src/` TypeScript chỉ là tham khảo. Tài liệu lịch sử thời Electron đã được đánh dấu ARCHIVED, không xóa.

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
npm run build:engine   # đóng gói lại web/engine/ (JS) thành web/engine-bundle.js — engine-src/ (TS) chỉ là thiết kế tham khảo, không được biên dịch vào bundle
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

`npm run build:static` sinh luôn **`web-dist/_headers`** (CSP đầy đủ + `frame-ancestors
'none'`, nosniff, no-referrer, X-Frame-Options, Permissions-Policy, HSTS). File này
**chỉ có tác dụng trên Cloudflare Pages / Netlify** — xem §3b nếu bạn dùng Workers.

---

## 3b. Cloudflare **Workers** (Assets) — trường hợp `*.workers.dev`

Workers **không đọc `_headers`**. Nếu không làm gì thêm, app chỉ có CSP trong
`<meta>` của `index.html`, mà meta **không áp dụng được** `frame-ancestors`,
`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
`HSTS` ⇒ còn thiếu lớp chống clickjacking/mime-sniffing.

Chọn MỘT trong hai cách:

**Cách 1 — Response Rules (không cần sửa code).**
Dashboard → *Workers & Pages* → worker của bạn → **Settings → (Body) Settings →
Headers/Response Rules** (hoặc *Zone → Rules → Rewrite Headers* nếu gắn domain riêng):
thêm các header static dưới đây cho mọi response, và riêng `Content-Security-Policy`
bằng đúng chuỗi trong `web/app/index.html` **có thêm** `; frame-ancestors 'none'`.

**Cách 2 — tự trả header trong Worker (khuyên dùng, không thể quên).**

```js
// worker.js — Assets Worker (npm run build:static → web-dist, asset binding: ASSETS)
const CSP =
	"default-src 'none'; script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com https://hcaptcha.com; " +
	"worker-src 'self' blob: https://js.hcaptcha.com https://newassets.hcaptcha.com https://hcaptcha.com; " +
	"style-src 'self' 'unsafe-inline' https://*.hcaptcha.com; frame-src https://*.hcaptcha.com https://newassets.hcaptcha.com; " +
	"child-src blob: https://*.hcaptcha.com https://newassets.hcaptcha.com; " +
	"connect-src 'self' https://discord.com https://*.discord.com https://cdn.discordapp.com https://*.discordsays.com " +
	"https://*.hcaptcha.com https://hcaptcha.com https://newassets.hcaptcha.com; " +
	"img-src 'self' https://cdn.discordapp.com https://discord.com https://*.discord.com https://*.hcaptcha.com data: blob:; " +
	"media-src https://cdn.discordapp.com https://discord.com https://*.discord.com; font-src 'self' data: https://*.hcaptcha.com; " +
	"manifest-src 'self'; base-uri 'self'; object-src 'none'; form-action 'none'; upgrade-insecure-requests; frame-ancestors 'none'";

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const isShell = url.pathname === '/' || url.pathname.endsWith('.html') ||
			url.pathname === '/sw.js' || url.pathname === '/integrity.json';
		let res = await env.ASSETS.fetch(request);
		const h = new Headers(res.headers);
		h.set('Content-Security-Policy', CSP);
		h.set('X-Content-Type-Options', 'nosniff');
		h.set('Referrer-Policy', 'no-referrer');
		h.set('X-Frame-Options', 'DENY');
		h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), usb=(), payment=(), interest-cohort=()');
		h.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
		if (isShell) h.set('Cache-Control', 'no-store');
		return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
	},
};
```

Sau khi deploy, **kiểm chứng bằng chính curl** (đừng tin dashboard):

```bash
curl -sSI https://<domain>/ | grep -iE 'content-security|x-frame|nosniff|referrer|permissions|strict-transport'
curl -sSI https://<domain>/sw.js | grep -i cache-control
```

`*.workers.dev` là host chia sẻ: Cloudflare có thể chặn/định tuyến frame từ domain đó,
và `frame-ancestors 'none'` sẽ chặn nhúng app ở bất kỳ đâu (đúng chủ ý). Nếu muốn một
domain của riêng bạn, gắn custom domain rồi bật HTTPS + HSTS.

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

**App làm gì:**

- **Không có endpoint nhận token.** App gọi trực tiếp `https://discord.com/api/...` từ trình duyệt.
- Token lưu ở IndexedDB dưới dạng **AES-GCM 256, IV mới mỗi lần ghi**; khoá CryptoKey
  **không export được** (`non-extractable`). Không còn đường rơi về base64: nếu trình
  duyệt chặn IndexedDB/crypto, token **không được ghi xuống** (chỉ sống trong RAM) và UI
  cảnh báo.
- `getConfig()` / `accountsList()` **không trả token**; token thật chỉ lấy được qua
  `tokenReveal()`, và hàm này từ chối nếu chưa có một thao tác thật của người dùng
  (`isTrusted`) ngoài cửa sổ 6 giây lúc mở trang (cửa sổ này chỉ dùng MỘT lần).
- Log của engine đi qua `maskSecrets()` (che `Authorization: Bearer …`, `"token": "…"`).
- CSP `script-src` **không** có `unsafe-inline`/`unsafe-eval`, host hCaptcha chốt theo
  tên (không wildcard); thêm `base-uri 'none'`, `object-src`, `form-action`,
  `upgrade-insecure-requests`. Mọi chuỗi Discord (id/avatar/banner/decoration/theme
  colors) đi qua whitelist trước khi vào DOM/CSS.
- App **không tự nhận nhiệm vụ** và **không bỏ qua / tự giải captcha**.

**Giới hạn thật — nói thẳng, đừng tin quảng cáo:**

- Khoá AES nằm **cùng origin** (IndexedDB) với bản mã, vì trình duyệt cần tự giải mã khi
  mở lại. Nghĩa là: **một script chạy cùng origin (XSS) vẫn giải được token** nếu nó
  đánh cắp được thi thể mã hoá hoặc gọi được `tokenReveal()` sau khi mồi được một cú
  click hợp lệ. Web thuần **không** đóng được khe này.
- Vì vậy lớp chắn thật là: **CSP khép kín + không còn điểm chèn HTML/CSS** (đã kiểm
  bằng tự test + QA) chứ không phải "mã hoá là bất khả xâm phạm".
- `integrity.json` bảo vệ **build** (phát hiện file bị thay trên host/CDN), **không** bảo
  vệ token.
- Ai có quyền vật lý với máy / profile trình duyệt của người dùng thì lấy được token, bất
  kể app. Máy dùng chung: cửa sổ ẩn danh + xoá dữ liệu trang sau khi dùng.
- **Không log token** ở server/CDN/analytics; không gắn session replay hay form recorder.
- Không dán vào console hay chia sẻ ảnh chụp ô token; token Discord = mật khẩu tài khoản.
- Mỗi profile trình duyệt giữ token riêng. Chỉ mở **một tab** AUTO-QUEST cho mỗi tài khoản
  (Web Locks sẽ chặn tab thứ hai).
- Header an toàn **phải được trả từ server/Worker** (§3b). CSP trong `<meta>` không áp dụng
  `frame-ancestors` và không sửa được response header — thiếu bước này là lỗ hổng thật.

---

## 8. Kiểm tra sau khi deploy

1. Mở `https://<domain>/` → app hiển thị, không lỗi console.
2. DevTools → **Application → Service Workers**: trạng thái *activated*.
3. **Application → Manifest**: tên + icon đọc được (cài PWA được).
4. **Network**: không có request nào chứa token tới domain của bạn.
5. Dán token → quét thử → chạy một nhiệm vụ ngắn.
6. `npm test` ở máy để chạy self-test tĩnh trước khi deploy.
7. `curl -sSI https://<domain>/` — **phải thấy** `Content-Security-Policy` có
   `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: no-referrer`, `Permissions-Policy`, `Strict-Transport-Security`.
   Thiếu tức là bạn mới deploy file tĩnh mà chưa gắn header (§3b).
8. Console **không** còn dòng `The Content-Security-Policy directive name '…' ... ignored`
   và không có vi phạm CSP nào khi mở hCaptcha.

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
| Console báo `directive 'frame-ancestors' is ignored when delivered via <meta>` | Ai đó đã nhét `frame-ancestors` vào CSP của `index.html`. Directive này chỉ có tác dụng qua HTTP header — xoá khỏi meta, thêm vào header ở §3b. |
| Trang vẫn bị nhúng trong iframe hàng xóm | Server/Worker chưa trả `X-Frame-Options`/`frame-ancestors`; `_headers` không chạy trên Workers. Kiểm lại bằng `curl -sSI`. |
| Mở app không tự đăng nhập, log ghi `Từ chối revealed token` | `tokenReveal()` chỉ trả token khi có thao tác thật của người dùng (hoặc trong 6 giây đầu của trang, đúng một lần). Bấm chuột thật vào app rồi reload, hoặc dán lại token. Đây là cổng chống script ẩn đọc token, không phải lỗi. |
