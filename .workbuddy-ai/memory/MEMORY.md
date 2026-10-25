# AUTO-QUEST → **ZoZ Development** — Ghi chú dài hạn

> Chi tiết theo ngày ở `memory/YYYY-MM-DD.md`. Sổ `#` đầy đủ ở `memory/WAVES-STORE.md`.
> **TỐI THƯỢNG**: mọi thứ ĐỘNG theo token từng user — **CẤM hardcode sku/tài khoản**.

## 🔥 WAVES#96 — 7 HẠNG MỤC UI/UX (brand · khung xanh · logout · quét · acc list · login veil)

- **BRAND**: logo = **flex-row CẠNH tên** qua `.brand-logo-wrap` (34×34, `1px solid --line-strong`,
  bo 50%) — XOÁ rule absolute cũ. Tên app **CHỈ `ZoZ Development`**: xoá `.brand-tag`,
  `.topbar-tag`, tiền tố `<title>`, và `ZOZ_TAG` (tên hiển thị khách) ⇒ `'ZoZ Development'`.
- **NGUỒN "KHUNG XANH" (đã tìm ra)**: `styles.css:1368` đặt **`--tint:#8b5cf6`** ⇒
  `.hero-card`/`.stat-card` `box-shadow: 0 0 0 1px color-mix(..., var(--tint, var(--brand)) 30%)`,
  CỘNG **3 fallback `|| '#8b5cf6'`** trong `renderer.js` (`applyNameplate`/`applyChipNameplate`/
  `applyProfileAura`). Đã xoá hết + gate `[data-np-real='1']`. ⚠ `--brand:#8b5cf6` (nav/nút/banner)
  là **màu thương hiệu HỢP LỆ** — GIỮ. (Probe quét `*` từng báo 15 "tím" = false positive.)
- **BẪY NỀN NÚT (mới, quan trọng)**: chọn nền nút PHẢI so với **nền CHA THẬT**, không chỉ
  "trắng/đen theo theme". Thử `#ffffff`(Sáng)/`--ink-800`(Tối) ⇒ VÔ HÌNH vì Tối `--ink-800=#10141f`
  ≈ nền popout `--ink-850=#0b0e18`, Sáng `#fff` = nền up-row `#fff`. **DÙNG `--ink-600`**
  (Tối `#1d2334` · Sáng `#e2e8f2`) — nổi trên CẢ popout lẫn up-row của CẢ 2 theme.
- **QUÉT % "đợi một lúc mới chạy"**: gốc = `await api.saveConfig()` (IPC) TRƯỚC `setScanning` +
  chờ event `quest:scan-progress` đầu. VÁ: (a) **đảo thứ tự** trong `btnScan` handler — reset +
  `setScanning(true)` NGAY, `await` SAU; (b) **`startCreep()`** = interval 90ms bò bão hoà
  `remain*0.045` lên trần **88%**, tự dừng khi `creepRealSeen` (bumpScan có số thật).
- **ACC LIST**: xoá `.accsw-item:hover{transform:translateX(2px)}` (gây cắt viền phải) + xoá
  `.accsw-list{max-height:220px;overflow-y:auto}` (gây scrollbar). Đo: `transform:none`,
  `scrollH==clientH`, `left/rightOverflow=0`.
- **CHUYỂN ACCOUNT**: `.login-veil#loginVeil` — **ĐÚNG 2 con** (`.login-veil-text` + `.login-veil-spin`
  8 dot), `fixed;inset:0;z-index:9000;display:grid;place-items:center`, nền
  `color-mix(in srgb, var(--ink-950) 98%, transparent)` + `backdrop-filter:blur(10px)` ⇒ **ĐỤC 98%
  che sạch phiên cũ**. Chỉ animate `transform`/`opacity` + `will-change` + `prefers-reduced-motion`.
  JS: `showLoginVeil()` gọi **ĐẦU TIÊN** trong `confirmSwitchAccount` (ẩn mọi modal/popup +
  `void v.offsetWidth`) · `resetQuestSessionForSwitch()` dọn `quests/questOrder/selected/doneSeen/
  scanBuffer/logText` + `questNodes` + 3 `questList*` + counters · `warmUpAccountAssets(acc)`
  pre-`img.decode()` avatar 128/256 + logo (max 4 ảnh, timeout 1.2s).
- **BẪY PROBE MỚI**: regex chứa `\s`/`\(` trong template literal của probe **BỊ ĂN BACKSLASH** ⇒
  Electron **chết IM LẶNG (0 output), KHÔNG phải treo**. Dùng `.indexOf()` thay regex.
- Verify: `tools/probe-wave96.js` PASS 2 theme · `tools/shot-wave96.js` + `chk-veil.js` +
  `chk-acclist.js`; ảnh `shots-wave96/` (9 file).

## 🌊 LUẬT ĐÁNH SỐ WAVES (bro chốt 25/10)

- Viết **`Waves#<N>`**, **CHỈ TĂNG**, cấm trùng/lùi/reset.
- **README chính KHÔNG chứa danh sách `#`** (bro: *"ĐỪNG GHI LIÊN TỤC NÓ SẼ KHIẾN FILES README
  RẤT NẶNG"*) — README chỉ giữ sơ đồ tư duy Waves I/II/III/IV + skill đúc kết. **I/I-B/II/III là
  ĐỀ CHÍNH, KHÔNG ĐỔI** (`#` chỉ là phụ).
- **Chờ push ⇒ ghi vào khối "⏳ CHỜ PUSH"** trong `WAVES-STORE.md`.
- **Chỉ khi bro ra lệnh build EXE** ⇒ mới gom `#0→#N` thành release notes (mỗi `#` 1 dòng +
  tham chiếu code; dòng cuối luôn `@duyzoz`).
- Offset: `#0–#25` gốc · `#26–#84` dải đã dồn (tên cũ `WAVE 55` = `#84`) · branding+multiaccount
  = **`#85–#93`**.

## 🎨 REBRAND (#85–#93) — XONG

Tên **ZoZ Development** · banner **ZoZ Community** · logo `assets/zoZ-logo.png`. Điểm cần nhớ:
`#upRow` **SIBLING của `#upPop`** trong `#dprofile` (nhét nút vào pop ⇒ sập h=0) · popup sổ
NGƯỢC LÊN `bottom:calc(100%+10px)` · `--danger` = `rgb(220,38,38)` Sáng/`rgb(251,44,54)` Tối ·
multiaccount `#accSwitchModal`→`#accConfirmSwitchModal`⇒reload · guest hero nền **xanh Discord
`rgb(88,101,242)`**. (Chi tiết 10 mục ở daily log 25/10.)

## 📦 ĐÓNG GÓI PHÁT HÀNH (#97) — MIT + setup.exe + đa nền tảng

- **`LICENSE`** (MIT, © 2026 duyzoz / NgDuy (ZoZ Community)) + **`LICENSE.txt`** (CRLF) cho
  trang giấy phép NSIS. CẢ HAI phải tồn tại.
- **`resources/installer.nsh`** — bắt buộc `!ifndef BUILD_UNINSTALLER` cho macro nào chỉ dùng
  khi cài. `customInit` chặn `<Win10`/32-bit; `customCheckAppRunning` `taskkill /F /IM
  "Auto Quest.exe" /T`; **KHÔNG xoá `%APPDATA%\AUTO-QUEST` khi gỡ cài**.
- **`package.json` `nsis`**: `oneClick:false` · `perMachine:false` · `allowElevation:true` ·
  `allowToChangeInstallationDirectory:true` · shortcut Desktop+StartMenu · `license:"LICENSE.txt"` ·
  `include:"resources/installer.nsh"` · `artifactName:"Auto Quest Setup ${version}.${ext}"`.
  `win.target` = **`portable` + `nsis`**. Thêm `linux` (AppImage+deb) + `mac` (dmg+zip x64/arm64).
- **🪤 BẪY electron-builder 26.15.3:** `linux.desktop` phải là **`{ entry: { Name, Comment,
  Categories } }`** — viết phẳng ⇒ lỗi schema **bung ra cả khi build `--win`** (validate toàn config).
- **🪤 BẪY build.js:** mỗi loại build phải ghi vào **thư mục con riêng** (`latest/setup/`,
  `latest/portable/`, `latest/linux/`, `latest/mac/`) và **chỉ dọn thư mục con của loại đang build** —
  nếu `cleanDir(latest/)` thì build `--portable` sẽ xoá mất `setup.exe` vừa dựng.
- **`tools/build.js`** cờ: `--setup` · `--portable` · `--all` (mặc định) · `--linux` · `--mac` · `--check`.
- **`tools/push-github.js`**: `--check` (kiểm tra sẵn sàng, KHÔNG push) · `--dry-run` · chạy thật =
  `git add -A` → commit → `git push https://<token>@github.com/duyzoz/AUTO-QUEST.git main`.
  Token đọc từ `push github(token).txt` — **CẤM in token**. Chặn nếu file token bị git theo dõi.
- **`icon.icns`** trên Windows không có `iconutil` ⇒ tự gói: header `icns` + các entry
  `icp4/icp5/icp6/ic07/ic08/ic09/ic10/ic11/ic12/ic13/ic14` mỗi entry = 4 byte type + `>I` length + PNG.
- macOS build **CHỈ chạy được trên macOS thật**; `build.js` tự bỏ qua (warn) ở HĐH khác.

## 7 LUẬT HIỆNH HÀNH (#53–#84)

1. **Nitro chỉ DƯỚI banner**, `top:var(--theme-banner-h)`, **ĐỤC, KHÔNG `mask`**. Tan trong
   `.ph-banner::after`/`.up-pop-banner::after` vào **accent user** (`--banner-fade-to`), **CẤM tan
   vào `--card`**. `transparent 0%→62% màu→fade-to 100%`, cao `--banner-fade-h=clamp(16,h*0.28,30)px`.
   Gradient **DỌC `180deg`** (chéo ⇒ hở seam).
2. **CẤM `-webkit-text-stroke`** cho `@username`/UID. `--theme-fg` **≥4.5:1 ở MỌI điểm dải**.
3. **HERO giữa: KHÔNG khung, KHÔNG hiệu ứng** (chỉ popout trái). CẤM xoá avatar/tên/banner.
4. **Popout: khung BAO QUANH thẻ** — `--pf-fit:1 --pf-fit-x:1 --pf-shift:0` ⇒ tràn dọc = 0.
   **Bẫy transform:** `.up-pop` vào bằng `upPopIn scale(0.98→1)` ⇒ `doCompute` PHẢI đo
   `offsetWidth/offsetHeight` (đo `getBoundingClientRect()` ⇒ lệch staple 2.2px/bên).
5. **CẤM tấm nền đặc** sau chữ/huy hiệu/icon — nội dung "thả" trên artwork.
6. **Vòng tên/logo**: `--np-ring` (palette thật) → `--theme-b` → `transparent`. **CẤM fallback
   tím `#8b5cf6`** (nguồn "khung xanh xanh").
7. Nút bấm/nhãn khớp `--danger` theme; icon thin-stroke test CẢ 2 theme.

## Probe — LUẬT BẮT BUỘC (tránh lặp bẫy)

- `node tools/check-template-literals.js` TRƯỚC mọi probe (backtick lạc ⇒ Electron chết im lặng
  dù `node --check` PASS). Chạy: `env -u ELECTRON_RUN_AS_NODE npx electron tools/<p>.js`.
  Reload giữ phiên `node tools/cdp-reload.js [ms]`. Debug `AQ_REMOTE_DEBUG=<port>`.
- **Envelope CDP** = `r.result.result.value` ⚠ (đọc `r.result.value` ⇒ im lặng `undefined`/`{}`).
- **Bridge = `window.autoquest`**, KHÔNG phải `window.api` (renderer alias `const api = window.autoquest`).
- **BẪY MỚI (#96):** regex chứa `\s`/`\(` trong template literal của probe BỊ ĂN BACKSLASH ⇒
  Electron **chết IM LẶNG 0 output** (không phải treo) — dùng `.indexOf()` thay regex.
- **Contrast đo PIXEL THẬT** (`px-contrast.py` theo TỪNG CỘT). Nền GRADIENT ⇒ số liệu đảo.
- **Quét NÉT MẢNH**: dùng `r>90 && r>g*1.6 && r>b*1.6` (không `r>150&&g<110`) và **cắt ĐÚNG y**.
- **CSS class ở ĐÚNG cha**: `.profile-hero.is-discord-guest .ph-avatar` cần class trên `#heroProfile`.
- `getComputedStyle` KHÔNG liệt kê `--*` → đọc `el.getAttribute('style')`.
- `opacity` tổ tiên làm contrast vô nghĩa; `-webkit-line-clamp` kẹp `scrollHeight`; `hidden` ⇒ rect=0.
- `getBoundingClientRect()` BỊ NHÂN theo `transform` tổ tiên ⇒ đo CỠ bằng `offsetWidth/offsetHeight`.
- Ảnh `loading="lazy"` ngoài khung nhìn KHÔNG nạp → ép `eager`.
- `capturePage` lần ĐẦU trả SURFACE CŨ → `backgroundThrottling:false` + chụp 2 lần + tắt `transition`.
- Đổi theme BẤM NÚT THẬT; đổi theme ⇒ popout/modal ĐÓNG ⇒ mở lại SAU.
- Modal mở → chỉ đo trong `.modal-card`, kiểm bị đè bằng `elementFromPoint()`.
- Ảnh CDN không nạp `file://` → HTTP server nội bộ + nới CSP `img-src`.
- Token theme PHẢI `:root[data-theme="light"]` (không để trần ⇒ tự ghi đè).
- **POPOUT TỰ ĐÓNG giữa 2 lần CDP** ⇒ mở+đo trong **CÙNG 1 `Runtime.evaluate`**.
- So ảnh với bro phải **CÙNG THEME**. Cổng CDP **đổi sau reload** → `curl /json/list` trước.
- **Selector probe phải khớp code THẬT** (query `[data-acc-idx]` vs code dùng `.accsw-item` ⇒
  "0 item" giả); **assertion đọc đúng field** (chặn xoá acc trả `{skipped:true}`, KHÔNG `ok:false`).

## Giới hạn công cụ

- `Read` ảnh trả "model does not support images" → `crop-see.py <png> <x> <y> <w> <h> [cols]` (ASCII),
  `bounds.py`, `px-contrast.py`. PIL ở venv python. `Add-Type` (OCR) chặn.
- Probe STUB chỉ kiểm renderer, KHÔNG chứng minh `main.js`→API. Test `npm run dev` với phiên bro
  đã đăng nhập. **Build EXE CHỈ SAU KHI bro duyệt hình.**

## ⚠️ BẪY LAYOUT (#95) — `body{display:flex}` làm `.shell` CO VỀ NỘI DUNG

- **Triệu chứng bro báo:** "thu nhỏ tab rồi phóng to ⇒ thừa hẳn khoảng trống bên phải MỘT NỬA".
- **Gốc:** `body{display:flex; align-items:center; justify-content:center}` (Waves 21, ý định
  căn giữa shell >1080p) ⇒ `.shell` thành **flex item `flex:0 1 auto`** ⇒ **co theo nội dung**.
  Tại cửa sổ 1064px: `100vw`=1064 ✔ nhưng `.shell`=**514.5px** ⇒ `gapRight=549.5px`.
- **VÁ (đang hiện hành):** `body{display:block}`. `.shell` tự có `max-width:1920px` +
  `max-height:1080px` nên KHÔNG cần body căn giữa. Đã đo 5 cỡ: 1920/1440/1280/1064/900 →
  `shellW`=đúng bề rộng cửa sổ, `gapRight=0`, `shellX=0`. ≤1023 ⇒ drawer (`mainX=0`) đúng thiết kế.
- **Các fix SAI đã loại (đừng thử lại):** `.shell{flex:1 1 auto}` / `flex:1 1 100%` /
  `align-self:stretch` ⇒ vô tác dụng; `.shell{min-width:100%}` / `flex:0 0 100%` ⇒ `shellW` đúng
  NHƯNG `shellX=-56` + `gapRight=55.6` (vì `body` vẫn `justify-content:center` ⇒ căn giữa shell
  rộng hơn nội dung ⇒ tràn 2 bên).
- **Đo layout đúng cách:** so `.shell` vs `innerWidth` và tính **`gapRight = innerWidth - shellRect.right`**;
  `100vw` **không** đồng nghĩa `.shell` rộng bằng cửa sổ khi nó là flex item.
- Kiểm nhanh nhiều cỡ: `Emulation.setDeviceMetricsOverride{width,height,deviceScaleFactor:1}` rồi
  đo lại; xong `Emulation.clearDeviceMetricsOverride`.

## Đa tài khoản (#88) — kiến trúc

- ĐĨA: mỗi acc lưu **`tokenEnc`** (DPAPI base64), **KHÔNG** token thô. `accountsFromPayload` giải mã
  `tokenEnc`→`token` (renderer CẦN token thô để login — chủ đích, KHÔNG leak).
- IPC: `accounts:from-config`→`{accounts,activeIdx}` · `accounts:add` (dedupe token/id; `.activate`
  ⇒ đổi activeIdx) · `accounts:remove` (**acc đang dùng ⇒ `{skipped:true}`**) · `accounts:set-active`
  (ghi token mới thành token chính, trả `{token}`).
- renderer: `loadAccountsCache` · `renderAccountList` (`.accsw-item`, `.is-active`+`Đang dùng`) ·
  `openAccSw/closeAccSw` · `openSwitchConfirm` · `confirmSwitchAccount` · `addAccountFromToken`.
- **`collectConfig()` PHẢI gửi kèm `accounts`/`activeIdx`** không thì `saveConfig` xoá sạch danh sách.

## API Discord + Frame/Effect (chi tiết daily log #49–#55)

- Quest asset: `quests/{questId}/{snowflake}.{ext}` → `https://cdn.discordapp.com/`+path;
  `"PLACEHOLDER"` = không có.
- `GET /users/{id}/profile?with_mutual_guilds=false` → `user_profile{profile_effect, collectibles[],
  theme_colors:[primary,accent], banner}`. `/users/@me/profile` = 400 VÔ DỤNG.
- `collectibles` MẢNG, `type` SỐ: 0=NONE,1=EFFECT,2=NAMEPLATE,3=FRAME,8=AVATAR_DEC. Frame layer tự
  dựng `.../media/v1/collectibles-shop/{frameSku}/{layerId}/static`.
- **3 BẪY:** `<img>` là REPLACED ELEMENT (con không layout ⇒ host effect phải `<div>`); custom
  property KHÔNG ĐƠN VỊ trong `calc()` làm khai báo VÔ HIỆU (luôn ghi `px`); `100cqw` KHÔNG hợp lệ
  khai trên chính container.
- **BANNER guest** = gradient tím THƯƠNG HIỆU (`.ph-banner.default`) — **KHÔNG phải Orb**, đừng
  "sửa" thành lỗi (lệch tông avt Discord = ĐIỂM CẦN BRO QUYẾT).
