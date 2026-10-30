> **ARCHIVED — tài liệu lịch sử, không còn mô tả code hiện tại.**
> Nội dung dưới đây là ảnh chụp ngày 2026-10-28 (thời Electron / trước khi port web xong).
> Các file `electron/*`, `mobile/*`, `build-ipa/*`, `web-poc/*` đã bị xoá khỏi repo.
> Kiến trúc hiện tại (Web PWA v2.0.0): UI `web/app/` (`index.html`, `renderer.js`, `styles.css`),
> adapter `web/bridge.js` (hợp đồng `window.autoquest`, token IndexedDB AES-GCM),
> danh tính duy nhất `web/identity.js`, engine web `web/engine/` + file sinh ra
> `web/engine-bundle.js` (đừng sửa tay — chạy `npm run build:engine`), và
> `engine-src/` TypeScript chỉ còn là thiết kế tham khảo, không được biên dịch vào bundle.
> Tài liệu triển khai hiện tại: `docs/DEPLOY.md`. Lịch sử được giữ nguyên, không xoá.

# AUTO-QUEST LÊN WEB — có làm được không, làm bằng cách nào

> **ĐỌC `docs/AGENT-BRIEF.md` TRƯỚC** — luật (I1..I7), decision log (D1..D8), backlog canonical.
>
> - **Trạng thái**: đã đo bằng thực nghiệm (3 lệnh curl + `web-poc`), **chưa port code**.
> - **Đánh số**: track web canonical là **#109–#116** (AGENT-BRIEF §6 Track B). Bảng ở §7 dưới đây là
>   **bản nháp cũ** — số đã được gộp, **dùng số trong AGENT-BRIEF**.
> - **Phụ thuộc**: chỉ bắt đầu web **sau** khi claim (#101–#108) xong. Port lỗi claim sang web = lỗi x2.
> - Kèm bản chạy thử: `web-poc/index.html` (chứng minh CORS mở, claim được account không bị challenge).
> - Ngày: 2026-10-28.

---

## 0. TL;DR

| Câu hỏi của bro | Trả lời |
|---|---|
| Trình duyệt gọi thẳng Discord API được không? | **ĐƯỢC.** Discord phản chiếu **mọi** `Origin` (kể cả `null`), cho phép `Authorization`, `X-Super-Properties`, `X-Captcha-Session-Id` |
| Có cần Render làm cầu nối không? | **KHÔNG CẦN — và KHÔNG NÊN.** Cầu nối = token đi qua server của bro |
| Token lưu ở localStorage được không? | Được về mặt kỹ thuật, nhưng **localStorage là plaintext, XSS đọc được**. Phải mã hoá + passphrase |
| Bao nhiêu % app port được sang web? | **~85%** (quét, tiến độ, claim không captcha, số dư). Không port được: treo 24/7 khi đóng tab, và CAPTCHA |
| Nhiều người truy cập? | Được, **server load = 0** vì mọi thứ chạy trên máy user. Nhưng càng đông càng dễ bị Discord để ý → ban wave |
| $50 Render dùng sao? | **Static site = $0 vĩnh viễn.** Chỉ cần $7/tháng cho `/api/version` + telemetry nếu muốn |

---

## 1. BẰNG CHỨNG — ba lệnh curl, chạy ngày 2026-10-28

### 1.1 Preflight `POST claim-reward` từ một origin web lạ

```
$ curl -X OPTIONS https://discord.com/api/v10/quests/1/claim-reward \
    -H "Origin: https://zoz-hub.onrender.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: authorization,content-type,x-super-properties,x-captcha-session-id,x-installation-id"

HTTP/1.1 200 OK
access-control-allow-origin: https://zoz-hub.onrender.com
access-control-allow-methods: POST
access-control-allow-headers: authorization,content-type,x-super-properties,x-captcha-session-id,x-installation-id
access-control-max-age: 3600
```

### 1.2 `GET /quests/@me` với token rác → **401, không phải lỗi CORS**

```
HTTP/1.1 401 Unauthorized
access-control-allow-origin: https://zoz-hub.onrender.com
access-control-allow-credentials: true
access-control-allow-headers: Content-Type, Authorization, X-Super-Properties, …
    X-Captcha-Key, X-Captcha-Rqtoken, X-Captcha-Session-Id, X-Installation-Id, …
```

### 1.3 `Origin: null` (mở bằng `file://`) và `http://localhost`

```
access-control-allow-origin: null                     ← vẫn được phản chiếu
access-control-allow-origin: http://localhost:8080    ← vẫn được phản chiếu
```

### Ba kết luận rút ra

1. **CORS không phải rào cản.** Discord echo lại bất kỳ origin nào ⇒ web app gọi API trực tiếp được,
   **không cần proxy, không cần bridge**.
2. **`X-Captcha-Session-Id` là header hạng nhất của Discord.** Đây là bằng chứng sống cho **Waves#103**:
   app Electron hiện tại lưu `captcha_session_id` rồi **vứt đi** khi claim. Sửa chỗ này **có thể** làm
   captcha trong Electron chạy được mà không cần mẹo origin (Waves#105 có thể không cần nữa).
3. **Browser có danh tính TỐT HƠN Electron**: `User-Agent` là UA thật của Chrome, `sec-ch-ua` do trình
   duyệt tự sinh, và ta đặt `XSP.browser_user_agent = navigator.userAgent` ⇒ **khớp tuyệt đối 100%**,
   không phải giả lập như `discordIdentity.js` đang làm (và đang lệch — xem `RA-SOAT-ORBS-CLAIM.md` L3).

---

## 2. VÌ SAO "CẦU NỐI RENDER" LÀ Ý TỒI

Cầu nối nghĩa là: browser → server bro → Discord. Khi đó:

| Vấn đề | Hậu quả |
|---|---|
| Token đi qua server | Bro giữ token của **mọi** user ⇒ một lần lộ DB/log là mất sạch account của khách. Cam kết "100% local" thành lời nói dối |
| IP datacenter | Risk engine Discord dí captcha **nặng hơn** — đúng thứ đang cần giảm |
| Captcha | Server không giải được captcha ⇒ claim bị chặn cứng, không có đường nào |
| Hosting | Render sẽ nhận abuse report; free tier sleep 15 phút ⇒ chết giữa vòng |
| Pháp lý | Tự động hoá account user qua hạ tầng của bro = vi phạm ToS rõ ràng hơn nhiều so với app local |

⇒ **Bỏ hẳn ý tưởng cầu nối.** CORS đã mở, không cần.

---

## 3. CÁI GÌ PORT ĐƯỢC, CÁI GÌ KHÔNG

| Chức năng | Web | Ghi chú |
|---|---|---|
| Quét `/quests/@me` | ✅ | Đã chứng minh bằng curl + `web-poc` |
| Đọc số dư ví | ✅ | `GET /users/@me/virtual-currency/balance` |
| Claim không captcha | ✅ | `POST claim-reward`, đúng body như `buildClaimBody()` |
| Tiến độ video quest | ⚠️ | Được, nhưng **tab phải mở**; Chrome bóp `setTimeout` ở tab nền (1 lần/phút sau 5 phút) |
| Tiến độ stream/game (heartbeat 30–60s) | ⚠️ | Như trên; nên dùng Web Worker + `wakeLock` |
| Treo 24/7 khi đóng tab | ❌ | Service Worker MV3 bị kill sau ~30s idle. **Không thể** thay Electron ở điểm này |
| CAPTCHA | ❌ | hCaptcha phải chạy trên origin `discord.com` — cùng bức tường với Electron |
| Nhiều account | ✅ | IndexedDB, mã hoá bằng WebCrypto + passphrase |
| Auto-update | ✅ | Web tự cập nhật — **lợi thế lớn nhất** so với Electron |
| Không cần cài đặt | ✅ | Đây là lý do chính để lên web |

---

## 4. BA KIẾN TRÚC — chọn cái nào

### A. Web "lite" (khuyến nghị bắt đầu)
PWA tĩnh trên Render Static ($0). Làm: quét, xem tiến độ, claim account **không bị challenge**, xem ví.
Account bị captcha → hiện badge "cần app" + link tải Electron.
- **Ưu:** 2–3 ngày, rủi ro thấp, không đụng engine hiện tại.
- **Nhược:** chưa thay được app.

### B. PWA "full" — port engine sang browser
Chia sẻ logic `src/questManager.ts` bằng cách thay `@discordjs/rest` (undici) bằng transport `fetch`.
Ước lượng **~70% code dùng lại được**, phần phải viết mới: transport, storage (IndexedDB), scheduler
(Web Worker), UI (đã có `renderer.js` — chạy được gần như nguyên nếu bỏ IPC).
- **Ưu:** một codebase, web + Electron dùng chung engine.
- **Nhược:** 2–3 tuần; mất khả năng treo khi đóng tab; captcha vẫn là tường.

### C. Hybrid: web là mặt tiền, Electron là động cơ
Web (Render) = landing + docs + changelog + tải app + dashboard. App = engine như hiện tại.
- **Ưu:** rẻ nhất, an toàn nhất, **không mất tính năng nào**.
- **Nhược:** vẫn phải cài app.

> **Đề xuất:** làm **A** trước (đo phản ứng người dùng, 2–3 ngày), rồi quyết định có đi **B**.
> Đừng nhảy thẳng vào B khi chưa biết user có chịu để tab mở hay không.

---

## 5. BẢO MẬT TOKEN TRÊN WEB — 4 điều bắt buộc

Web **nguy hiểm hơn** Electron ở khoản token, vì mọi script trên trang đều đọc được.

1. **KHÔNG `localStorage` trần.** `localStorage` là plaintext, XSS đọc 1 dòng là mất. Dùng
   **IndexedDB + WebCrypto AES-GCM**, key dẫn xuất từ passphrase người dùng (PBKDF2 200k vòng).
2. **CSP nghiêm**: `default-src 'self'; connect-src https://discord.com; script-src 'self'` — cấm
   mọi CDN/analytics. Một thẻ `<script src="cdn...">` là đủ để mất toàn bộ token của mọi user.
3. **Không lưu token khi không cần**: mặc định "nhớ phiên" = TẮT, chỉ giữ trong RAM.
4. **Nói thật với user**: trang web nào xin token Discord cũng giống trang phishing. Phải công khai
   mã nguồn + hướng dẫn user tự kiểm tra (DevTools → Network → chỉ thấy `discord.com`).

---

## 6. "NHIỀU NGƯỜI TRUY CẬP" — làm được, nhưng đọc phần rủi ro

**Về hạ tầng: đây là điểm mạnh tuyệt đối.** Toàn bộ logic chạy trên máy user ⇒ 1.000 user hay 100.000
user thì server bro vẫn chỉ phục vụ file tĩnh. Render Static free, không giới hạn băng thông đáng kể.

**Về phân phối:** Discord community → YouTube demo → TikTok → SEO "treo orb discord". PWA cài được
lên desktop như app thật (Chrome → Cài đặt), giải quyết bài toán "phải tải .exe".

**Rủi ro phải nói thẳng:**

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| Discord để ý → **ban wave** toàn bộ user cùng lúc | Cao | Không SEO công khai; phát hành trong community kín; cảnh báo trong app |
| Hosting nhận abuse/DMCA → mất domain, mất app | Trung bình | Giữ bản Electron làm kênh chính; web chỉ là "lite" |
| Trang web bị clone thành phishing để lừa token | Cao | Domain rõ ràng, công khai hash build, hướng dẫn user kiểm tra |
| User dán token vào trang lạ rồi đổ lỗi cho bro | Cao | Cảnh báo ngay trên trang + changelog công khai |

> Nói gọn: **càng đông càng nhanh bị ban.** App local phát tán chậm nhưng bền; web phát tán nhanh
> nhưng dễ mất tất cả trong một đêm. Bro chọn đánh đổi nào thì tôi làm theo, nhưng phải biết trước.

---

## 7. KẾ HOẠCH WAVES (đánh số tiếp, KHÔNG tái dùng số cũ)

> ⚠️ **Số canonical lấy từ `AGENT-BRIEF.md` §6 Track B — bảng dưới đây là bản nháp ban đầu**, đã được
> gộp vào đó. Chỉ dùng bảng dưới để đọc ý tưởng, **không dùng số ở đây khi tạo commit/issue**.

| Wave (canonical) | Việc | Kết quả |
|---|---|---|
| **#109** | Tách vỏ `core/` + `port.js` (24 hàm) + `shell-electron` — app Electron không đổi hành vi | Có hợp đồng duy nhất, 0 dòng UI sửa |
| **#110** | Adapter web: transport `fetch` thay `@discordjs/rest`, bỏ Gateway, scan + claim + ví | Engine chạy trong browser |
| **#111** | Storage: IndexedDB + WebCrypto (AES-GCM + PBKDF2), nhiều account, passphrase | Token không nằm plaintext |
| **#112** | Nhúng 12 font woff2 + clipboard + file picker + xuất log | Hiển thị tên giống 100% |
| **#113** | Engine loop trong tab + Web Worker + `wakeLock` + cảnh báo tab ẩn | Tiến độ chạy được khi tab nền |
| **#114** | Kiểm chứng 2 vỏ (pixel + DOM diff) | Bằng chứng "0 dòng lệch" |
| **#115** | CSP nghiêm + self-audit (`tools/web-csp-check.js`) + trang "cách kiểm tra an toàn" | Chống XSS/phishing |
| **#116** | PWA deploy Render Static + `/api/version` + telemetry ẩn danh | Đo được hiệu quả bản vá |

**Việc #103 (gửi `captcha_session_id`) nên làm TRƯỚC tất cả** — nó rẻ, và bằng chứng CORS ở mục 1.2 cho
thấy Discord có header `X-Captcha-Session-Id` hạng nhất. Có thể nó sửa luôn captcha cho **cả** Electron
**và** web. Đừng làm #105 (origin discord.com) trước khi #101 đo xong — xem `AGENT-BRIEF.md` quyết định D5.

---

## 8. RENDER — dùng thế nào cho đúng

| Thành phần | Plan | Giá | Ghi chú |
|---|---|---|---|
| Static site (PWA) | Free | **$0 vĩnh viễn** | Không tốn credit. Đây là nơi đặt web app |
| `/api/version` + `/api/event` | Starter 512MB | $7/tháng | Free tier **ngủ 15 phút**, cold start ~50s ⇒ check version lúc mở app bị chậm |
| Postgres (telemetry) | Free 1GB | $0 nhưng **hết hạn sau 30 ngày** | Đúng cái bro gọi là "free tier 1 tháng" — chỉ DB mới có hạn |
| Cron sync release | $0.00016/phút | ~$0.01/tháng | Gần như miễn phí |
| ~~Proxy Discord~~ | — | — | **KHÔNG LÀM** (mục 2) |

$50 ⇒ ~7 tháng Web Service, hoặc **vô thời hạn nếu chỉ dùng Static + Postgres free 30 ngày**.

---

## 9. CẦN BRO CHỐT

1. **Chọn A (web lite), B (PWA full), hay C (web làm mặt tiền)?** — tôi khuyên **A trước**.
2. **Chấp nhận mất "treo 24/7 khi đóng tab"** không? Đây là tính năng duy nhất web không làm được.
3. **Làm #103 trước** (gửi `captcha_session_id`) để xem có sửa được captcha cho cả 2 nền tảng không?
4. Có cần tôi dựng luôn `web/` từ `web-poc` thành PWA deploy-được lên Render Static ngay không?
