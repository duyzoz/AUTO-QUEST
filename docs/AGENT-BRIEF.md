---
doc: AGENT-BRIEF
project: AUTO-QUEST (ZoZ Development)
repo: https://github.com/duyzoz/AUTO-QUEST
app_version: 1.0.0
updated: 2026-10-28
owner: duyzoz
status: HANDOFF — phân tích xong, CHƯA sửa code claim
target: WEB (PWA) là hướng DUY NHẤT — mobile/iOS/IPA đã bị xoá 28/10/2026
next_wave: 101
read_order:
  - docs/AGENT-BRIEF.md          # file này — luật + bản đồ + backlog
  - docs/RA-SOAT-ORBS-CLAIM.md   # lỗi L1..L11 (bằng chứng dòng code)
  - docs/PORT-WEB-100-PHAN-TICH.md  # port web: kiểm kê + kiến trúc tách vỏ
  - docs/WEB-VERSION-KHA-THI.md  # bằng chứng CORS (curl thật)
---

# AGENT BRIEF — ĐỌC FILE NÀY TRƯỚC KHI GÕ DÒNG CODE NÀO

> **ĐÍCH ĐÃ CHỐT (28/10/2026): CHỈ CÒN WEB.** `mobile/` (React Native iOS) + `build-ipa/` +
> `docs/HUONG-DAN-CAI-TROLLSTORE.md` **đã bị xoá khỏi repo** theo yêu cầu chủ dự án.
> Đừng khôi phục, đừng viết code iOS, đừng nhắc TrollStore như một kênh phát hành.
> Đường đi: **Electron (hiện tại) → tách vỏ → PWA web (đích)**.

> Mục đích: một agent khác (hoặc bro sau 2 tuần) mở repo lên, đọc **đúng 1 file này** là biết
> đang ở đâu, vì sao lại đi hướng này, việc tiếp theo là gì, và **cái gì bị cấm**.
> Mọi kết luận ở đây đều có nguồn: file + dòng, hoặc lệnh curl đã chạy. Chỗ nào còn là giả thuyết
> thì ghi **[CẦN ĐO]** — không được viết như sự thật.

---

## 0. NẾU BẠN LÀ AGENT MỚI — 6 BƯỚC

1. Đọc README mục **Quy Trình Waves** + **`---- Log AI Agent ----`** (luật của chủ dự án).
2. Đọc file này hết. Đặc biệt **§2 LUẬT BẤT BIẾN** và **§7 CẤM**.
3. Đọc `docs/RA-SOAT-ORBS-CLAIM.md` — đó là **bằng chứng**, không phải ý kiến.
4. **KHÔNG sửa code claim** khi chưa chạy Waves#101 (probe). Lý do ở §5, quyết định D3.
5. Chọn wave kế tiếp trong §6 theo đúng **thứ tự phụ thuộc**, không nhảy cóc.
6. Xong việc: ghi 1 dòng vào `README.md` mục *Log AI Agent* (giữ đúng 3 dòng) + file
   `.brain/YYYY-MM-DD.txt`, và cập nhật **bảng trạng thái ở §6** của file này.

---

## 1. SẢN PHẨM LÀ GÌ (bản đồ 60 giây)

Ứng dụng Electron tự động làm **Discord Quests** và nhận **Orbs**. Chạy **local 100%**, không server.
Có **hai tiến trình**, và **đây là nguồn gốc của gần như mọi lỗi**:

```
┌─────────────────────────── Electron ────────────────────────────┐
│  MAIN (electron/main.js · 2.130 dòng · 32 ipcMain.handle)        │
│    · gọi Discord API bằng fetch, giữ token đã giải mã            │
│    · danh tính: electron/discordIdentity.js  (1.0.9262/641004)   │
│                                                                  │
│  RENDERER (electron/renderer/ · 12.497 dòng, web thuần 100%)     │
│    · KHÔNG có require/process/ipcRenderer/fetch — chỉ nói qua    │
│      đúng MỘT object: window.autoquest  (24 hàm, xem §3)         │
└──────────────────────────────────────────────────────────────────┘
                    ▲ spawn + IPC event
┌───────────────────┴──────────────────────────────────────────────┐
│  BOT CON (bot.ts 529 + src/*.ts 2.937 dòng)                      │
│    · engine quest: scan → doing → finish → redeem → claim        │
│    · danh tính: src/constants.ts  (1.0.9259/621195)  ← KHÁC!     │
└──────────────────────────────────────────────────────────────────┘
```

### Bản đồ file (số dòng đo bằng `wc -l`, không ước lượng)

| File | Dòng | Vai trò | Ghi chú cho agent |
|---|---|---|---|
| `electron/main.js` | 2.130 | main process, 32 IPC handler, claim queue, captcha extract | **Đây là nơi claim thật sự xảy ra** (đường UI) |
| `electron/preload.js` | 59 | bridge → `window.autoquest` | Thêm hàm mới phải sửa cả đây + `renderer.js` |
| `electron/discordIdentity.js` | ~130 | danh tính Discord của main | Xem L3/L4 — đang lệch với bot |
| `electron/discordCdp.js` | ~300 | CDP vào Discord đang chạy | Dự phòng (Tầng 3), chưa có `jsClaimQuest` |
| `electron/displayNameStyle.js` | ~250 | 15 kiểu tên + tải 12 font woff2 | CORS: font **chỉ** cho origin discord.com |
| `electron/renderer/renderer.js` | 6.033 | toàn bộ UI/UX + hiệu ứng | **Web thuần** — 0 `require`, 0 `fetch` |
| `electron/renderer/styles.css` | 5.796 | toàn bộ style, theme sáng/tối | **Web thuần** — 0 `app-region` |
| `electron/renderer/index.html` | 668 | markup + CSP | **Web thuần** — chỉ 1 dòng CSP cần đổi khi port |
| `src/questManager.ts` | 1.634 | engine quest (lõi) | Claim, captcha, video/stream/play |
| `src/constants.ts` | 51 | danh tính Discord của bot | **L3: hardcode lệch** — phải đọc từ identity.json |
| `src/utils.ts` | 271 | headers, `X-Super-Properties` | **L3: `sec-ch-ua v=138` vs UA 148** |
| `src/client.ts` | 121 | REST + Gateway | Port web phải bỏ Gateway |
| `bot.ts` | 529 | entry, scan loop, auto-enroll | L10: auto-enroll trái chính sách |
| `tools/*` | 73 file | probe, build, CDP, đo pixel | Chạy probe **trước** khi tin bất cứ điều gì |

---

## 2. LUẬT BẤT BIẾN (vi phạm = revert ngay, không thương lượng)

| ID | Luật | Vì sao |
|---|---|---|
| **I1** | Claim phải chạy **trong client này**. Không được biến "mở Discord" thành luồng chính; nút đó chỉ là fallback cuối. | Yêu cầu trực tiếp của chủ dự án, lặp lại nhiều lần |
| **I2** | Chỉ `HTTP 2xx` từ `claim-reward` **và** xác nhận `claimed_at`/ví tăng mới được coi là đã nhận. Token `P1_`, callback hCaptcha, 403·10008 **không phải** thành công. | Chống cộng orbs ảo (L9) |
| **I3** | Cấm bịa challenge. Không có `sitekey` ⇒ nói thật, không dựng modal rỗng. | Chống lừa người dùng |
| **I4** | Captcha **chỉ** xuất hiện khi Discord trả challenge. Không challenge ⇒ claim thẳng, không vòng vo. | Yêu cầu trực tiếp |
| **I5** | Hai đường claim (bot con + main) phải dùng **cùng một danh tính Discord**. | L3/L4 — đang lệch, đây là gốc của "acc này được acc kia không" |
| **I6** | Cấm hardcode `sku`, token, hay tài khoản. Mọi thứ **động theo token từng user**. | Luật tối thượng của dự án |
| **I7** | Cấm relay captcha / 2captcha / dịch vụ giải hộ. | Trái I1+I3, và là lý do ăn ban |

**Định nghĩa "nhận ORBS thật 100% trong client"** (dùng làm tiêu chí nghiệm thu, đừng tự lừa mình):
1. Không cần mở app Discord.
2. Không challenge ⇒ claim thẳng; toast "Đã nhận N Orbs" **chỉ sau** HTTP 2xx.
3. Có challenge ⇒ puzzle hiện **trong modal của app**; giải xong ⇒ Discord trả 2xx ⇒ thẻ sang
   "Đã nhận" **và** số dư ví tăng (đọc lại `/users/@me/virtual-currency/balance`).
4. Không giải được ⇒ thẻ giữ "Chưa nhận" + badge lý do + nút "Nhận lại"; **không** cộng orbs ảo.

---

## 3. HỢP ĐỒNG DUY NHẤT: `window.autoquest` — 24 HÀM

Renderer **không** đụng Node, **không** `fetch`. Toàn bộ giao tiếp đi qua 24 hàm (đếm bằng grep,
không đoán). Đây là **lý do** port web khả thi: chỉ cần thay object này, không đụng 12.497 dòng UI.

| Nhóm | Hàm | Electron hiện tại | Web thay bằng |
|---|---|---|---|
| Discord | `authCheck` `fetchOrbs` `claimQuest` `dnsRead` | fetch trong main | fetch trong trang (CORS đã đo **mở**) |
| Lưu trữ | `getConfig` `saveConfig` `accountsList` `accountsAdd` `accountsRemove` `accountsSetActive` | JSON + `safeStorage` | IndexedDB (+ WebCrypto) |
| Clipboard | `readClipboard` `writeClipboard` | Electron clipboard | `navigator.clipboard` |
| File | `userTokenImportTxt` | `showOpenDialog` | `<input type=file>` |
| Log | `log:save` | `showSaveDialog` | tải file `.log` |
| Link | `openUrl` | `shell.openExternal` | `window.open` |
| Dữ liệu | `openDataFolder` | `shell.openPath` | **không tương đương** → "Xuất .json" |
| Tiến trình | `start` `stop` `getState` | `spawn` bot.js | engine trong tab |
| Sự kiện | `onLog` `onEvent` `onState` | IPC | callback trực tiếp |
| Font tên | `dnsFont` | tải + cache đĩa | nhúng 12 woff2 (~308KB) |
| CDP | `cdpStatus` | cổng debug | trả `available:false` |

> Thêm/bớt hàm ⇒ sửa **3 chỗ**: `preload.js`, `main.js` (handler), `renderer.js` (gọi). Không có chỗ thứ 4.

---

## 4. TRẠNG THÁI HIỆN TẠI

### Đã xong (không làm lại)

| Wave | Nội dung | Nguồn |
|---|---|---|
| `#96` | 7 hạng mục UI/UX (brand, khung xanh, logout, quét %, acc list, login veil) | `docs/` + memory |
| `#97–#100` | Đóng gói + claim/captcha: che metadata challenge, hàng đợi claim theo account, dedupe | `docs/WAVES-97-100-ORB-CLAIM.md` |
| `v1.0.0` | Phát hành: `Auto.Quest.Setup.1.0.0.exe` (84.85MB) + portable (84.33MB) + SHA256SUMS | GitHub Releases id `411911191` |

### Đang lỗi (chi tiết + dòng code ở `RA-SOAT-ORBS-CLAIM.md`)

| ID | Lỗi | Mức | Wave fix |
|---|---|---|---|
| **L1** | `captcha_session_id` bị lưu rồi **vứt đi** khi claim | 🔴 Cao nhất | #103 |
| **L2** | Cổng `challengeOpened` biến hCaptcha passive thành **ngõ cụt 100%** | 🔴 | #104 |
| **L3** | Hai danh tính Discord trong cùng app (UA/XSP/`sec-ch-ua` lệch) | 🔴 | #102 |
| **L4** | `X-Installation-Id` dùng chung cho mọi account ⇒ liên kết account | 🔴 | #102 |
| **L5** | Bot chặn claim **vĩnh viễn**, không phát lại event, không nút thử lại | 🟠 | #106 |
| **L6** | UI claim xong bot không biết / bot claim xong ví không cập nhật | 🟠 | #106 |
| **L7** | `claimBusy` có 2 đường thoát **không reset** + không timeout IPC | 🟠 | #106 |
| **L8** | Video quest `enrolled_at` NaN ⇒ loop 7s vô hạn, 0 request, 0 log | 🟠 | #108 |
| **L9** | `res.ok` coi mọi 2xx là "đã nhận", không kiểm body | 🟡 | #108 |
| **L10** | Bot tự enroll trong mode `run` (trái chính sách ghi trong code) | 🟡 | #108 |
| **L11** | Scan % không bao giờ 100%; `lastClaimAt` reset mỗi vòng | 🟢 | #108 |

**Cách đọc triệu chứng người dùng → lỗi:**

| Người dùng nói | Lỗi thật |
|---|---|
| "account này nhận được, account kia không" | **L3 + L4** (risk theo account) |
| "kẹt ở đó, không nhận được" | **L5** (chặn vĩnh viễn) + **L7** (claimBusy) |
| "tự nhận là đã giải captcha dù chưa hiện captcha" | **L2** (passive pass + cổng chặn) |
| "giải xong vẫn không nhận" | **L1** (thiếu `captcha_session_id`) + origin `127.0.0.1` |
| "treo im, không log" | **L8** (video quest NaN) |

---

## 5. DECISION LOG — hướng đã chốt (kèm lý do, để agent sau không mở lại)

| ID | Quyết định | Lý do / bằng chứng | Ngày |
|---|---|---|---|
| **D1** | **KHÔNG** dùng Render (hay bất kỳ server) làm cầu nối tới Discord API | Discord **phản chiếu mọi Origin** (kể cả `null`) và cho phép `Authorization`, `X-Super-Properties`, `X-Captcha-Session-Id` ⇒ trình duyệt gọi thẳng được, proxy là vô ích. Proxy còn: giữ token user (phá I1/I6), IP datacenter bị dí captcha nặng hơn, và **server không giải được captcha** | 2026-10-28 |
| **D2** | **KHÔNG** port UI sang bản thứ hai. Port bằng cách **TÁCH VỎ** (`core/ui` dùng chung + `port.js` 24 hàm + 2 adapter) | UI đã là web thuần 100% (0 `require`/`process`/`ipcRenderer`/`fetch`/`app-region` trong 12.497 dòng). Copy 2 bản ⇒ 2 tuần sau lệch | 2026-10-28 |
| **D3** | Sửa claim **phải bắt đầu bằng đo** (Waves#101), không sửa theo cảm giác | 3 giả thuyết lớn (thiếu session_id / sai origin / sai danh tính) **chưa phân biệt được** bằng code đọc. Đo 1 buổi rẻ hơn sửa sai 3 wave | 2026-10-28 |
| **D4** | hCaptcha (nếu cần) phải mint token trên **origin `https://discord.com` thật**, bằng `BrowserWindow` ẩn của chính app — **không mở app Discord** | Token mint ở `127.0.0.1` bị Discord verify theo host ⇒ không bao giờ được nhận. Đây là cách duy nhất thoả I1 | 2026-10-28 |
| **D5** | Waves#105 (origin) **chỉ làm sau** #101 và **chỉ khi** probe chứng minh origin là rào cản thật | Có khả năng #103 (gửi `captcha_session_id`) đã đủ. Không làm 2 lần | 2026-10-28 |
| **D6** | Web = **95% tính năng / 100% giao diện**. Không hứa 100% | 7 điểm chặn, 2 điểm **không thể** vá: `safeStorage` (DPAPI) không có tương đương, và `spawn` (treo 24/7 khi đóng tab) | 2026-10-28 |
| **D7** | Token trên web **không** lưu `localStorage` trần | Plaintext + XSS = mất token **toàn bộ user cùng lúc**. Bắt buộc IndexedDB + WebCrypto + passphrase, CSP nghiêm | 2026-10-28 |
| **D8** | Waves **chỉ tăng**, không tái dùng số. Claim track `#101–#108`, web track `#109–#116`, hạ tầng `#117` | Luật của chủ dự án | 2026-10-28 |
| **D9** | **Bỏ hẳn iOS/mobile/IPA. Đích duy nhất là WEB (PWA).** Đã xoá `mobile/`, `build-ipa/`, `docs/HUONG-DAN-CAI-TROLLSTORE.md`, dọn `.gitignore` + README | Chủ dự án chốt: *"tôi không cần mobile và ipa build nữa… bây giờ chỉ duy nhất là tôi muốn nó lên web"*. Giữ 2 nhánh nền tảng = gấp đôi công bảo trì cho một nhánh không dùng | 2026-10-28 |
| **D10** | Vì đích là web, **#102 (danh tính) + #103 (`captcha_session_id`) được ưu tiên CAO HƠN #105** | Web **không thể** dùng mẹo origin `discord.com` của #105 (trang web không mint được token ở origin discord.com). Nghĩa là trên web, cách duy nhất để giảm captcha là **hạ risk của danh tính + gửi đủ challenge**. #105 chỉ còn giá trị cho bản Electron | 2026-10-28 |

---

## 6. BACKLOG — 17 WAVES, CÓ PHỤ THUỘC VÀ TIÊU CHÍ NGHIỆM THU

Trạng thái: `TODO` · `WIP` · `DONE` · `BLOCKED`. Cập nhật cột này khi làm xong.

> **Ưu tiên sau khi chốt D9/D10 (đích = web):** làm **#101 → #102 → #103** (đo, rồi hạ risk danh tính,
> rồi gửi đủ challenge — cả 3 đều ăn cho **web**), tiếp **#106 + #108** (hết kẹt), rồi **nhảy sang Track B
> #109+**. Các wave `#104 · #105 · #107` là để hoàn thiện **bản Electron**, làm sau nếu còn thời gian —
> **#105 đặc biệt**: nó chỉ cứu được Electron, web không dùng được (xem D10).

### Track A — Claim ORBS (ưu tiên 1, làm trước)

| Wave | Việc | Phụ thuộc | Nghiệm thu (kiểm được) | Trạng thái |
|---|---|---|---|---|
| **#101** | **PROBE**: dump nguyên văn lỗi claim; dựng hCaptcha ở 3 origin; gửi 5 biến thể payload → ma trận `biến thể × status × code` | — | `docs/WAVES-101-KET-QUA.md` có ma trận + kết luận biến thể nào Discord nhận, origin nào sinh token dùng được | TODO |
| **#102** | **MỘT danh tính**: `identity.json` sinh 1 lần; bot đọc qua `AQ_IDENTITY_PATH`; sửa `browser_version`/`sec-ch-ua`; `installation-id` theo account, launch/heartbeat theo phiên | #101 (để biết có cần) | `tools/probe-identity.js` in bảng bot vs main ⇒ **0 dòng lệch**; UA == `XSP.browser_user_agent` == major `sec-ch-ua` | TODO |
| **#103** | **Gửi đủ challenge**: `captcha_session_id` trong body + header `X-Captcha-Session-Id`; cấm replay token | #101 xác nhận field | Log dev `captchaSessionPresent:true`; token không gửi 2 lần (Set theo account) | TODO |
| **#104** | **Bỏ ngõ cụt**: bỏ cổng `challengeOpened`; luôn thử 1 lần; 3 nhánh đều có kết cục rõ; thêm nút "Gửi CAPTCHA" + chẩn đoán dev | #103 | Không nhánh nào treo; không toast "đã nhận" khi chưa 2xx | TODO |
| **#105** | **Origin discord.com thật** (`captchaOrigin.js`: `ensure`/`mount`/`attachView`/`detach`) + fallback in-app | #101 chứng minh cần · #104 | `probe-origin-captcha.js` in `origin === 'https://discord.com'`; **account từng bị chặn claim được 200** ← MỐC THÀNH CÔNG | BLOCKED |
| **#106** | **Trạng thái theo account**: bỏ chặn vĩnh viễn (`claimAttempts` 2 lần/5 phút), `claimBusy` reset trong `finally` + timeout 25s, lưu badge + nút "Nhận lại", đồng bộ 2 chiều UI↔bot | #104 | `probe-claim-stuck.js` 4 kịch bản (đổi acc giữa request, treo, captcha fail, 429) ⇒ không kịch bản nào để `claimBusy=true` | TODO |
| **#107** | **"Nhận tất cả (N)"** + retry có kỷ luật (gap 1200ms, 429 theo `retry_after`, ≤1 retry/quest/vòng) | #106 | Probe đếm request thật: ≤ 1 req/1.2s/account, không 2 claim song song cùng account | TODO |
| **#108** | **Dọn nợ**: video quest NaN → `Date.now()` + `maxTicks`; scan % đạt 100%; auto-enroll thành công tắc (mặc định TẮT); `lastClaimAt` ra ngoài instance; `res.ok` phải kèm `claimed_at` | — | Không treo video quest; % quét chạm 100%; claim không cộng orbs ảo | TODO |

### Track B — Web (**ĐÍCH CHÍNH** — bắt đầu ngay sau #102/#103, không cần đợi hết Track A)

| Wave | Việc | Phụ thuộc | Nghiệm thu | Trạng thái |
|---|---|---|---|---|
| **#109** | **Tách vỏ**: `core/ui` (12.497 dòng, 0 sửa) + `core/engine` + `port.js` (24 hàm) + `shell-electron` | — | **App Electron hành vi không đổi một ly** — đây là tiêu chí của wave, không phải "chạy được là xong" | TODO |
| **#110** | **Adapter web**: transport `fetch` thay `@discordjs/rest`, bỏ Gateway (lấy user qua `/users/@me`), scan + claim + balance | #109 | Claim không captcha thành công từ browser; 0 request tới host khác `discord.com` | TODO |
| **#111** | **Storage**: IndexedDB + WebCrypto AES-GCM + PBKDF2 200k, nhiều account, 2 chế độ (plaintext/passphrase) | #110 | Token không xuất hiện dạng plaintext trong DevTools → Application | TODO |
| **#112** | **Tài nguyên hiển thị**: nhúng 12 font woff2 (~308KB) + clipboard + file picker + xuất log | #110 | So screenshot 2 vỏ: tên hiển thị **giống pixel** | TODO |
| **#113** | **Engine loop trong tab** + Web Worker + `wakeLock` + cảnh báo khi tab ẩn | #110 | Video/stream quest tiến được khi tab nền; stop = cờ, không kill | TODO |
| **#114** | **Kiểm chứng 2 vỏ** (pixel + DOM diff) | #109–#113 | Tool báo diff = 0 ở 6 màn hình chính, cả 2 theme | TODO |
| **#115** | **CSP nghiêm** + self-audit (`tools/web-csp-check.js`) + trang "cách kiểm tra an toàn" | #110 | CSP không có `unsafe-inline`; chỉ `connect-src https://discord.com` | TODO |
| **#116** | **PWA deploy Render Static** + `/api/version` + telemetry ẩn danh | #110 | Link công khai chạy được; banner "bản mới" hoạt động | TODO |

### Track C — Hạ tầng (tuỳ chọn)

| Wave | Việc | Ghi chú |
|---|---|---|
| **#117** | `/api/version` + telemetry (Render Web $7) + license/activation | **Không chứa token.** Static site $0. Postgres free chỉ 30 ngày |

---

## 7. CẤM (anti-goals — nếu agent định làm mấy việc này, dừng lại và hỏi)

| Cấm | Vì sao |
|---|---|
| Đưa bot claim / token user lên server (Render, VPS, cloud) | Phá I1+I6, IP datacenter bị dí captcha nặng hơn, ToS |
| Dùng 2captcha / relay captcha / "dịch vụ giải hộ" | Trái I1+I3+I7 |
| Mở app Discord làm luồng nhận chính | Trái I1 (yêu cầu trực tiếp của chủ dự án) |
| Bịa "đã nhận" khi Discord chưa trả 2xx | Trái I2 |
| Hardcode `sku`, token, tài khoản, hay quest id | Trái I6 |
| Copy `renderer.js` thành 2 bản song song | Trái D2 — sẽ lệch |
| Chạy `npm run build` / build EXE khi chưa được duyệt | Luật của chủ dự án |
| Khôi phục `mobile/`, `build-ipa/`, hoặc viết code iOS/TrollStore | Đã bị xoá theo yêu cầu chủ dự án (D9). Đích là web |
| Commit `node_modules/`, `build-release/exe/`, file token | `.gitignore` đã chặn — đừng `git add -f` |

---

## 8. CÁCH KIỂM CHỨNG (bắt buộc trước khi tin bất cứ điều gì)

```bash
# 1. LUÔN chạy trước mọi probe — backtick lạc làm Electron chết IM LẶNG dù node --check PASS
node tools/check-template-literals.js

# 2. Chạy probe trong Electron thật
env -u ELECTRON_RUN_AS_NODE npx electron tools/<probe>.js
node tools/cdp-reload.js 1500          # reload giữ phiên
AQ_REMOTE_DEBUG=9222 npm run dev       # bật cổng debug

# 3. Kiểm cú pháp sau khi sửa
node --check electron/main.js && node --check electron/preload.js
node --check electron/renderer/renderer.js
npm run build:bot                       # tsc cho bot
```

**Bẫy đã gặp, đừng lặp lại:**

- Envelope CDP là `r.result.result.value` — đọc `r.result.value` thì im lặng trả `undefined`.
- Bridge là `window.autoquest` (renderer alias `const api = window.autoquest`), **không phải** `window.api`.
- Regex chứa `\s`/`\(` trong template literal của probe **bị ăn backslash** ⇒ Electron chết 0 output.
  Dùng `.indexOf()` thay regex.
- `getBoundingClientRect()` bị nhân theo `transform` tổ tiên ⇒ đo cỡ bằng `offsetWidth/offsetHeight`.
- `getComputedStyle` **không** liệt kê `--*` ⇒ đọc `el.getAttribute('style')`.
- `capturePage` lần đầu trả surface cũ ⇒ `backgroundThrottling:false` + chụp 2 lần + tắt transition.
- Modal mở ⇒ chỉ đo trong `.modal-card`, kiểm bị đè bằng `elementFromPoint()`.
- So ảnh với chủ dự án phải **cùng theme**. Đổi theme bằng **bấm nút thật**.
- Contrast đo **pixel thật** (`tools/px-contrast.py`), không đo bằng `getComputedStyle` khi có gradient.

---

## 9. CÂU HỎI CHƯA CHỐT (agent không được tự quyết)

| ID | Câu hỏi | Ảnh hưởng |
|---|---|---|
| **OPEN-1** | Làm #101 ngay không? Cần **1 account đang có quest "Chưa nhận"** để đo | Không đo thì #105 là giả thuyết, và #102–#104 có thể sửa sai chỗ |
| **OPEN-2** | Chọn **A** (chỉ #102–#104 + #106–#108) hay **A+B** (làm #105 để nhận được cả account bị challenge)? | Quyết định có đạt "100% trong client" hay chỉ "vá được phần lớn" |
| **OPEN-3** | #105 chấp nhận app tải `https://discord.com/login` trong **1 cửa sổ ẩn** (không hiện UI Discord, không mở app) không? | Nếu không ⇒ chỉ còn CDP (phải có Discord chạy) ⇒ "100% trong client" **không khả thi**, phải nói thẳng |
| **OPEN-4** | Web đi hướng **lite** (A) hay **full PWA** (B) trong `WEB-VERSION-KHA-THI.md`? | 2–3 ngày vs 2–3 tuần |
| **OPEN-5** | Quest `PLAY_ACTIVITY` (`discordsays.com`) còn hay mất trên web? **[CẦN ĐO CORS — 5 phút]** | 1 loại quest |

---

## 10. MẪU BÁO CÁO KHI XONG 1 WAVE

```markdown
### Waves#<N> — <tên>
- Trạng thái: DONE | PARTIAL | BLOCKED
- Đã sửa: <file:dòng> … (mỗi dòng 1 thay đổi, kèm lý do)
- Bằng chứng: <lệnh đã chạy + output thật, không phải "đã kiểm tra">
- Không đụng: <những gì cố ý giữ nguyên>
- Rủi ro còn lại: <nếu có>
- Wave kế tiếp đề xuất: #<N>
```

> Quy ước commit: `waves#<N>: <việc đã làm>` — để `git log --grep "waves#"` tra được toàn bộ lịch sử.

---

## 11. LIÊN KẾT

| File | Nội dung |
|---|---|
| `docs/RA-SOAT-ORBS-CLAIM.md` | Lỗi L1–L11 + bằng chứng dòng code + kiến trúc 3 tầng |
| `docs/PORT-WEB-100-PHAN-TICH.md` | Port web: kiểm kê phụ thuộc, 7 điểm chặn, port ledger |
| `docs/WEB-VERSION-KHA-THI.md` | Bằng chứng CORS (3 lệnh curl thật) + bảo mật token web |
| `docs/WAVES-97-100-ORB-CLAIM.md` | Wave claim/captcha gần nhất đã làm |
| `web-poc/index.html` | Bản chạy thử: quét quest + xem ví + claim (chứng minh CORS) |
| `.brain/YYYY-MM-DD.txt` | Log chi tiết theo ngày |

---

*Cập nhật lần cuối: 2026-10-28 · người viết: agent phân tích (chưa sửa code) · chủ dự án: duyzoz*
