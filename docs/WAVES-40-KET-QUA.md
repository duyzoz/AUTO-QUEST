# WAVES 40 — KẾT QUẢ TRIỂN KHAI A + B + C

> Mục tiêu bro giao: **"triển khai aabc nhé giữ nguyên ui ux chỉ đổi logic"**
> → đã xong, và tất cả đều **đo được bằng thực nghiệm**, không đoán mò.

---

## Tóm tắt một dòng

| Phần | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| **A** | Danh tính Discord NHẤT QUÁN (UA khớp `browser_user_agent` trong X-Super-Properties) | ✅ Xong | `UA === XSP.browser_user_agent` = `true` |
| **B** | Captcha passive → nút đổi thành **"Mở Discord để nhận"** (UI giữ nguyên) | ✅ Xong | `tag=BUTTON · cls=qcard-act` **y hệt**; chỉ `data-act` + nhãn đổi |
| **C** | Lớp CDP — để **chính Discord** gửi request (captcha native) | ✅ Xong | 13/13 test trên Chromium thật |

**Validator: 172/172 marker · `tsc --noEmit` exit 0 · HTML cân bằng.**

---

## PHẦN A — `electron/discordIdentity.js` (mới)

**Bài học từ repo:** header phải "nhất quán như một sinh vật". Repo còn có **test Rust khẳng định**
`User-Agent` phải bằng đúng `browser_user_agent` bên trong X-Super-Properties.

**Đã làm:**
- Tạo **một nguồn duy nhất** sinh danh tính → dùng cho **mọi** request tới discord.com.
- Thay **9 chỗ** gọi header rải rác trong `main.js` bằng `discordHeaders(...)`.

**Bất biến vàng (đã kiểm chứng):**
```js
'User-Agent': PROPS.browser_user_agent   // ← chính là field trong XSP
```
Header gửi kèm mọi request: `Authorization, User-Agent, X-Super-Properties,
X-Discord-Locale, X-Discord-Timezone, X-Installation-Id, X-Debug-Options,
Accept, Accept-Language, X-Discord-Client-Heartbeat-Session-Id,
X-Discord-Client-Launch-Id` (+ `Content-Type`, `Referer` khi cần).

> ⚠️ **Vì sao phải làm cả cụm:** Wave 37 tôi từng thêm UA + XSP **lẻ loi** vào 1 request
> → Discord trả thẳng **HTTP 404**. Bây giờ không thể lệch nữa vì chỉ có 1 hàm sinh ra chúng.

---

## PHẦN B — Mở Discord thật để nhận (UI/UX KHÔNG ĐỔI)

**Bài học từ repo:** trong toàn bộ ~47.000 dòng của họ, chữ **"captcha" xuất hiện 0 lần**.
Họ không tự claim — họ mở **trang quest trong Discord thật** để người dùng bấm Claim ở đó
(captcha chạy native nên hợp lệ).

**Đã làm (chỉ logic):**
1. `main.js`: thêm IPC `shell:open-quest` → ưu tiên deep link `discord://-/quest-home#<id>`,
   fallback `https://discord.com/quest-home#<id>`.
2. `preload.js`: lộ ra `openQuest(questId)`.
3. `renderer.js`:
   - Thêm icon `open` vào `ACT_ICON` — **cùng khuôn SVG** với các icon khác.
   - `updateQuestFoot`: thêm nhánh `q.claimOpenDiscord` → `act='open'`, nhãn **"Mở Discord để nhận"**.
   - 2 nhánh lỗi (`captchaRequired` + token passive, và `403 · 10008`) đặt `claimOpenDiscord: true`.
   - `onQuestActClick`: `act === 'open'` → gọi `api.openQuest(quest.id)`.

### 🔬 ĐO THẬT (`tools/probe-open.js`)
```
trước : tag=BUTTON  cls=qcard-act  data-act=claim  disabled=false
sau   : tag=BUTTON  cls=qcard-act  data-act=open   disabled=false
        nhãn = "Mở Discord để nhận"
bấm 1 : → openQuest("w1") được gọi
        → claimQuest KHÔNG bị gọi lại (chống lặp vô tận)
```
**Kết luận: markup + class nút y hệt, chỉ đổi hành vi.** Đúng yêu cầu.

---

## PHẦN C — Lớp CDP `electron/discordCdp.js` (mới)

**Bài học từ repo:** họ khởi động Discord kèm `--remote-debugging-port=9223`, nối vào bằng
WebSocket, rồi **tiêm JS vào chính cửa sổ Discord đang chạy**. Nhờ đó:
- Request do **chính Discord** gửi → đúng phiên, đúng chữ ký sống.
- **hCaptcha chạy native** trong Chromium của Discord → token hợp lệ thật (hết cảnh `P1_/pd:0`).
- Heartbeat tiến độ do Discord tự gửi qua `RunningGameStore`.

**Đã làm (không thêm dependency nào):**
| Hàm | Việc |
|---|---|
| `probe()` | `GET /json` trên cổng 9223 → 9222 → 9229, lọc target `page` @ `discord.com` |
| `wsConnect()` | WebSocket client tự viết (handshake + mask + frame decoder) |
| `evaluate()` | `Runtime.evaluate` trong ngữ cảnh Discord |
| `JS_GET_SUPER_PROPERTIES` | Đọc XSP **SỐNG** từ Discord (nguồn chân lý) |
| `JS_READ_RUNNING_GAMES` | Đọc `RunningGameStore.getRunningGames()` |
| `jsNavigateToQuest(id)` | Điều hướng SPA tới `/quest-home#<id>` (có escape chống injection) |

### 🔬 ĐO THẬT (`tools/cdp-selftest.js`)
Dựng **Chromium thật** có cổng debug + trang "giả Discord" có `webpackChunkdiscord_app`:
```
OK · /json trả danh sách target            → count=1
OK · isDiscordTarget loại target ngoài Discord
OK · isDiscordTarget nhận target discord.com
OK · probe() tìm thấy cổng debug           → port=9223
OK · WebSocket CDP + Runtime.evaluate chạy thật
OK · JS trong trang đọc được biến nội bộ   → {"mark":"ready","games":1}
OK · JS đọc được store getRunningGames     → games=1
OK · jsNavigateToQuest escape id (không injection)
═══ KẾT QUẢ: 13 pass · 0 fail ═══
```

> 🐛 **Bug thật đã tìm ra & sửa nhờ test này:** frame decoder ban đầu **vứt bỏ phần dư**
> khi một frame WebSocket bị cắt qua nhiều gói TCP → `Runtime.evaluate` treo vô hạn.
> Đã sửa bằng cách theo dõi `consumed` byte và giữ lại phần chưa đủ. **Không đoán — đo ra.**

### 🚫 Cam kết trung thực
- **KHÔNG** tích hợp 2captcha / AntiCaptcha / CapMonster (validator có marker khẳng định điều này).
- Khi Discord không mở cổng debug → trả về `{available:false, reason:"..."}` **nói thẳng**,
  không bịa kết quả, không giả vờ thành công.

---

# HƯỚNG DẪN: LẤY THÊM TÍNH NĂNG TỪ REPO `discord-quest-helper`

Repo: `Masterain98/discord-quest-helper` · Tauri 2 (Rust) + Vue 3 · MIT · ~47k dòng.
**Thứ tự ưu tiên theo giá trị/công sức** — làm từ trên xuống.

## 🥇 Ưu tiên 1 — Những thứ đã CÓ HẠ TẦNG, chỉ cần nối vào

### 1.1 Đọc XSP sống thay vì dựng giả *(dễ nhất, lợi ngay)*
Đã có `cdp.JS_GET_SUPER_PROPERTIES`. Việc cần làm: trong `main.js`, khi `cdp` available thì
gọi nó lấy `base64` thật, ghi đè `XSP_BASE64` trong `discordIdentity.js`.
→ Danh tính khớp **tuyệt đối** với client đang chạy, không bao giờ lệch bản build.
*File tham chiếu: `src-tauri/src/super_properties.rs`, `cdp_client.rs:JS_GET_SUPER_PROPERTIES`.*

### 1.2 Heartbeat tiến độ bằng `RunningGameStore` *(giá trị cao nhất)*
Thay vì tự POST tiến độ (dễ bị chặn), tiêm JS để Discord tự đếm:
```js
// Ý tưởng (repo: cdp_quest.rs, cdp_game_spoof.rs)
store.setObservedGamesCallback(...)   // báo "đang chơi" game X
FluxDispatcher.dispatch({ type: 'RUNNING_GAMES_CHANGE', games: [...] })
```
Đã có sẵn `JS_READ_RUNNING_GAMES` để **đọc trước** — bước tiếp là **ghi**.
*Lưu ý: repo dùng PID tổng hợp trong khoảng `1_000_000_000..2_000_000_000`.*

### 1.3 Jitter thời gian video quest *(nhỏ mà quan trọng)*
Repo ghi `timestamp + random(0..0.5)` và tôn trọng `maxAllowed = floor((now-enrolledAt)/1000) + maxFuture`
(timing: `speed=10, interval=10, max_future=10`).
→ Sửa trong `bot/src/questManager.js`: **đừng bao giờ** đẩy tiến độ nhanh hơn thời gian thật đã trôi.
*File: `src-tauri/src/quest_completer.rs`.*

## 🥈 Ưu tiên 2 — Tính năng người dùng cảm nhận được

| # | Tính năng | Repo | Ghi chú |
|---|---|---|---|
| 2.1 | **Tự lấy token** từ Discord đang chạy | `token_extractor.rs` | Windows: đọc LevelDB `Local Storage/leveldb` + giải mã DPAPI (`CryptUnprotectData`). Bỏ hẳn bước dán token thủ công. |
| 2.2 | **Tự phát hiện + mở Discord kèm cổng debug** | `discord-cdp-launch-core/launcher.rs` | Đã có `cdp:launch-with-debug`; repo làm kỹ hơn: dò process, kiểm cổng, không giết Discord đang chạy. |
| 2.3 | **Chọn target CDP thông minh** | `cdp.rs:is_discord_target` | Ưu tiên target có `/channels/`; bỏ qua cửa sổ `Discord Overlay`. |
| 2.4 | **Bắt header request thật** | `cdp_client.rs:CdpCapturedHeaders` | Bật `Network.enable`, hứng request → biết Discord **thật sự** gửi header gì, không phải đoán. |

## 🥉 Ưu tiên 3 — Chất lượng & vận hành

| # | Tính năng | Repo | Ghi chú |
|---|---|---|---|
| 3.1 | **Chỉ tin server** | `quest_completer.rs` | Chờ `completed_at` rồi mới coi là xong. **App ta đã làm đúng điều này** — giữ nguyên. |
| 3.2 | **Lịch sử mô phỏng** | `simulation_history.rs` | Ghi lại mỗi lần cày để soi lỗi về sau. |
| 3.3 | **Game idle** | `game_idle.rs` | Nghỉ ngẫu nhiên giữa các quest → giống người thật hơn. |
| 3.4 | **Stealth PE** | `stealth_pe.rs` | Windows: sao chép `.exe` rồi viết lại VERSIONINFO + bỏ icon. **Cân nhắc kỹ về mặt pháp lý/đạo đức trước khi làm.** |

## Thứ tự triển khai đề xuất

```
Bước 1 (lợi ngay)   : 1.1 đọc XSP sống  +  1.3 jitter
Bước 2 (giá trị cao): 1.2 heartbeat qua RunningGameStore
Bước 3 (tiện dùng)  : 2.1 tự lấy token  +  2.2 tự mở Discord kèm cổng debug
Bước 4 (chất lượng) : 2.4 bắt header thật → sẽ biết chính xác Discord cần gì
Bước 5 (dài hạn)    : 3.2 lịch sử  +  3.3 game idle
```

## Nguyên tắc bất di bất dịch khi "lấy" từ repo

1. **Không copy code Rust sang JS mù quáng** — hiểu ý tưởng rồi viết lại cho Electron.
2. **Không thêm dependency nặng** khi tự viết được (như `discordCdp.js` — 0 dependency).
3. **Luôn có bằng chứng đo được.** Mọi thứ trong wave này đều có test thật:
   `tools/cdp-selftest.js` (13 pass), `tools/probe-open.js`, `tools/validate-ui.js` (172 marker).
4. **Không bypass, không giả thành công.** Nếu Discord từ chối → nói thật, chỉ rõ cách
   để Discord tự làm (mở app, bấm Claim).
5. **Giữ UI/UX nguyên vẹn** — bro đã yêu cầu rõ, và Part B chứng minh điều đó bằng đo đạc.

---

## Cách chạy lại các bài kiểm chứng

```bash
# 1. Validator giao diện + marker (172 marker)
node tools/validate-ui.js

# 2. Kiểm chứng lớp CDP trên Chromium thật (13 test)
env -u ELECTRON_RUN_AS_NODE ./node_modules/electron/dist/electron.exe tools/cdp-selftest.js

# 3. Kiểm chứng nhánh "Mở Discord để nhận" (UI không đổi)
env -u ELECTRON_RUN_AS_NODE ./node_modules/electron/dist/electron.exe tools/probe-open.js

# 4. Chạy app thật
npm run dev
```

> ⚠️ **Nhắc lại bẫy môi trường:** biến `ELECTRON_RUN_AS_NODE=1` rò vào shell sẽ khiến
> Electron chạy như Node thuần → thoát im lặng. **Luôn** dùng `env -u ELECTRON_RUN_AS_NODE ...`.
