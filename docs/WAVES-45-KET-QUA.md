# WAVES 45 — KẾT QUẢ (Nhật ký có DẤU TÍCH · Profile giữa · Đăng nhập Discord OAuth2 · Token .txt)

> Ghi ngày 2026-10-23. Tất cả số liệu dưới đây **đo từ DOM thật** trong Electron
> (không phải đọc code rồi đoán). Mọi probe đều chạy lại được bằng lệnh ghi kèm.

---

## 0. Bro đã nói gì ở wave này (nguyên văn, để khỏi lệch ý)

| # | Nguyên văn | Việc phải làm |
|---|---|---|
| 1 | "nó vẫn hiện cái chó đẻ này … chứ đéo phải như này" | App đang hiển thị sai so với mong muốn |
| 2 | "cái nhật kí hoạt động tao đã yêu cầu mày hơn tỉ lần rồi mà mày vẫn đéo fix … **cứ nguyên llỗi đéo có màu sắc cho text và đéo có dấu tích ở đầu**" | Nhật ký: **dấu tích ở đầu mỗi dòng** + **chữ đổi màu** |
| 3 | "**npm run dev** chứ đéo chạy bản portable làm cặc gì" | Bro test bằng `npm run dev`, KHÔNG phải bản .exe |
| 4 | "cái tao muốn là tạo một cái … **có khung đăng nhập bằng discord** và khi ấn **vã ra một trang `https://discord.com/oauth2/authorize?client_id=......`**" | Khung đăng nhập Discord mở ĐÚNG link authorize |
| 5 | "nghĩa là con bot mời vào server vs quyền như này nè" | Link authorize có `permissions` (mời bot vào server) |
| 6 | "đồng thời nó cũng phải **trích được token của tk dis đấy** được không" | Hỏi OAuth có lấy được token tài khoản không → **phải trả lời thật** |
| 7 | "hướng dẫn tôi **cách lấy cái token app này** để vừa nó vô server vừa login c auto quest ngon lành" | Hướng dẫn lấy app_id / bot_token / client_secret |
| 8 | "tôi sẽ **gán token của nó vào trong .txt** và nhờ bro **mở nó ra đưa vào đúng đường dẫn** miễn không paste lên đoạn chat này là không lộ nhé" | Nạp token từ file `.txt`, **không bao giờ lộ ra chat/log** |
| 9 | "tôi đã bảo bro **để proflies ở giữa khi không có avt** mà bro cứ để nguyên vvậy … thật sự rất khó chịu" | Profile khách phải **căn giữa** khi không có avatar |

---

## 1. NHẬT KÝ HOẠT ĐỘNG — DẤU TÍCH + MÀU (mục bro phàn nàn nhiều nhất)

### Gốc rễ vì sao bao lâu nay bro vẫn thấy "đéo có dấu tích"
Wave 44 tôi **tô màu** nhưng phần đầu dòng chỉ là **nhãn CHỮ ASCII**: `[ ok ]`,
`[ !! ]`, `[ orb ]`. Về mặt hình ảnh đó **không phải dấu tích** — bro nói đúng.

### Wave 45 làm gì
Thay hẳn bằng **ICON VECTOR THẬT (SVG inline)** ở đầu mỗi dòng:

| Trạng thái | Icon | Hình dạng | Màu (Tối) | Màu (Sáng) |
|---|---|---|---|---|
| `ok` | dấu **tích** | 2 nét V lệch (`M20 6 9 17l-5-5`) | `#34d399` | `#04724a` |
| `err` | dấu **X** | 2 nét chéo | `#f87171` | `#b3141f` |
| `warn` | **chấm than** trong tam giác | tam giác + `!` | `#fbbf24` | `#8a4a06` |
| `orb` | **viên kim cương** (Orb) | đa giác + đường ngang | `#a78bfa` | `#5a2fd6` |
| `sys` | **mũi nhọn** | `> ` | mờ | mờ |

- **Icon là SVG, KHÔNG phải emoji/font** → không thể bị ô "??" như lỗi trước.
- Icon nằm **trong luồng flex** (không `position:absolute`) → **không bao giờ đè chữ**.
- **CHỮ cũng đổi màu** theo trạng thái (bro: "đéo có màu sắc cho text").
- Vẫn giữ **nhãn chữ** (`[ thành công ]`, `[ cảnh báo ]`…) làm **chỉ báo thứ hai**
  cho người mù màu → màu **không bao giờ** là chỉ báo duy nhất.
- Dòng **tiến trình quét** cũng có icon riêng, **tự đổi sang dấu tích** khi xong.

### Số đo thật — `tools/probe-log-color.js`
```
--- DARK (theme=dark) ---
  dòng: 9 · có icon: 9 · icon ở ĐẦU: 9
  icon là SVG: 9 · icon TRƯỚC chữ: 9
  cỡ icon: 14x16
  SỐ MÀU CHỮ KHÁC NHAU: 5 · SỐ KIỂU ICON KHÁC NHAU: 5
  tương phản chữ thấp nhất: 10.18:1
  còn glyph khối "??": false · còn mũi tên: false · còn emoji: false
--- LIGHT (theme=light) ---
  dòng: 9 · có icon: 9 · icon ở ĐẦU: 9
  SỐ MÀU CHỮ KHÁC NHAU: 5 · SỐ KIỂU ICON KHÁC NHAU: 5
  tương phản chữ thấp nhất: 7.07:1
=== WAVE 45 LOG-TICK+COLOUR: PASS ✅ ===
```
Kiểm chứng từng dòng (ví dụ chế độ Sáng):
```
t-ok  icon=✔ first=✔ svg=✔ tag="[ thành công ]" colour=rgb(4, 102, 60)  ratio=7.07  paths=M20 6 9 17l-5-5…
t-err icon=✔ first=✔ svg=✔ tag="[ lỗi ]"        colour=rgb(166, 17, 27) ratio=7.73  paths=M18 6 6 18|m6 6 12 12…
t-orb icon=✔ first=✔ svg=✔ tag="[ orb ]"        colour=rgb(76, 29, 149) ratio=10.95 paths=M6 3h12l4 6-10 12L2 9z|M2 9h20…
```

**Chạy lại:** `env -u ELECTRON_RUN_AS_NODE npx electron tools/probe-log-color.js`

---

## 2. PROFILE KHÁCH — CĂN GIỮA KHI KHÔNG CÓ AVATAR

Trước đây thẻ khách dùng layout **hàng ngang** (avatar trái, chữ phải) → lệch và
trống bên phải, đúng như bro khó chịu.

Nay ở trạng thái `data-state="guest"`:
- Thẻ sidebar → **cột dọc, căn giữa** (avatar trên, tên + tag dưới).
- **Ẩn nút đăng xuất** (khách thì không có gì để đăng xuất).
- Hero giữa trang → **căn giữa tuyệt đối** (avatar + tên).
- **Đã đăng nhập → giữ nguyên layout Discord gốc** (không bị luật khách đè).

### Số đo thật — `tools/probe-guest-centre.js`
```
--- KHÁCH (chưa đăng nhập) ---
  sidebar: state=guest flex-direction=column align=center
  tâm thẻ=127.5 · tâm avatar=127.5 · LỆCH=0px
  tâm chữ=127.5 · LỆCH=0px
  nút đăng xuất: display=none
  hero: state=guest flex-direction=column
  tâm hero=820 · tâm avatar hero=820 · LỆCH=0px
--- ĐÃ ĐĂNG NHẬP (kiểm tra không bị luật khách đè) ---
  sidebar flex-direction=row (phải là row)
  nút đăng xuất: flex (phải là flex)
  hero flex-direction=row (phải là row)
=== WAVE 45 GUEST-CENTRE: PASS ✅ ===
```
**Lệch 0px** — căn giữa tuyệt đối ở cả 2 chỗ.

**Chạy lại:** `env -u ELECTRON_RUN_AS_NODE npx electron tools/probe-guest-centre.js`

---

## 3. KHUNG ĐĂNG NHẬP BẰNG DISCORD (OAuth2) — đúng như bro chỉ

Bro yêu cầu **đích danh** link `https://discord.com/oauth2/authorize?client_id=......`.
Nay tab **Cài đặt → Cách 2 · Đăng nhập bằng Bot** chính là khung đó:

- Ô **Application (Client) ID** (có gợi ý lấy ở đâu).
- **6 chip quyền** giống hệt trang *OAuth2 → URL Generator* của Discord
  (Xem kênh / Gửi tin nhắn / Đọc lịch sử / Nhúng link / Emoji ngoài / Thả cảm xúc).
  Tổng quyền hiện ra dạng số (bitmask) ngay bên dưới.
- Ô **xem trước link** luôn hiển thị **ĐÚNG** link sẽ mở.
- Nút **MỞ TRANG MỜI BOT (authorize)** → mở trình duyệt hệ thống.
- Nút **Đăng nhập hồ sơ (scope identify)** → mở luồng đăng nhập hồ sơ.
- Nút **Copy** link.

### Số đo thật — `tools/probe-wave45-oauth.js`
```
--- 2) Chip quyền → bitmask ---
  không chọn (fallback): 1024 · chỉ View Channels: 1024
  +Send: 3072 · +Embed: 19456
  6 quyền: 347200 (kỳ vọng 347200)          ← cộng bit ĐÚNG

--- 3) Link authorize thật khi bấm nút ---
  xem trước: https://discord.com/oauth2/authorize?client_id=1234567890123456789&permissions=347200&scope=bot
  đã mở 2 URL:
    [1] https://discord.com/oauth2/authorize?client_id=1234567890123456789&permissions=347200&scope=bot
    [2] https://discord.com/oauth2/authorize?client_id=1234567890123456789&response_type=code&scope=identify&redirect_uri=…
=== WAVE 45 OAUTH + APP-TOKEN: PASS ✅ ===
```

### ⚠️ NÓI THẬT: OAuth2 có "trích được token tài khoản" không?
**KHÔNG.** Bro hỏi thẳng nên tôi trả lời thẳng, không vẽ ra tính năng không có:

| Cách | Lấy được gì | Cày Orb được không |
|---|---|---|
| OAuth2 `scope=identify` | chỉ **username + avatar + id** (và chỉ khi có `client_secret` để đổi `code` → access token) | ❌ **Không.** Access token OAuth2 **không** phải user token, không gọi được `/quests/@me`. |
| **Bot token** | đọc tên/avatar, **mời bot vào server** | ❌ **Không.** Discord chỉ cho **token TÀI KHOẢN NGƯỜI DÙNG** gọi `/quests/@me` + `claim-reward`. |
| **User token** (Cách 1 — Console) | toàn quyền tài khoản | ✅ **Có.** Đây là cách duy nhất cày được. |

→ Khung OAuth2 này **vào server + đăng nhập hiển thị hồ sơ** thì ngon, nhưng
**muốn cày Orb vẫn phải dùng token người dùng ở Cách 1**. Điều này cũng đã ghi
ngay trong app (dòng ghi chú vàng cuối hướng dẫn).

---

## 4. TOKEN ỨNG DỤNG TỪ FILE `.txt` — KHÔNG LỘ RA CHAT

Bro: *"tôi sẽ gán token của nó vào trong `.txt` và nhờ bro mở nó ra đưa vào đúng
đường dẫn miễn không paste lên đoạn chat này là không lộ nhé"*.

### Định dạng file `.txt` bro tạo
```txt
# Token ứng dụng Auto Quest — KHÔNG chia sẻ file này
app_id        = 123456789012345678
bot_token     = MTIz…(3 phần, ngăn bởi dấu chấm)
client_secret = xxxxxxxxxxxxxxxxxxxxxxxx
```
(Thứ tự bất kỳ; `#` là chú thích; thiếu khoá nào bỏ qua khoá đó.)

### Trong app bấm **CHỌN FILE .TXT ĐỂ NẠP**
App sẽ: đọc → kiểm tra định dạng → **mã hoá bằng khoá hệ thống (safeStorage)** →
ghi vào **`%APPDATA%\AUTO-QUEST\app_secrets.json`** (chmod 600).

### Cam kết bảo mật — và đã ĐO để chứng minh
```
--- 6) KIỂM TRA RÒ RỈ BÍ MẬT ---
  bot_token     trong NHẬT KÝ: false · trong DOM: false · trong FILE: false
  client_secret trong NHẬT KÝ: false · trong DOM: false · trong FILE: false
```
- Giá trị bí mật **không bao giờ** đi ra renderer — IPC chỉ trả **boolean**
  (`hasBotToken`, `hasClientSecret`) + `app_id` (công khai).
- `client_secret` **không bao giờ** đi vào link authorize (link chỉ cần `client_id`).
- Thông báo lỗi **không echo token**.
- Nút **Xoá token** để thu hồi.

### Đường dẫn cần đưa token vào
```
%APPDATA%\AUTO-QUEST\app_secrets.json
```
→ Trong app có nút **mở thư mục dữ liệu** để bro tự kiểm.

**Chạy lại:** `env -u ELECTRON_RUN_AS_NODE npx electron tools/probe-wave45-oauth.js`

---

## 5. HƯỚNG DẪN LẤY TOKEN APP (bro yêu cầu cụ thể)

Đã viết **ngay trong app** (mũi tên sổ ra, 6 bước). Tóm tắt:

1. Mở **discord.com/developers/applications** → **New Application** → đặt tên →
   tick đồng ý điều khoản → **Create**.
2. Tab **General Information** → copy **Application ID** (dãy 18-19 chữ số).
   → Đây chính là `client_id` trong link authorize.
3. Cùng tab → **Reset Secret** → **Copy** → `client_secret`.
4. Tab **Bot** → **Reset Token** → **Copy** → `bot_token`.
5. Vẫn tab **Bot** → **Privileged Gateway Intents** → bật **SERVER MEMBERS INTENT**
   → **Save Changes**. (Để bot đọc được tên + ảnh đại diện.)
6. Gom 3 giá trị vào **1 file `.txt`** theo mẫu → bấm **CHỌN FILE .TXT ĐỂ NẠP**.

Ngoài ra trong app có nút **Kiểm tra bot** (gọi `GET /users/@me` bằng header
`Authorization: Bot <token>`) để biết token còn sống không.

---

## 6. TỔNG KẾT KIỂM THỬ

| Bộ kiểm thử | Kết quả |
|---|---|
| `tools/validate-ui.js` | **319/319 marker · TẤT CẢ OK** (HTML cân bằng, 0 id thiếu) |
| `tools/contrast-audit.js` | **60 mẫu, ALL ≥ 4.5:1** (gồm cả 2 icon + khối OAuth + khối .txt) |
| `tools/theme-audit.js` | **0 mục chìm trên cả 2 chế độ** |
| `tools/probe-log-color.js` | **PASS ✅** (9/9 dòng có dấu tích SVG, 5 màu, ≥7.07:1) |
| `tools/probe-guest-centre.js` | **PASS ✅** (lệch 0px, cả 2 chỗ; login không bị đè) |
| `tools/probe-wave45-oauth.js` | **PASS ✅** (link authorize thật, bitmask đúng, 0 rò rỉ token) |
| `tools/probe-wave44.js` | **PASS ✅** (thương hiệu, ZoZ, hướng dẫn, theme nâu) |
| `tools/probe-done-tile.js` | **PASS ✅** (ô "Đã làm" 169×169, hover trong ô) |
| `tools/probe-wave42.js` | **PASS ✅** |
| `tools/csp-verify.js` | **CSP_LOADED: true · VIOLATIONS: []** |
| `tools/quest-classify-test.js` | **10 PASS / 0 FAIL** |
| `tools/claim-seq-test.js` | **calls `['qA','qA+cap','qB','qB+cap']` · done 2 · modal đóng sạch** |
| `npx tsc --noEmit` | **exit 0** |
| `node --check` (main / preload / renderer) | **OK** |
| Khởi động app thật (`npx electron .`) | **boot sạch, 0 lỗi JS** |

### Lưu ý về ảnh chụp màn hình
Máy này chạy headless nên `capturePage()` trả về **khung đen** (GPU process báo
`Failed to create shared context for virtualization`). Đây là **giới hạn môi
trường**, không phải lỗi app — app khởi động thật thì vẽ bình thường. Vì vậy mọi
kết luận ở trên đều dựa trên **số đo DOM thật**, không dựa vào ảnh.

---

## 7. FILE ĐÃ SỬA / THÊM

**Sửa:**
- `electron/renderer/renderer.js` — `U229_ICON` + `u229IconHtml()`, `appendLog`
  chèn icon, dòng tiến trình đổi sang tick, `openAuthorize()`, `oauthPermMask()`,
  `refreshOauthPreview()`, `refreshAppTokState()`, bỏ `btnBotLogin` cũ.
- `electron/renderer/styles.css` — `.u229-ico`, màu icon theo trạng thái, căn giữa
  profile khách, `.dlogin` / `.apptok` / `.perm-chip` / `.oauth-url-preview`.
- `electron/renderer/index.html` — tab Cách 2 viết lại thành khung đăng nhập
  Discord + khối token `.txt` + hướng dẫn 6 bước (kèm ghi chú nói thật).
- `electron/main.js` — `parseKeyValue`, `readAppSecrets`, `writeAppSecrets`,
  IPC `apptoken:status|import-txt|clear`, `oauth:build-url`, `bot:whoami`.
- `electron/preload.js` — expose 5 hàm mới (chỉ trả boolean, không trả bí mật).
- `tools/validate-ui.js`, `tools/contrast-audit.js`, `tools/probe-wave44.js` —
  cập nhật marker/sample cho tính năng mới.

**Thêm:**
- `tools/probe-log-color.js` (viết lại cho dấu tích),
- `tools/probe-guest-centre.js`,
- `tools/probe-wave45-oauth.js`,
- `tools/decode-shot.py` (đọc PNG/JPEG thuần Python để chẩn đoán ảnh),
- `tools/shot-wave45.js`,
- `docs/WAVES-45-KET-QUA.md` (file này).
