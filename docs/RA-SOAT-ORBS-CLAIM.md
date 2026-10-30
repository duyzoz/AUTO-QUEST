> **ARCHIVED — tài liệu lịch sử, không còn mô tả code hiện tại.**
> Nội dung dưới đây là ảnh chụp ngày 2026-10-28 (thời Electron / trước khi port web xong).
> Các file `electron/*`, `mobile/*`, `build-ipa/*`, `web-poc/*` đã bị xoá khỏi repo.
> Kiến trúc hiện tại (Web PWA v2.0.0): UI `web/app/` (`index.html`, `renderer.js`, `styles.css`),
> adapter `web/bridge.js` (hợp đồng `window.autoquest`, token IndexedDB AES-GCM),
> danh tính duy nhất `web/identity.js`, engine web `web/engine/` + file sinh ra
> `web/engine-bundle.js` (đừng sửa tay — chạy `npm run build:engine`), và
> `engine-src/` TypeScript chỉ còn là thiết kế tham khảo, không được biên dịch vào bundle.
> Tài liệu triển khai hiện tại: `docs/DEPLOY.md`. Lịch sử được giữ nguyên, không xoá.

# RÀ SOÁT TOÀN DỰ ÁN + PHÂN TÍCH LỖI NHẬN ORBS → WAVES#101+

> **ĐỌC `docs/AGENT-BRIEF.md` TRƯỚC FILE NÀY** — đó là luật chơi + backlog + decision log.
> File này là **BẰNG CHỨNG**: mỗi kết luận trích dòng code thật, không suy đoán.
>
> - **ID ổn định**: lỗi đánh `L1..L11`, quyết định đánh `D1..D8` (ở AGENT-BRIEF §5), wave `#101..`.
>   Khi commit / mở issue / viết báo cáo: **dùng đúng ID này**, không đặt tên mới.
> - **Trạng thái**: phân tích xong, **CHƯA sửa một dòng code claim nào**. Wave kế tiếp: **#101 (probe)**.
> - Ngày: 2026-10-28.
> - Phạm vi đọc: `bot.ts`, `src/*.ts` (9 file), `electron/main.js` (2.130 dòng), `electron/preload.js`,
>   `electron/discordIdentity.js`, `electron/discordCdp.js`, `electron/renderer/renderer.js` (6.033 dòng),
>   `electron/renderer/index.html`, `docs/*.md`.
> - Chỗ nào còn là giả thuyết thì ghi rõ **[CẦN PROBE #101]** — **cấm** đọc thành sự thật.

---

## 0. TL;DR — 6 dòng

1. Client có **HAI đường claim** dùng **HAI danh tính Discord khác nhau** (bot con `1.0.9259/build 621195`
   vs main `1.0.9262/build 641004`) ⇒ cùng 1 account bị Discord thấy như **2 client lạ** ⇒ risk-engine
   dí captcha **theo từng account** ⇒ "account này nhận được, account kia không".
2. Khi có captcha, code **lưu `captcha_session_id` rồi VỨT ĐI**, không gửi lại trong body claim
   ⇒ token hCaptcha hợp lệ vẫn bị Discord trả `captcha-required` / `403·10008`.
3. Cổng `ctx.challengeOpened` **chặn cứng** việc gửi token. hCaptcha ở sitekey enterprise của Discord
   thường **tự tick xanh (passive) mà không mở puzzle** ⇒ `open-callback` không bắn ⇒ app **không gửi gì**
   ⇒ đúng hiện tượng bro thấy: *"tự nhận là đã giải xong captcha mặc dù chưa hiện captcha"* + **kẹt**.
4. Bot chặn claim **vĩnh viễn** trong phiên (`captchaBlockedClaims`) và **không phát lại event** ⇒ vòng
   loop sau quest nằm im ở tab "Chưa nhận", không log, không nút thử lại ⇒ "toàn bị kẹt ở đó".
5. `claimBusy` có **2 đường thoát sớm không reset** ⇒ nút kẹt "Đang nhận…" vĩnh viễn, bấm không ăn.
6. Muốn "nhận thật 100% ngay trong client, captcha do Discord xác minh qua API" thì **phải cho hCaptcha
   chạy trên origin `https://discord.com` thật** (WebContents ẩn của chính app, không mở app Discord)
   — đó là **Waves#105**, đòn quyết định. Trước đó #101 đo, #102–#104 vá lỗi logic.

---

## 1. BẢN ĐỒ HIỆN TRẠNG — 2 đường claim, 2 danh tính

```
┌─ UI (renderer.js) ────────────────────────────────────────────────────────────┐
│  Nút "Nhận N Orbs" trên thẻ  →  runClaim()  →  api.claimQuest()               │
│                                                    │                          │
│  Modal CAPTCHA (index.html#captchaModal)  ←── res.captchaRequired             │
│    hCaptcha render trên origin  http://127.0.0.1:<port>  (app server)         │
│    submitCaptchaResponse() → runClaim({token, rqdata, rqtoken})   ← THIẾU sessionId
└────────────────────────────────────┬──────────────────────────────────────────┘
                                     ▼
                        electron/main.js  ipcMain 'quests:claim'
                        headers = discordHeaders()   ← 1.0.9262 / build 641004
                        hàng đợi enqueueClaim(accountId) · gap 1200ms · retry 429 x1

┌─ Bot con (bot.js ← src/questManager.ts) ──────────────────────────────────────┐
│  Auto ORBs: scan → doingQuest → finishQuest → redeemQuest → postClaim         │
│                        @discordjs/rest + Utils.makeHeaders()                  │
│                        Constants.USER_AGENT 1.0.9259 / build 621195 ← KHÁC!    │
│  captcha → report('quest:captcha') → UI mở modal                              │
│  captcha → captchaBlockedClaims.add(quest.id)  ← CHẶN VĨNH VIỄN, KHÔNG RESET  │
└───────────────────────────────────────────────────────────────────────────────┘
```

Hệ quả kiến trúc: **captcha phát cho request của bot, nhưng token lại được gửi bằng request của main.**
Hai request khác identity, khác `X-Super-Properties`, khác session ⇒ Discord không ghép được cặp
"challenge ↔ phản hồi" trừ khi `captcha_session_id` được gửi kèm — mà nó đang bị bỏ.

---

## 2. LỖI ĐÃ XÁC ĐỊNH (bằng chứng dòng code)

### L1 — `captcha_session_id` bị vứt bỏ (ứng viên số 1 khiến "giải rồi vẫn không nhận")

| Vị trí | Nội dung |
|---|---|
| `electron/main.js:1624-1630` | `extractCaptchaFromError()` **có** trả `sessionId: errorBody.captcha_session_id` |
| `electron/main.js:1599-1608` | `buildClaimBody()` chỉ gắn `captcha_key`, `captcha_rqdata`, `captcha_rqtoken` — **không có `captcha_session_id`** |
| `electron/renderer/renderer.js:2066-2070` | `submitCaptchaResponse()` gửi `{ token, rqdata, rqtoken }` — **bỏ `ctx.challenge.sessionId`** |
| `src/questManager.ts:696-702` | Bot cũng chỉ report `sitekey/sessionId/rqdata/rqtoken` để hiển thị, không dùng lại |

Chính `tools/e2e-captcha.sh:32` (probe cũ) **có** truyền `sessionId=$SID` — nghĩa là bản thử nghiệm
biết cần, còn bản production hiện tại thì làm rơi mất. **[CẦN PROBE #101 xác nhận]**: gửi kèm
`captcha_session_id` (body) và/hoặc header `X-Captcha-Session-Id` rồi so HTTP code.

### L2 — Cổng `challengeOpened` khoá cứng ⇒ không bao giờ gửi được token

```js
// renderer.js:2048-2061
if (!ctx.challengeOpened) {
  ctx.submitted = false;
  ... 'hCaptcha chỉ trả phản hồi passive; chưa có thử thách tương tác để xác minh.'
  return;                    // ← KHÔNG BAO GIỜ GỬI
}
```

`challengeOpened` chỉ được bật bởi `open-callback` (`renderer.js:1889-1893`). Với sitekey enterprise
của Discord, hCaptcha rất hay **auto-pass**: widget hiện **dấu tick xanh** nhưng **không mở puzzle**
⇒ không có `open-callback` ⇒ app **từ chối gửi** ⇒ người dùng thấy "đã tick xanh rồi mà vẫn không nhận".
Đây chính là mô tả *"client lại tự nhận là đã giải xong captcha mặc dù chưa hiện captcha"*.

Thiết kế này an toàn về mặt "không giả thành công", nhưng **sai về mặt hành vi**: nó biến mọi lần
hCaptcha passive thành **ngõ cụt 100%**. Mà "thành công" đã được bảo vệ ở tầng khác (`res.ok`), nên
việc chặn ở đây là chặn oan.

### L3 — Hai danh tính Discord trong cùng một app

| Nguồn | client_version | build | browser_version | Chrome trong UA | `sec-ch-ua` |
|---|---|---|---|---|---|
| `electron/discordIdentity.js:25-29` | `1.0.9262` | `641004` | `148.0.0.0` | 148.0.7778.280 | (không gửi) |
| `src/constants.ts:5,11,19,21` | `1.0.9259` | `621195` | **`42.11.4`** ❗ | 148.0.7778.280 | **`v="138"`** ❗ (`src/utils.ts:50`) |

3 chỗ lệch trong XSP của bot: `browser_version` đang là **phiên bản Electron** (sai ngữ nghĩa — phải là
major của Chrome), `sec-ch-ua` ghi 138 trong khi UA ghi 148, `client_version`/`build` cũ hơn main.
Discord đối chiếu UA ↔ XSP ↔ `sec-ch-ua`; lệch = cờ đỏ. **Đây là lý do khách quan nhất khiến tỉ lệ
captcha khác nhau giữa các account và giữa 2 đường claim.**

Ngoài ra `src/utils.ts:20` hardcode `x-discord-timezone: Asia/Saigon` còn main dùng `Intl` — hai múi giờ
cho cùng một account. `src/utils.ts:44` referer `/channels/@me` vs main `quest-home` cho route quest.

### L4 — Dùng chung `X-Installation-Id` / heartbeat / launch-id cho MỌI account

`electron/discordIdentity.js:113-115` sinh **một lần lúc nạp module**:
```js
const SESSION_HEARTBEAT_ID = randomSessionId();
const SESSION_LAUNCH_ID    = randomSessionId();
const INSTALLATION_ID      = randomSessionId();
```
Mọi account trong app gửi **cùng** 3 giá trị này ⇒ Discord thấy một "cài đặt client" đang đăng nhập
nhiều account ⇒ **liên kết account** ⇒ account nào "nặng" thì bị dí captcha, account "sạch" thì không.
Đúng hiện tượng bro báo.

### L5 — Bot chặn vĩnh viễn, không phát lại event, không có nút thử lại

```ts
// src/questManager.ts:529-535
if (captchaBlockedClaims.get(this.client)?.has(quest.id)) {
  return { ok: false, captchaRequired: true, message: '... đã dừng claim tự động trong phiên account.' };
}
```
- Map này gắn theo `client` ⇒ sống suốt phiên account, **chỉ xoá khi claim thành công** (`:637`).
- Lần thứ 2 trở đi `redeemQuest()` return luôn, **không `report('quest:captcha')`** ⇒ UI không mở modal,
  không log, không có cách nào thử lại ngoài việc bấm tay trên thẻ (nếu thẻ còn `claimable`).
- `claimAllClaimable()` (`:279-297`) vẫn `attempted++` cho quest bị chặn ⇒ log kiểu
  *"Đã thử N claim; Discord chưa xác nhận nhận thưởng nào"* — nhìn như lỗi mạng, thực chất là bị chặn.

### L6 — UI claim thành công nhưng bot không biết; bot claim thành công nhưng UI không cập nhật ví

- `runClaim()` (`renderer.js:2132-2155`) claim qua **main**, chỉ `upsertQuest` + `fetchOrbBalance`.
  `QuestManager` trong bot vẫn tin quest chưa claim ⇒ vòng loop sau có thể claim lại (Discord trả 200
  idempotent nên không sao) nhưng **thống kê phiên** và **`getOrbsSummary()`** sai.
- Ngược lại `finishQuest()` của bot báo `quest:done` → `quest:claim` → UI đổi tab, nhưng **không đọc lại ví**
  (chỉ `runClaim` mới đọc) ⇒ số dư đứng im tới lần quét sau.

### L7 — `claimBusy` có thể kẹt vĩnh viễn

```js
// renderer.js:2107
if (quest.claimBusy) return;              // ← nếu cờ còn true thì bấm bao nhiêu cũng không chạy
// renderer.js:2130
if (activeAccountId !== String(currentUser?.id || '')) return;   // ← return mà KHÔNG reset claimBusy
```
Cộng thêm không có **timeout** cho `api.claimQuest` ⇒ request treo (mạng chập, Discord không trả) là
nút nằm "Đang nhận…" mãi. Đây là "kẹt ở đó" theo nghĩa đen.

### L8 — Video quest treo vô hạn nếu thiếu `enrolled_at` (NaN)

```ts
// src/questManager.ts:935-937
const enrolledAt = new Date(quest.userStatus?.enrolled_at as any).getTime();  // có thể NaN
...
const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;  // NaN
const diff = maxAllowed - secondsDone;                                        // NaN
if (diff >= speed) { ...post... }        // NaN >= 7 ⇒ false ⇒ KHÔNG BAO GIỜ GỬI
if (timestamp >= secondsNeeded) break;   // 7 >= 900 ⇒ false
await this.timeout(7000);                // lặp mãi, không request, không log, không thoát
```
`doingWatchStreamQuest` (`:1276-1277`) đã phòng bằng `|| Date.now()`; `doingWatchVideoQuest` thì chưa.
Hậu quả: cả tiến trình bot treo im lặng (không chết, không báo) — rất khớp với "kẹt".

### L9 — `res.ok` coi mọi 2xx là "đã nhận", không kiểm body

`electron/main.js:1798-1801`: `if (res.ok) return { ok: true, ... }`. Nếu Discord đổi shape (trả 200 kèm
`captcha_key` hoặc `user_status.claimed_at = null`), UI vẫn nhảy sang "Đã nhận" và cộng orbs ảo — trái
luật "chỉ tin server". Nên xác nhận thêm: `data.user_status?.claimed_at` có giá trị, hoặc đọc lại ví.

### L10 — Bot tự enroll trong mode `run` (trái chính sách ghi trong chính repo)

`bot.ts:434-447`: nếu quest chưa `enrolled_at` thì `acceptQuest()` hộ. Comment nói "do người dùng chủ
động chọn" nhưng `doingQuest()` (`questManager.ts:760-770`) lại từ chối quest chưa enroll ⇒ hai chỗ
mâu thuẫn. Quest enroll bằng API (location 11) khác quest enroll trong client thật ⇒ claim dễ 10008.

### L11 — Nhỏ nhưng gây nhiễu

- `bot.ts:214` báo `quest:scan-progress` với `done = inventory.length` nhưng `total = all.length` (đã lọc
  dead) ⇒ thanh % **không bao giờ 100%**, luôn nhảy cóc ở cuối.
- `questManager.ts:549-558` `lastClaimAt` nằm trong `QuestManager` — mà manager **tạo mới mỗi lần quét**
  ⇒ khoảng cách 1.2s bị reset giữa các vòng, không bảo vệ được gì.
- `questManager.ts:17-18` `WeakMap` theo `client` nhưng `QuestManager` mới mỗi vòng ⇒ comment "loop mode
  không gửi lại" chỉ đúng khi cùng client — đúng, nhưng dễ gây hiểu nhầm khi đọc.

---

## 3. VÌ SAO "ACCOUNT NÀY NHẬN ĐƯỢC, ACCOUNT KIA KHÔNG"

Discord quyết định captcha bằng **risk score của account + phiên**, không phải bằng code của mình.
Nhưng code của mình đang **đẩy risk lên** ở 4 điểm, và **mức đẩy khác nhau tuỳ account**:

| Yếu tố | Trong code | Tác động |
|---|---|---|
| 2 danh tính client | L3 | account vừa bị bot claim vừa bị UI claim ⇒ 2 "thiết bị" |
| `X-Installation-Id` dùng chung | L4 | nhiều account ⇒ 1 cài đặt ⇒ liên kết |
| UA/XSP/`sec-ch-ua` lệch nhau | L3 | cờ "client mod" |
| Request không có cookie/phiên thật | kiến trúc | điểm risk nền cao với account mới/ít hoạt động |

⇒ Account "sạch" (lâu năm, ít quest, ít đổi IP) vẫn qua; account "bẩn" (mới, nhiều quest, nhiều acc
trên 1 máy) bị chặn. **Không có cách nào hạ risk về 0 bằng HTTP thuần** — chỉ có cách dùng **phiên
Discord thật**. Đó là lý do #105 là đòn quyết định.

---

## 4. VÌ SAO "TỰ NHẬN LÀ ĐÃ GIẢI XONG CAPTCHA DÙ CHƯA HIỆN CAPTCHA"

Chuỗi thật đang xảy ra:

```
1. POST claim-reward → 400 { captcha_key:[...], captcha_sitekey, captcha_rqdata, captcha_rqtoken, captcha_session_id }
2. UI mở modal, dựng hCaptcha (sitekey của Discord) trên origin http://127.0.0.1:<port>
3. hCaptcha chấm "low risk" ⇒ PASSIVE: tự tick xanh, KHÔNG mở puzzle ⇒ open-callback KHÔNG bắn
4. Người dùng thấy "đã tick xanh" = "đã giải xong"
5. submitCaptchaResponse() thấy challengeOpened=false ⇒ KHÔNG gửi, hiện dòng lỗi kỹ thuật
6. Nếu có ai bỏ cổng đó và gửi token passive ⇒ Discord trả lại captcha-required / 10008
   (vì token mint ở host 127.0.0.1 + thiếu captcha_session_id)
7. Modal không đóng, quest vẫn "Chưa nhận" ⇒ KẸT
```

Ba nguyên nhân xếp chồng: **(a)** origin không phải `discord.com` ⇒ token không được Discord chấp nhận;
**(b)** thiếu `captcha_session_id`; **(c)** cổng `challengeOpened` biến (a)+(b) thành ngõ cụt.

---

## 5. KIẾN TRÚC ĐÍCH — 3 TẦNG (đúng yêu cầu "nhận thật trong client")

### Tầng 1 — Sửa sự thật & payload (bắt buộc, rẻ)
- Gửi đủ `captcha_key` + `captcha_rqdata` + `captcha_rqtoken` + **`captcha_session_id`**.
- Bỏ cổng `challengeOpened` cứng → **luôn thử gửi 1 lần**, phân loại kết quả trung thực.
- Một nguồn danh tính duy nhất cho bot + main.

### Tầng 2 — hCaptcha trên **origin discord.com thật** (đòn quyết định, vẫn 100% trong client)
Không mở app Discord. Trong **chính app này** tạo một `BrowserWindow` ẩn:

```
new BrowserWindow({ show:false, webPreferences:{ partition:'persist:aq-discord', sandbox:false } })
  → loadURL('https://discord.com/login')        // origin THẬT, cookie THẬT của discord.com
  → executeJavaScript: dọn body, dựng container + nạp js.hcaptcha.com
  → render widget với sitekey + rqdata Discord trả
  → hiển thị widget đó cho người dùng bằng WebContentsView đặt ĐÚNG vị trí #captchaSlot
  → token sinh ra có host = discord.com  ⇒ Discord verify được
```

- Người dùng **vẫn thấy modal của app**, vẫn giải trong app — chỉ khác "cái khung" bên trong là trang
  discord.com thật thay vì `127.0.0.1`.
- Token trả về qua IPC → claim với đầy đủ 4 trường.
- Fallback: nếu không nạp được discord.com (mạng chặn) → widget in-app như hiện tại + nói thật lý do.
- **[CẦN PROBE #101]** đo xem token trên origin thật có phải `P1_` (passive) hay `E0_/P0_` (đã giải),
  và claim có trả 200 không. Đây là câu hỏi duy nhất còn lại; mọi thứ khác đã rõ.

### Tầng 3 — CDP dự phòng (đã có hạ tầng, chỉ dùng khi Discord đang mở)
`electron/discordCdp.js` đã có `probe/wsConnect/evaluate/jsNavigateToQuest`. Bổ sung
`jsClaimQuest(questId)` gọi module `api` nội bộ của Discord ⇒ claim bằng chính phiên thật.
Chỉ bật khi `cdp.status().available` — **không bắt người dùng mở Discord**.

### So sánh 3 phương án

| | A. Chỉ vá lỗi (Tầng 1) | **B. Origin discord.com (Tầng 1+2)** | C. CDP |
|---|---|---|---|
| Trong client, không mở Discord | ✅ | ✅ | ❌ (cần Discord chạy) |
| Captcha do Discord xác minh | ⚠️ chỉ khi account không bị challenge | ✅ | ✅ |
| Account bị challenge nhận được | ❌ | ✅ (kỳ vọng) | ✅ |
| Công sức | 1 wave | 3–4 wave | 2 wave |
| Rủi ro | thấp | trung bình (CSP/network) | thấp nhưng phụ thuộc người dùng |

**Đề xuất: A → B, giữ C làm fallback tự động.**

---

## 6. WAVES ĐỀ XUẤT

### Waves#101 — PROBE: đo sự thật trước khi sửa (không đổi hành vi)
**Mục tiêu:** biến mọi giả thuyết thành số. **Không sửa code sản phẩm.**
- `tools/probe-claim-captcha.js`: với 1 account + 1 quest đang `claimable`:
  1. POST claim → lưu **nguyên văn** JSON lỗi (đã che token) → in ra **danh sách field có/không**:
     `captcha_key[]`, `captcha_sitekey`, `captcha_service`, `captcha_rqdata` (độ dài), `captcha_rqtoken`,
     `captcha_session_id`, `code`, `message`, `status`.
  2. Dựng hCaptcha ở **3 origin**: (a) `http://127.0.0.1:<port>` (hiện tại), (b) `https://discord.com/login`
     trong `BrowserWindow` ẩn, (c) CDP-in-Discord nếu có. Ghi lại: token prefix (`P1_`/`E0_`/`P0_`),
     `open-callback` có bắn không, thời gian tới callback.
  3. Gửi **5 biến thể** claim: `keyOnly` · `+rqdata+rqtoken` · `+session_id` · `+header X-Captcha-Session-Id`
     · `keyOnly` sai (đối chứng âm). In ma trận `biến thể × HTTP status × code`.
- **Nghiệm thu:** có bảng ma trận trong `docs/WAVES-101-KET-QUA.md`, kết luận được **chính xác** biến thể
  nào Discord chấp nhận và origin nào sinh token dùng được.
- **Rủi ro:** tốn 1 phiên captcha của 1 account; chỉ chạy khi bro đồng ý.

### Waves#102 — MỘT danh tính Discord duy nhất cho bot + main
- Tạo `electron/identity.js` sinh identity **một lần**, ghi `identity.json` vào `app.getPath('userData')`;
  bot đọc file này qua `process.env.AQ_IDENTITY_PATH` thay vì `src/constants.ts`.
- Sửa `src/constants.ts`: `browser_version = '148.0.0.0'`, `sec-ch-ua` khớp major của UA,
  `client_version`/`build` lấy từ cùng nguồn.
- `X-Installation-Id` **ổn định theo account** (hash userId), `X-Discord-Client-Launch-Id` +
  `X-Discord-Client-Heartbeat-Session-Id` **mới mỗi phiên account**.
- Thống nhất `x-discord-timezone` (Intl) + `Referer: https://discord.com/quest-home` cho route quest.
- **Nghiệm thu:** tool `tools/probe-identity.js` in bảng so sánh bot vs main ⇒ **0 dòng lệch**;
  log UA == `XSP.browser_user_agent` == `sec-ch-ua` major.
- **Kỳ vọng đo được:** trên N account, đếm số claim bị `captchaRequired` trước/sau (mục tiêu: giảm).

### Waves#103 — Gửi ĐỦ challenge khi claim (chữa ngõ cụt token)
- `buildClaimBody()`: thêm `captcha_session_id` (và header `X-Captcha-Session-Id` nếu #101 xác nhận).
- `submitCaptchaResponse()`: truyền `sessionId` xuống; `runClaim` chuyển tiếp.
- `postClaimOnce()`: **cấm** replay token sau 429/403 (đã có) + **cấm** dùng lại cùng token 2 lần (thêm
  `usedTokens` Set theo account).
- **Nghiệm thu:** log dev in `captchaSessionPresent: true` khi claim có captcha; token không bị gửi 2 lần.

### Waves#104 — Bỏ ngõ cụt `challengeOpened`, phân loại trung thực
- Bỏ điều kiện chặn cứng. Luồng mới:
  1. `open-callback` bắn → trạng thái "đang giải" → callback token → gửi.
  2. Không bắn nhưng có token (passive) → **vẫn gửi 1 lần** (tối đa 1/quest/challenge), UI ghi rõ
     "hCaptcha trả phản hồi tự động — đang để Discord xác minh".
  3. Discord trả `captcha-required`/10008 → **nói thật**: "token chưa được chấp nhận", **không** đổi
     trạng thái quest, **không** cộng orbs, mở nút "Lấy challenge mới" (không auto-loop).
- Thêm nút **"Gửi CAPTCHA"** trong modal để người dùng chủ động gửi (thay vì chỉ có "Làm mới").
- Hiện **chẩn đoán** trong modal: `service`, `sitekey` (rút gọn), `rqdata len`, `sessionId có/không`,
  prefix token — chỉ dev.
- **Nghiệm thu:** 3 nhánh đều có kết cục rõ ràng, **không nhánh nào treo**; không có toast "đã nhận" khi
  Discord chưa trả 2xx.

### Waves#105 — hCaptcha trên origin `discord.com` thật (ĐÒN QUYẾT ĐỊNH)
- Module mới `electron/captchaOrigin.js`:
  - `ensure()`: `BrowserWindow({show:false, webPreferences:{partition:'persist:aq-discord', sandbox:false}})`
    → `loadURL('https://discord.com/login')` (nhẹ, đúng origin, có cookie discord.com).
  - `mount(sitekey, rqdata)`: `executeJavaScript` dọn `body`, tạo `#aqcap`, nạp
    `https://js.hcaptcha.com/1/api.js?render=explicit&onload=...`, `hcaptcha.render()` với
    `sitekey`+`rqdata`, gắn callback trả token về main.
  - `attachView(rect)`: `WebContentsView` đặt **đúng rect** của `#captchaSlot` (main nhận rect từ renderer
    qua IPC) ⇒ người dùng thấy widget thật **trong modal của app**.
  - `detach()`: gỡ view, giữ window ẩn để tái dùng (đỡ nạp lại).
- Renderer: nếu `api.captchaOriginAvailable()` → mở modal nhưng **không** render widget in-app, thay vào
  đó gọi `api.captchaOriginMount(rect, challenge)`; nhận token qua event `captcha:origin-token`.
- Fallback tự động: lỗi nạp/không có mạng ⇒ quay về widget in-app (như #104) + log lý do.
- **Nghiệm thu:** `tools/probe-origin-captcha.js` in `origin === 'https://discord.com'`,
  `tokenPrefix`, `openCallbackFired`; và claim thử trả **200** trên account từng bị chặn.
- **Rủi ro:** CSP của discord.com (nếu chặn `js.hcaptcha.com` → dùng `webRequest` chèn header hoặc
  nạp trang `https://discord.com/login` vốn đã có hCaptcha sẵn); mạng yếu ⇒ timeout 8s rồi fallback.

### Waves#106 — Trạng thái claim theo account, hết kẹt im lặng
- Bỏ chặn vĩnh viễn ở bot: thay `captchaBlockedClaims` bằng `claimAttempts: Map<questId, {count, at, reason}>`
  — tối đa **2 lần/5 phút/quest**, hết hạn thì cho thử lại; **luôn `report`** lý do.
- Renderer: `claimBusy` **luôn** reset trong `finally` + **timeout 25s** cho `api.claimQuest`
  (`Promise.race`) ⇒ không bao giờ kẹt "Đang nhận…".
- Lưu `claimState` vào config theo account (`{questId:{status,code,at,reason}}`) ⇒ reload app vẫn hiện
  đúng badge "Cần CAPTCHA" / "Discord chưa xác nhận" + nút **"Nhận lại"**.
- Sau khi UI claim thành công ⇒ gọi `api.rescanQuest(id)` (hoặc đẩy event `quest:claim` vào bot) để
  `QuestManager` đồng bộ; ngược lại bot claim thành công ⇒ `fetchOrbBalance` ngay (hiện chỉ UI làm).
- **Nghiệm thu:** `tools/probe-claim-stuck.js` mô phỏng 4 kịch bản (account đổi giữa request, request treo,
  captcha fail, 429) ⇒ **không kịch bản nào để `claimBusy=true`**.

### Waves#107 — "Nhận tất cả" + retry có kỷ luật
- Nút **"Nhận tất cả (N)"** ở tab "Chưa nhận": claim tuần tự qua hàng đợi main (gap 1200ms), dừng khi
  gặp captcha để mở modal, tiếp tục sau khi xong; tổng kết `x/N thành công, y cần CAPTCHA, z lỗi`.
- Backoff: 429 → chờ `retry_after` (đã có) + **không** retry quá 1 lần/quest/vòng.
- **Nghiệm thu:** probe đếm request thật (≤ 1 req/1.2s/account), không có 2 claim song song cùng account.

### Waves#108 — Sửa lỗi treo & đồng bộ số liệu (dọn nợ kỹ thuật)
- `doingWatchVideoQuest`: `enrolledAt` NaN → fallback `Date.now()`; thêm `maxTicks` cứng (như các quest khác).
- `bot.ts` scan progress: dùng `total` = số quest **sẽ render** để thanh chạy đạt 100%.
- `bot.ts` mode `run`: **bỏ auto-enroll** hoặc thêm công tắc "Cho phép tự nhận nhiệm vụ" (mặc định TẮT),
  để đúng chính sách đang ghi trong code.
- `questManager.ts`: chuyển `lastClaimAt`/`claimChain` ra ngoài instance (theo account) để gap 1.2s có tác dụng.
- `main.js`: `res.ok` phải kèm xác nhận `claimed_at`/đọc lại ví trước khi báo "đã nhận".

---

## 7. THỨ TỰ THI CÔNG & TIÊU CHÍ "XONG"

```
#101 probe (1 buổi, không rủi ro)   → có ma trận sự thật
#102 danh tính (1 wave)             → 0 dòng lệch bot/main
#103 + #104 payload & ngõ cụt       → không còn trạng thái treo; token được gửi đúng 1 lần
#105 origin discord.com             → account từng bị chặn claim được 200  ← MỐC THÀNH CÔNG
#106 + #107 trạng thái & nhận tất cả → không kẹt, có nút thử lại, có tổng kết
#108 dọn nợ                          → không treo video quest, số liệu khớp
```

**Định nghĩa "nhận ORBS thật 100% trong client" (để không tự lừa mình):**
1. Không cần mở app Discord.
2. Không challenge ⇒ claim thẳng, toast "Đã nhận N Orbs" **chỉ sau** HTTP 2xx.
3. Có challenge ⇒ puzzle hiện **trong modal của app**; giải xong ⇒ Discord trả 2xx ⇒ thẻ sang "Đã nhận"
   và số dư ví tăng (đọc lại từ `/users/@me/virtual-currency/balance`).
4. Không giải được ⇒ thẻ giữ "Chưa nhận" + badge lý do + nút "Nhận lại"; **không** cộng orbs ảo.

---

## 8. RÀ SOÁT PHẦN CÒN LẠI CỦA DỰ ÁN (ngoài ORBS)

| # | Vấn đề | Vị trí | Đề xuất |
|---|---|---|---|
| 1 | Hai nguồn danh tính Discord | `src/constants.ts` vs `electron/discordIdentity.js` | gộp về 1 (Waves#102) |
| 2 | Quest treo vô hạn khi `enrolled_at` NaN | `questManager.ts:935` | Waves#108 |
| 3 | Auto-enroll trái chính sách | `bot.ts:434-447` | công tắc, mặc định TẮT |
| 4 | `claimAllClaimable()` chạy mỗi vòng, claim cả quest người dùng định xem | `bot.ts:409` | chỉ claim khi bật "tự nhận" |
| 5 | Không có timeout IPC claim | `renderer.js:2113` | `Promise.race` 25s |
| 6 | `res.ok` không xác minh body | `main.js:1798` | kiểm `claimed_at` |
| 7 | Log dev lộ metadata nhưng không có "mã lỗi người dùng" | `main.js:1659-1663` | thêm `errCode` hiển thị UI |
| 8 | `discordCdp.js` chưa có `jsClaimQuest` | `discordCdp.js` | bổ sung (Tầng 3) |
| 9 | `tools/e2e-captcha.sh` gọi `npm run dev` giết cả Electron | `tools/e2e-captcha.sh:12` | đổi sang cổng debug riêng |
| 10 | Tài liệu wave trùng số (#97) | `docs/WAVES-97-100-ORB-CLAIM.md` | ghi chú rõ, đã có |
| 11 | **Tài liệu lệch code**: `memory/2026-10-28.md` ghi *"Removed the separate renderer hCaptcha widget… open the official quest in Discord app"*, nhưng code hiện tại **vẫn có** widget in-app (`renderer.js:1791-2071`) và `docs/WAVES-97-100` lại mô tả widget in-app | mâu thuẫn 3 nguồn | chốt lại 1 luồng duy nhất rồi cập nhật cả 3 |

---

## 9. CẦN BRO CHỐT

1. **Làm #101 (probe) trước?** — cần 1 account đang có quest "Chưa nhận" để đo. Không đo thì #105 vẫn
   là giả thuyết.
2. **Chọn hướng:** (A) chỉ vá #102–#104 + #106–#108, hay (A+B) làm luôn **#105 origin discord.com**
   để nhận được cả account bị challenge?
3. **#105 có chấp nhận** việc app tải `https://discord.com/login` trong 1 cửa sổ ẩn (không mở app
   Discord, không hiện UI Discord) không? Nếu không, chỉ còn CDP (phải có Discord chạy) — và khi đó
   "100% trong client" là **không khả thi về mặt kỹ thuật**, tôi sẽ nói thẳng thay vì hứa.
