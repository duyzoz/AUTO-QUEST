# PORT 100% SANG WEB — PHÂN TÍCH (không code, không demo)

> **ĐỌC `docs/AGENT-BRIEF.md` TRƯỚC** — luật, decision log (D1..D8), thứ tự wave.
> File này trả lời đúng một câu: *"port sang web có giữ được 100% giao diện + tính năng không?"*
>
> - **Đánh số canonical**: track web là **#109–#116** (xem AGENT-BRIEF §6, Track B). Bảng ở §7 dưới
>   đây là **bản nháp ban đầu**, đã được gộp vào số canonical — **dùng số trong AGENT-BRIEF**.
> - **Phụ thuộc**: Track B **chỉ bắt đầu sau** khi Track A (claim) xong #103–#106. Port web khi claim
>   còn lỗi = port luôn lỗi sang nền tảng thứ hai.
> - Ngày: 2026-10-28 · Mọi con số dưới đây **đo từ repo thật** (`wc -l`, `grep -c`, `curl`), không ước lượng.

---

## 0. TRẢ LỜI THẲNG 3 CÂU

| Câu hỏi | Trả lời | Độ chắc |
|---|---|---|
| Giao diện + hiệu ứng có giống **100%** được không? | **CÓ. 0 dòng lệch — nếu làm đúng cách (tách vỏ, không copy 2 bản).** | Đo được |
| Tính năng có giống **100%** được không? | **KHÔNG. 95%.** Có 7 điểm chặn, 2 trong đó không thể vá | Đo được |
| "Chỉ đổi ngôn ngữ code thôi" có đúng không? | **Đúng với 12.497 dòng UI. Sai với 2.130 dòng `main.js`** — phần đó phải viết lại, không "đổi ngôn ngữ" được | Đo được |

**Cách duy nhất đạt "không lệch dòng nào": đừng port — hãy TÁCH VỎ.** (mục 5)

---

## 1. BẰNG CHỨNG: UI CỦA BRO ĐÃ LÀ CODE WEB THUẦN 100%

Tôi quét toàn bộ `electron/renderer/` tìm phụ thuộc Node/Electron:

| File | Số dòng | `require(` | `process.` | `ipcRenderer` | `fetch(` | `localStorage` | `app-region` | Kết luận |
|---|---|---|---|---|---|---|---|---|
| `index.html` | 668 | 0 | 0 | 0 | 0 | 0 | 0 | **copy nguyên** (sửa 1 dòng CSP) |
| `styles.css` | 5.796 | 0 | 0 | 0 | 0 | 0 | **0** | **copy nguyên, 0 dòng sửa** |
| `renderer.js` | 6.033 | **0** | **0** | **0** | **0** | **0** | 0 | **copy nguyên, chỉ thay 1 object** |
| **Tổng** | **12.497** | | | | | | | **giữ 100%** |

Đây là lý do kỹ thuật khiến câu "giữ y hệt giao diện" **khả thi**: `renderer.js` chạy trong
`contextIsolation: true, nodeIntegration: false` — tức nó **đã bị cấm** dùng API Node từ đầu.
Nó chỉ nói chuyện với thế giới bên ngoài qua đúng **một** object: `window.autoquest`.

Hệ quả: **không có một dòng CSS, một hiệu ứng, một animation nào phải viết lại.** Không có
`-webkit-app-region` (0 lần) nên cũng không có thanh tiêu đề tự vẽ để phải giả lập.

---

## 2. BỀ MẶT DUY NHẤT PHẢI THAY: 24 HÀM / 40 CHỖ GỌI

Đây là **toàn bộ** những gì renderer gọi ra ngoài (đếm bằng grep, không đoán):

| Nhóm | Hàm | Hiện tại (Electron) | Trên web thay bằng | Giữ 100%? |
|---|---|---|---|---|
| **Gọi Discord** (CORS đã đo là mở) | `authCheck` `fetchOrbs` `claimQuest` `dnsRead` | `fetch` trong main | `fetch` trong trang | ✅ 100% |
| **Lưu trữ** | `getConfig` `saveConfig` `accountsList` `accountsAdd` `accountsRemove` `accountsSetActive` | file JSON + `safeStorage` | IndexedDB | ⚠️ chức năng 100%, **bảo mật khác** (mục 3.1) |
| **Clipboard** | `readClipboard` `writeClipboard` | Electron clipboard | `navigator.clipboard` | ✅ 100% (cần user gesture) |
| **File** | `userTokenImportTxt` | `dialog.showOpenDialog` | `<input type="file">` | ⚠️ 95% (mất hộp thoại OS) |
| **Log** | `log:save` | `dialog.showSaveDialog` | tải file `.log` | ⚠️ 95% (thanh tải của browser) |
| **Mở link** | `openUrl` | `shell.openExternal` | `window.open` | ✅ 100% |
| **Thư mục dữ liệu** | `openDataFolder` | `shell.openPath` | **không có tương đương** | ❌ 0% → thay bằng "Xuất dữ liệu (.json)" |
| **Tiến trình** | `start` `stop` `getState` | `spawn` bot.js | engine chạy trong tab | ⚠️ UI 100%, **bản chất khác** (mục 3.2) |
| **Sự kiện** | `onLog` `onEvent` `onState` | IPC | callback trực tiếp | ✅ 100% (đơn giản hơn) |
| **Font tên** | `dnsFont` | tải từ discord.com + cache đĩa | **nhúng 12 file vào bundle** | ✅ 100% nếu nhúng (mục 3.3) |
| **CDP** | `cdpStatus` | cổng debug Discord | trả `available:false` | ❌ chỉ dev dùng, **0 ảnh hưởng user** |

**Tổng công thay: 24 hàm.** Không hơn. Đây là con số bro cần để dự tính.

---

## 3. BẢY ĐIỂM CHẶN — nói thật, không tô hồng

### 3.1 `safeStorage` (DPAPI) — KHÔNG có tương đương trên web
Hiện tại token được mã hoá bằng khoá của **Windows user** (`safeStorage`), trong suốt: mở app là vào,
không cần nhập gì. Trên web chỉ có 2 lựa chọn, **cả hai đều lệch đúng 1 thứ**:

| Cách | Được | Mất |
|---|---|---|
| Lưu plaintext trong IndexedDB | UX y hệt (mở là vào) | **Mất bảo mật** — XSS đọc 1 dòng là mất token |
| Mã hoá WebCrypto + passphrase | Bảo mật tương đương | **Mất UX** — mỗi lần mở phải nhập passphrase |

Không có cách thứ 3. Đây là điểm **không thể 1:1**, phải chọn.

### 3.2 `spawn` tiến trình con — engine phải sống trong tab
Electron: bot chạy process riêng, đóng app là chết sạch, `taskkill` dọn tuyệt đối.
Web: engine là vòng lặp trong trang. Đóng tab = dừng. **Mất "treo 24/7"** — đây là tính năng cốt lõi
của app. Không có Service Worker nào cứu được (MV3 bị kill sau ~30 giây idle).

### 3.3 Font hiển thị tên — bị CORS chặn, phải nhúng
`displayNameStyle.js` tải 12 file woff2 từ `https://discord.com/assets/<hash>.woff2`.
Tôi đã đo header thật:

```
HTTP/1.1 200 OK
Content-Type: font/woff2
Content-Length: 25680
Access-Control-Allow-Origin: https://discord.com     ← CHỈ discord.com, KHÔNG phản chiếu
```

⇒ Browser ở origin khác **không tải được** (cả `fetch` lẫn `@font-face`).
**Cách xử lý:** nhúng 12 file vào bundle web (12 × 25,7KB ≈ **308KB**). Khi đó hiển thị giống 100%.
Đánh đổi: bundle nặng thêm 308KB + phân phối lại file font của Discord (app hiện tại cũng đã tải và
cache chúng trên máy user, nên không phải chuyện mới).

### 3.4 `discordsays.com` — quest loại PLAY_ACTIVITY  **[CẦN ĐO]**
`questManager.ts:1576-1590` gọi `https://<appId>.discordsays.com/.proxy/acf/authorize` rồi
`/quest/progress`. Đây là domain khác, **chưa đo được CORS** (cần 1 quest PLAY_ACTIVITY thật để thử).
Nếu bị chặn ⇒ **mất 1 loại quest**. Đây là câu hỏi duy nhất còn mở.

### 3.5 hCaptcha — y nguyên bức tường của Electron
Widget phải chạy trên origin `discord.com`. Trên web cũng vậy, **không xấu hơn, không tốt hơn**.
Nghĩa là: account bị challenge vẫn cần Waves#103/#105, không liên quan web hay app.

### 3.6 Hộp thoại hệ điều hành — không có
`showOpenDialog` / `showSaveDialog` / `shell.openPath`. Thay bằng file picker + tải file. Chức năng
đủ, nhưng **không phải "y hệt"** về mặt cảm giác.

### 3.7 CDP + `webContents.debugger` — mất hoàn toàn
Chỉ dùng khi dev. Không ảnh hưởng người dùng cuối.

---

## 4. RIÊNG NHÓM "HIỆU ỨNG AVATAR" — GIỮ 100%

Bro nhấn mạnh phần này, nên tôi kiểm riêng:

| Thành phần | Cơ chế hiện tại | Trên web |
|---|---|---|
| Avatar, banner | `<img src="cdn.discordapp.com/...">` | ✅ y nguyên |
| Nameplate / palette | CSS custom property + ảnh CDN | ✅ y nguyên |
| Profile effect (video/layer) | `<img>` + CSS `--pe-*` | ✅ y nguyên |
| Avatar decoration | ảnh CDN | ✅ y nguyên |
| Theme colors | API → CSS var | ✅ y nguyên |
| Font kiểu tên (15 kiểu, 12 file) | tải runtime + data URL | ✅ nếu **nhúng** (mục 3.3) |
| Warm-up `img.decode()` khi đổi account | JS thuần | ✅ y nguyên |

Hai điểm tôi kiểm để chắc chắn không có bẫy:
- **CDN có CORS mở**: `Access-Control-Allow-Origin: *` (đo thật) ⇒ kể cả `fetch` ảnh cũng được.
- **Không có `<canvas>` thật**: 9 lần chữ "canvas" trong `renderer.js` chỉ là **tên CSS variable**
  (`--pe-canvas-w`, `--pe-canvas-h`) ⇒ **không có nguy cơ "tainted canvas"** — bẫy kinh điển khi
  chuyển app ảnh sang web.

⇒ Nhóm hiệu ứng giữ **100%**, chỉ tốn thêm 308KB font.

---

## 5. KIẾN TRÚC ĐỂ "KHÔNG LỆCH DÒNG NÀO" — TÁCH VỎ

Nếu bro copy `renderer.js` thành 2 bản (Electron + web) thì **sau 2 tuần sẽ lệch**, vì mọi lần sửa
UI phải sửa 2 chỗ. Cách duy nhất giữ 100% vĩnh viễn:

```
core/                        ← DÙNG CHUNG, không phân biệt nền tảng
  ui/      index.html · styles.css · renderer.js     ← 12.497 dòng, KHÔNG ĐỔI
  engine/  questManager · quest · taskTypes · utils  ← đổi transport: rest → fetch
  port.js  ← ĐỊNH NGHĨA 24 hàm ở mục 2 (hợp đồng duy nhất)

shell-electron/   adapter: ipcRenderer + safeStorage + spawn + dialog
shell-web/        adapter: fetch + IndexedDB + navigator.clipboard + <input file>
```

Điểm mấu chốt: `renderer.js` chỉ gọi `window.autoquest.<24 hàm>`. Mỗi vỏ tự gắn object đó.
⇒ **Cùng một file UI, hai vỏ khác nhau.** Sửa UI 1 lần, cả 2 nền tảng ăn theo. Đây là định nghĩa
của "không lệch dòng nào".

---

## 6. PORT LEDGER — dự tính theo file

| Việc | File | Dòng phải đụng | Ghi chú |
|---|---|---|---|
| Tách `core/ui` khỏi `electron/renderer` | 3 file | **0** | chỉ đổi đường dẫn |
| Định nghĩa `port.js` (24 hàm) | mới | ~150 | hợp đồng |
| Adapter Electron (giữ nguyên hành vi) | mới | ~250 | bọc IPC cũ |
| Adapter Web | mới | ~450 | fetch + IndexedDB + clipboard + file |
| Transport `fetch` thay `@discordjs/rest` | `engine/` | ~200 | bỏ undici |
| Bỏ gateway WebSocket (lấy user qua `/users/@me`) | `engine/client.ts` | ~60 | đơn giản hơn |
| Bỏ `updateLatestBuildVersion()` (CORS chặn) | `engine/utils.ts` | ~5 | hardcode build number |
| Storage IndexedDB + WebCrypto | mới | ~300 | 2 chế độ: plaintext / passphrase |
| Nhúng 12 font | mới | ~40 + 308KB | giữ hiển thị 100% |
| Engine loop trong tab (thay `spawn`) | mới | ~200 | stop = cờ, không kill process |
| CSP cho web | `index.html` | **1 dòng** | thêm `connect-src https://discord.com` |
| Kiểm chứng 2 vỏ giống nhau | tool | ~150 | so pixel + so DOM |

**Tổng: ~1.800 dòng mới/sửa trên nền 12.497 dòng UI giữ nguyên.**

---

## 7. ƯỚC LƯỢNG (1 người, có test, không tính captcha)

> ⚠️ **Bảng dưới là bản nháp.** Số canonical: **#109** tách vỏ · **#110** adapter web · **#111** storage
> · **#112** font/clipboard/file · **#113** engine loop · **#114** kiểm chứng 2 vỏ · **#115** CSP
> · **#116** PWA + version/telemetry. Xem `AGENT-BRIEF.md` §6 Track B (có tiêu chí nghiệm thu).

| Wave | Việc | Thời gian | Rủi ro |
|---|---|---|---|
| #109 | Tách `core/` + `port.js` + adapter Electron (app vẫn chạy y như cũ) | 2 ngày | **Cao nhất** — đụng app đang chạy |
| #110 | Adapter web: fetch transport, bỏ gateway, quét + claim + ví | 1,5 ngày | Trung bình |
| #111 | Storage IndexedDB + WebCrypto (2 chế độ) | 1,5 ngày | Trung bình |
| #112 | Nhúng font + clipboard + file + log | 0,5 ngày | Thấp |
| #113 | Engine loop trong tab + cảnh báo khi tab ẩn | 1 ngày | Trung bình |
| #114 | Kiểm chứng 2 vỏ giống nhau (pixel + DOM) | 1,5 ngày | Thấp |

**≈ 8–9 ngày làm việc.** Sau #109, app Electron **không được phép** khác hành vi — đó là tiêu chí
nghiệm thu của wave đó.

---

## 8. NHỮNG GÌ PHẢI CHẤP NHẬN MẤT (nói thẳng)

1. **Treo 24/7 khi đóng tab/app** — mất. Đây là tính năng cốt lõi, web không làm được.
2. **Token nhớ phiên mà vẫn mã hoá** — chỉ được chọn 1 trong 2.
3. **Hộp thoại OS** — mất, thay bằng file picker/tải file.
4. **CDP** — mất (dev-only).
5. **Quest PLAY_ACTIVITY** — có thể mất, chờ đo CORS.

Nếu 5 điểm trên chấp nhận được ⇒ web đạt **95%** và **UI/UX 100%**.

---

## 9. CHỐT

- **Giao diện, hiệu ứng, avatar effect: 100% — khả thi thật**, vì UI đã là web thuần và không có
  `<canvas>`/`fetch`/Node API nào cản.
- **Tính năng: 95%**, không phải 100% — và tôi sẽ không nói 100% chỉ để bro vui.
- **Đừng viết 2 bản song song.** Tách `core/` rồi làm 2 vỏ. Đó là cách duy nhất "không lệch dòng nào"
  giữ được lâu, chứ không chỉ đúng trong ngày đầu.
- **Trước khi làm**: đo CORS của `discordsays.com` (mục 3.4) — 5 phút, quyết định 1 loại quest còn
  hay mất. Và làm **Waves#103** (gửi `captcha_session_id`) vì nó ảnh hưởng cả 2 nền tảng.
