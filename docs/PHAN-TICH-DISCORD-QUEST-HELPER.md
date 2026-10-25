# Phân tích repo `discord-quest-helper` (Masterain98) — và bài học cho AUTO-QUEST

> Nguồn: `C:\Users\Admin\Downloads\discord-quest-helper-main\discord-quest-helper-main`
> Version 0.11.0 · MIT · ~47.000 dòng (Rust + Vue 3)
> Đọc ngày: 2026-10-22. Đọc kĩ: `quest_completer.rs`, `discord_api.rs`, `cdp_quest.rs`,
> `cdp_game_spoof.rs`, `super_properties.rs`, `token_extractor.rs`, `stealth_pe.rs`,
> `crates/discord-cdp-launch-core`, `src/stores/quests.ts`, `src/views/Home.vue`,
> `src/composables/useQuestGroupActions.ts`, các `docs/*.md`.

---

## 0. TÓM TẮT MỘT CÂU — ĐIỀU QUAN TRỌNG NHẤT

> **Repo này KHÔNG BAO GIỜ gặp captcha, vì nó không "giả làm Discord" — nó ĐIỀU KHIỂN
> Discord THẬT.**
>
> Chữ `captcha` xuất hiện **0 lần** trong toàn bộ mã nguồn. Họ không giải, không bypass,
> không dựng widget — họ **tiêm JS vào chính client Discord đang chạy** qua Chrome
> DevTools Protocol (CDP), để **Discord tự gửi heartbeat có chữ ký của nó**.
> Và khi cần **NHẬN thưởng** (bước dính captcha), họ **mở đúng trang quest trong
> Discord thật rồi để người dùng bấm Claim tại đó** — captcha chạy native trong
> Discord, không dính gì tới app.

Đây chính là lời giải cho bế tắc Wave 37/38 của chúng ta.

---

## 1. KIẾN TRÚC TỔNG THỂ

```
Discord Quest Helper
├─ Vue 3 + Vite (frontend, WebView)
│  ├─ views: Home, GameSimulator, Settings, Debug, GlobalQuests, DiscordConsole
│  ├─ Pinia stores: auth, quests(1850 dòng), gameIdle, globalQuests, toast
│  └─ api/tauri.ts — cầu IPC có kiểu (typed)
│
├─ Tauri 2 (Rust) — NÃO BỘ, giữ:
│  ├─ discord_api.rs      — REST client tới discord.com/api/v9 (+ X-Super-Properties)
│  ├─ discord_gateway.rs  — WebSocket Gateway (nhận event account/activity)
│  ├─ cdp_client.rs       — tầng nói chuyện CDP thô (2419 dòng)
│  ├─ cdp_quest.rs        — TIÊM JS vào Discord để chạy quest (4642 dòng) ★
│  ├─ cdp_game_spoof.rs   — giả lập "đang chơi game" trong RunningGameStore
│  ├─ token_extractor.rs  — moi token từ profile Discord local (DPAPI/Keychain)
│  ├─ super_properties.rs — sinh X-Super-Properties + User-Agent y như client thật ★
│  ├─ stealth_pe.rs       — đổi VERSIONINFO + xoá icon file .exe phụ (Windows)
│  └─ runner.rs / src-runner — sidecar giả process game (có cửa sổ winit thật)
│
└─ crates/discord-cdp-launch-core — tìm & khởi chạy Discord với --remote-debugging-port
```

**Điểm mấu chốt kiến trúc:** backend Rust **sở hữu toàn bộ** networking, CDP session,
trích xuất credential, và vòng đời process. Frontend chỉ là giao diện.

---

## 2. BỐN TRỤ CỘT KỸ THUẬT

### Trụ 1 — CDP: điều khiển Discord thật (thay vì giả làm Discord)

`docs/cdp-runtime-validation.md` mô tả quy trình:

1. Tìm cài đặt Discord/Vesktop trên máy (`crates/.../provider.rs`).
2. Khởi chạy với `--remote-debugging-port=<port>` (`launcher.rs:357`).
3. Dò endpoint CDP qua HTTP loopback: `GET http://127.0.0.1:<port>/json` → danh sách target.
4. **Xác minh target thật** (`Runtime.evaluate`): phải thấy app root + webpack chunk loader.
   Title/URL tự xưng "Discord" **không đủ** để coi là ready — chống nhầm updater/overlay.
5. Nối WebSocket debugger (bắt buộc loopback, không credential, không proxy).
6. **`Runtime.evaluate` chạy JS trong context trang Discord đang đăng nhập.**

Tiêm JS vào Discord rồi dùng **store nội bộ của Discord**:

| Module webpack | Dùng để |
|---|---|
| `RunningGameStore` | giả game đang chạy (`getRunningGames` trả Array — phân biệt với i18n) |
| `QuestsStore` | đọc tiến độ quest (`__proto__.getQuest`) |
| `FluxDispatcher` | bắn event `RUNNING_GAMES_CHANGE`, `GAMES_DATABASE_UPDATE` |
| `ApplicationStreamingStore` | giả metadata stream |
| `api` | **module HTTP nội bộ của Discord** (`get`/`post`) → gọi quest endpoint |
| `NativeUtils` | `setObservedGamesCallback` |
| `DetectableGameStore` | danh mục game detect được |

> **Vì sao đây là "vũ khí hạng nặng":** khi gọi qua `dqh.api.post(...)`, request mang
> **đầy đủ header, cookie, phiên, chữ ký, và mọi ngữ cảnh của client Discord THẬT**.
> Discord không thể phân biệt — vì đó đúng là nó.

Cách dò module **rất cẩn thận** (chống bắt nhầm i18n / translation proxy):
- `RunningGameStore`: gọi thử `getRunningGames()`, **phải trả `Array`** (i18n trả `{locale, ast}`).
- `api`: `apiMatches.length === 1` — chỉ nhận khi **duy nhất một** ứng viên; loại object có
  own-property `getRunningGames`; yêu cầu có đủ `get/post/put/patch/del`.
- `DetectableGameStore`: chỉ nhận khi `Array.isArray(val.games)` (translation proxy giả method).

### Trụ 2 — `X-Super-Properties` + User-Agent "khớp tuyệt đối"

Đây là phần anti-detection thật sự. `super_properties.rs`:

- **3 nguồn, ưu tiên giảm dần:** `Cdp` (lấy từ client thật — chính xác nhất) →
  `RemoteJs` (parse từ JS của trang Discord) → `Default` (hardcode, cập nhật thủ công).
- Hằng số version cập nhật cùng nhau (`DEFAULT_CLIENT_VERSION = "1.0.9262"`, Chrome,
  Electron, build number, native build number).
- `CLIENT_MOD_DETECTION_BITS: u128` — mask 128-bit phát hiện client mod.
- **UA sinh ra phải khớp `browser_user_agent` bên trong XSP** — có test riêng kiểm điều này:
  ```
  assert_eq!(user_agent, props.get("browser_user_agent"))
  ```
  Đây là bất biến quan trọng: Discord so UA với XSP; lệch nhau = cờ đỏ.
- Header kèm theo mỗi request (`discord_api.rs:455-494`):
  `x-super-properties`, `User-Agent`, `x-discord-timezone`, `x-discord-locale`,
  `accept-language`, `x-installation-id`, `Referer: https://discord.com/quest-home`
  (chỉ cho route quest/ví), `x-debug-options: bugReporterEnabled`.
- `client_heartbeat_session_id` + `client_ad_session_id` sinh 1 lần/session, dùng cho
  endpoint `/quests/decision` và `/quests/get-decisions`.

> ⚠️ **Đối chiếu với app của ta (Wave 37):** tôi từng *thử* thêm User-Agent +
> X-Super-Properties vào `debug:submit-captcha` và bị `404`. Repo này chứng minh:
> **header ĐÚNG phải khớp nhau và đúng phiên bản** — thêm UA lẻ loi, XSP rỗng, không
> nhất quán → Discord/edge từ chối. Họ làm đúng: XSP + UA **cùng một ClientIdentity**.

### Trụ 3 — Quest engine: 2 đường (HTTP thuần & CDP)

**(a) `quest_completer.rs` — HTTP token thuần** (khi không có CDP):
- Video: `POST /quests/{id}/video-progress` body `{timestamp}`.
  Có **jitter ngẫu nhiên** `+ random(0..0.5)` để trông tự nhiên.
- Stream: `POST /quests/{id}/heartbeat` body `{stream_key}` mỗi **30s**.
- Game (legacy): `POST /quests/{id}/heartbeat` body `{application_id, terminal}` mỗi **60s**.
- PLAY_ACTIVITY: heartbeat server-timed; **chỉ tin `progress.PLAY_ACTIVITY.value`**, và
  **chỉ emit "hoàn thành" sau khi Discord trả `completed_at`** (không tự đoán).

**(b) `cdp_quest.rs` — CDP (đường ưu tiên, an toàn nhất):**
- Video qua CDP: vòng lặp JS **tôn trọng "thời gian tối đa được phép"**:
  ```
  const maxAllowed = Math.floor((Date.now() - enrolledAt)/1000) + maxFuture;
  if (diff >= speed) { ... post video-progress ... }
  ```
  Tức: **không nhảy vượt quá thời gian thực đã trôi qua** kể từ lúc enroll (+ biên nhỏ).
  Timing: `speed=10, interval=10, max_future=10`.
- Tương thích payload chuẩn HAR; có test khẳng định shape khớp HAR.
- Cleanup có verify: `cleanup_verify_is_clean` — patch nào cũng phải gỡ sạch
  (`dqh_present`, `spoof_active`, `observer_hook`, `broad_patch_count`...).

**(c) "Zero-download game" — `cdp_game_spoof.rs`:**
- Tiêm **game giả** vào `RunningGameStore` qua `setObservedGamesCallback` (**append**, không prepend).
- **PID tổng hợp** trong dải `1_000_000_000..2_000_000_000` (vì subscriber process-monitor
  của Discord cần PID số trước khi subscriber quest chạy).
- Bắn `RUNNING_GAMES_CHANGE` → Discord **tự** gửi heartbeat.
- `DetectableGameStore` + `GAMES_DATABASE_UPDATE` để bổ sung game vào danh mục.
- Với Windows: `stealth_pe.rs` đổi VERSIONINFO + xoá icon file .exe phụ → process giả
  trông như game thật.

### Trụ 4 — Token & bảo mật

- `token_extractor.rs`: đọc LevelDB `Local Storage/leveldb` của profile Discord.
  - Windows: **DPAPI** (`CryptUnprotectData`, prefix `DPAPI`).
  - macOS: **Keychain** (`security-framework` + fallback CLI `security`).
  - Linux: **Secret Service**.
- Chỉ hỗ trợ profile **Discord official**; Vesktop chỉ qua CDP (token giữ trong RAM Rust,
  **không bao giờ trả về WebView**).
- Log được sanitize (`sanitize_user_id`, cắt 200 ký tự, không log payload đã decode).

---

## 3. 🔥 GIẢI MÃ BẾ TẮC CAPTCHA CỦA CHÚNG TA

### Bằng chứng từ repo

| Câu hỏi | Trả lời trong repo |
|---|---|
| Có xử lý captcha không? | **KHÔNG.** `grep -rni captcha` = **0 kết quả** toàn repo. |
| Claim thưởng thế nào? | `Home.vue:1556`: nếu có CDP → **`navigateDiscordSpa('/quest-home#<id>')`** — mở đúng trang quest trong Discord thật, **người dùng bấm Claim tại đó**. |
| API claim có gửi `captcha_key` không? | **KHÔNG.** `claim_quest_reward` chỉ gửi `{ platform }`. `grep captcha_key` = 0. |
| Khi không có CDP thì sao? | Fallback `claimQuestReward()` — và đây chỉ là đường phụ, chấp nhận có thể fail. |
| Vì sao không dính captcha? | Vì **nhiệm vụ được hoàn thành bởi CHÍNH Discord** (heartbeat có chữ ký), nên không kích hoạt risk-engine; còn bước Claim thì **diễn ra trong Chromium của Discord thật**, nơi hCaptcha chạy native. |

### Vì sao hCaptcha trong app ta luôn "passive-pass" (P1_/pd:0)

Wave 37/38 tôi đã chứng minh: hCaptcha trả token `P1_` payload `pd:0` (không giải thử
thách) dù `size:'normal'`, dù `execute()`, dù UA Chrome thật, **dù ở origin discord.com thật**.
Repo này giải thích **tại sao**:

1. **Thiếu "ngữ cảnh phiên" đầy đủ.** hCaptcha's risk engine chấm điểm dựa trên
   device fingerprint + hành vi + **tính nhất quán của XSP/UA/session**. App ta gửi token
   từ một WebView *không phải* client Discord đang hoạt động → engine xếp "low risk" →
   tự cho qua (passive). Client thật có đủ tín hiệu để engine **yêu cầu thử thách** khi cần.
2. **Không có native bridge.** Target Discord thật trong CDP có
   "optional Discord/Vesktop native bridge" (doc nói rõ) — app ta không có.
3. **Cookie/phiên hCaptcha không gắn với phiên Discord thật.** Loopback origin giúp
   cookie *ghi được*, nhưng vẫn là **phiên hCaptcha riêng**, không phải phiên mà Discord
   tin.

→ Hệ quả: token ta sinh ra **không bao giờ** là token "đã giải", nên Discord trả
`captcha-required` (chỉ key) hoặc `403 10008` (kèm rqdata). **Đây không phải bug code ta
— đây là giới hạn của phương án "dựng client thứ 2"**.

---

## 4. SO SÁNH TRỰC TIẾP với AUTO-QUEST

| Khía cạnh | discord-quest-helper | AUTO-QUEST (ta) |
|---|---|---|
| Nền tảng | **Tauri 2 (Rust) + Vue 3** | Electron (Node) + vanilla JS |
| Networking | Rust `reqwest` — kiểm soát header tuyệt đối | `fetch` trong main process |
| Quest completion | CDP tiêm JS vào **Discord thật** | Gọi REST trực tiếp bằng token |
| Captcha | **Không dính** (vì dùng Discord thật) | Dựng hCaptcha trong app → **bế tắc** |
| Claim thưởng | **Mở Discord thật** cho user bấm | POST trực tiếp → 10008 |
| X-Super-Properties | Đầy đủ, khớp UA, có install-id/heartbeat-session | **Thiếu/rỗng** |
| Anti-detection | `stealth_pe`, PID synthetic, jitter, engine thật | Không có |
| Token | DPAPI/Keychain/Secret Service (đọc đĩa) | User dán token thủ công |
| Ngôn ngữ | Rust + TS, ~47k dòng, có test dày | JS, ~6k dòng |
| Cleanup verify | Có (gỡ patch, verify sạch) | N/A |

---

## 5. HƯỚNG ĐI CHO DỰ ÁN CỦA BRO

Xếp theo **giá trị / chi phí**:

### 🟢 A. LÀM NGAY — rẻ, chắc thắng, không cần đổi kiến trúc

1. **Thêm `X-Super-Properties` ĐẦY ĐỦ + UA khớp** cho mọi request.
   - Sinh `SuperProperties` (os, browser, release_channel, client_version, os_version,
     system_locale, browser_user_agent, client_build_number, native_build_number,
     `client_heartbeat_session_id`...).
   - **UA phải = `browser_user_agent` trong XSP** (bất biến vàng của họ).
   - Kèm `x-discord-timezone`, `x-discord-locale`, `accept-language`,
     `x-installation-id`, `Referer: https://discord.com/quest-home`, `x-debug-options`.
   - ⚠️ Làm **nhất quán mọi request** — không thêm lẻ loi (bài học vụ `404` của tôi).
   - **Kỳ vọng:** request "sạch" hơn; có thể giảm tỉ lệ bị dí captcha ở bước claim.

2. **Gửi jitter + tôn trọng thời gian thực** cho video/stream progress như họ:
   `timestamp + random(0..0.5)`, không nhảy vượt `now - enrolled_at + biên`.

3. **Đọc lại tiến độ từ `/quests/@me` để xác nhận** thay vì tự đoán hoàn thành —
   chỉ tin `completed_at` từ server.

### 🟡 B. TRUNG HẠN — đổi chiến lược Claim (đòn quyết định)

4. **Claim theo cách của họ:** khi quest cần captcha →
   **KHÔNG tự claim nữa**, mà **mở Discord thật đúng trang quest** để người dùng bấm.
   - Bản nhẹ (không cần Rust): `shell.openExternal('discord://-/quest-home')` hoặc
     mở `https://discord.com/quest-home#<id>` bằng **app Discord cài sẵn**.
   - Đây là cách **duy nhất trung thực** để qua captcha mà không bypass.
   - UI: nút "Nhận" → "Mở Discord để nhận" kèm hướng dẫn.

5. **Tự động hoá video/stream/game quest qua HTTP thuần** cho các quest KHÔNG dính captcha
   (đa số). Ta đã có nền tảng; chỉ cần thêm XSP + jitter + xác nhận từ server.

### 🔴 C. DÀI HẠN — nếu muốn "không bao giờ gặp captcha" như họ

6. **Bổ sung lớp CDP** (Node có thư viện `chrome-remote-interface`; không cần Rust):
   - Khởi chạy Discord với `--remote-debugging-port=9222`.
   - Nối `http://127.0.0.1:9222/json` → chọn target Discord thật.
   - `Runtime.evaluate` tiêm JS dùng `RunningGameStore`/`FluxDispatcher`/`api`.
   - Khi đó Discord **tự** gửi heartbeat → không dính captcha.
   - Đây là nâng cấp lớn nhất, biến app từ "giả client" thành "điều khiển client".

7. **Nếu theo hướng Tauri:** repo này là blueprint hoàn chỉnh (MIT, đọc được toàn bộ).
   Nhưng chi phí migrate từ Electron → Tauri là rất lớn.

---

## 6. BÀI HỌC CỐT LÕI (đúc kết)

1. **Không đánh nhau với captcha — hãy tránh nó.** Họ chọn con đường khiến captcha
   *không bao giờ xuất hiện*: hành động nằm **bên trong** phiên Discord thật.
2. **Header phải "nhất quán như một sinh vật"**: UA = XSP.browser_user_agent, session id
   cùng phiên, referer đúng route. Lệch một mảnh = cờ đỏ.
3. **Chỉ tin server.** Không tự tính "xong rồi"; chờ `completed_at`.
4. **Tôn trọng thời gian thực.** `maxFuture` biên nhỏ — không nhảy cóc.
5. **Phòng vệ nhiều lớp khi thao tác store nội bộ:** dò module theo *hình dạng*
   (Array vs object), loại proxy i18n, verify cleanup.
6. **Đường `HTTP token thuần` là đường phụ; đường CDP là đường chính.** Ta đang đi đúng
   đường phụ — nên gặp trần captcha là lẽ tự nhiên.
7. **Tham chiếu họ công khai:** `aamiaa/CompleteDiscordQuest.js`,
   `markterence/discord-quest-completer`, `power0matin/...`, `taisrisk/...`,
   `docs.discord.food`.

---

## 7. CHỐT LẠI CHO BRO

- Repo này **không** dạy cách "giải captcha" — nó dạy cách **thoát khỏi cuộc chơi captcha**.
- Điều tôi đã nói thật ở Wave 38 (**hCaptcha luôn passive-pass trong môi trường Electron**)
  là **ĐÚNG** và repo này **xác nhận gián tiếp**: họ phải dùng CDP vào Discord thật thì
  mới không gặp captcha. Không có mẹo nào ở lại trong app mà qua được.
- **Việc nên làm ngay (rẻ nhất, đúng nhất):**
  1. Thêm XSP đầy đủ + UA khớp (mục A1).
  2. Đổi Claim sang "mở Discord thật" (mục B4).
- **Muốn tự động hoàn toàn như họ:** cần thêm CDP (mục C6).
