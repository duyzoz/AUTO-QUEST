# 📒 SỔ WAVES# — AUTO-QUEST PRO

> **Luật:** số waves viết dạng **`Waves#<N>`** (tiền tố `#`), **CHỈ TĂNG**, không trùng, không lùi.
> README chính **KHÔNG** chứa danh sách này (giữ file nhẹ) — chỉ giữ sơ đồ tư duy Waves I/II/III/IV + skill đúc kết.
> Mỗi waves xong ⇒ **1 dòng ngắn** ở đây + 1 dòng trong file ngày `YYYY-MM-DD.md`.
> Đang **chờ push** ⇒ ghi vào khối "⏳ CHỜ PUSH" bên dưới.
> Khi bro ra lệnh build EXE/setup ⇒ gom `#0 → #N` thành **release notes** (mỗi `#` 1 dòng + link code, dòng cuối `@duyzoz`) rồi push GitHub Releases.

**Đánh số lại (honest renumber):** đếm từ log thật trong `.brain/` + `.workbuddy-ai/memory/` — được **54 phiên** (max cũ = `Waves 55`; **không có #36 và #48**). Bro chốt: phiên vừa xong (trước gọi `Waves 55`) = **`Waves#84`** ⇒ **offset +29** cho dải `#26 → #55`.

- `Waves#0 → #25` = **số gốc, KHÔNG đổi** (trùng khớp giữa README cũ, `.brain/`, code comment).
- `Waves#26 → #84` = dải đã dồn offset (giữ nguyên tổng 54 phiên).

---

## Waves#0 → #25 · Số GỐC (không đổi)

| #      | Nội dung ngắn                                              | Ngày       | Nguồn                        |
| ------ | ---------------------------------------------------------- | ---------- | ---------------------------- |
| **#0** | Audit repo — 13 lỗi, đề xuất waves                         | 19/10      | start                        |
| #1     | (không tồn tại — liệt kê ban đầu)                          | —          | —                            |
| #2     | Triển khai logic bot & xử lý dữ liệu                       | 19/10      | `.brain/WAVE_LOG.md`         |
| **#3** | Fix orbs cộng ảo + UI/UX + dọn repo                        | 19/10      | `.brain/2026-10-19.md`       |
| #4     | Dữ liệu thật + bỏ auto-enroll                              | 19/10      | `.brain/2026-10-19.md`       |
| #5     | Chuẩn hoá log — giữ 3 phiên gần nhất                       | 19/10      | `.brain/2026-10-19.md`       |
| #6     | Luật waves không trùng số                                  | 19/10      | `.brain/2026-10-19.md`       |
| #7     | Dev lại công cụ build EXE (KHÔNG build)                    | 19/10      | `.brain/2026-10-19.md`       |
| #8     | README: Waves I-B (tự vibe 10 waves) + model log           | 19/10      | `.brain/2026-10-19.md`       |
| #9     | escapeHtml · mở Discord (IPC) · a11y log · tổng Orbs       | 19–20/10   | `.brain/2026-10-20.md`       |
| #10    | Smooth Progress — throttle render + pref + cảnh báo token  | 20/10      | `.brain/2026-10-20.md`       |
| #11    | Discord Dress-Up — đại cải tổ UI theo Discord web          | 20/10      | `.brain/2026-10-20.md`       |
| #12    | Left Rail Rebuild — rail server-icon + user panel          | 20/10      | `.brain/2026-10-20.md`       |
| #13    | Kasumu Reskin — bê design system + diệt 100% emoji         | 20/10      | `.brain/2026-10-20.md`       |
| #14    | Profile & Balance — hero giữa + số dư đáy sidebar          | 20/10      | `.brain/2026-10-20.md`       |
| #15    | Profile Centerpiece & Logout Guard                         | 20–21/10   | `.brain/2026-10-20.md`       |
| #16    | Orb Wallet Truth — số dư từ `/quests/@me/claimed`, EXE OK  | 21/10      | `.brain/2026-10-20.md`       |
| #17    | Kasumu Profile Polish — nameplate pill, ID, build run-dir  | 21/10      | `.brain/2026-10-21.md`       |
| #18    | Nameplate Full Wrap + Badges + fix popup logout            | 21/10      | `.brain/2026-10-21.md`       |
| #19    | Badge Icon Path Fix — `discord.com/assets/*.svg`           | 21/10      | `.brain/2026-10-21.md`       |
| #20    | Orb Engine v2 — 20 loại nhiệm vụ + ví THẬT + startup claim | 21/10      | `.brain/2026-10-21.md`       |
| #21    | Wallet Truth + Full-HD Fit + chip nameplate/decoration     | 21/10      | `.brain/2026-10-21.md`       |
| #22    | Quest Card Rebuild — thẻ nhiệm vụ thật + 3 tab + log gọn   | 21/10      | `.brain/2026-10-21.md`       |
| #23    | Real Assets + Terminal Log — CDN quest thật, logo Orbs     | 21/10      | `.brain/2026-10-21.md`       |
| #24    | Log Terminal + Run Fix — 3 nút macOS, Auto ORBs chạy thật  | 22/10      | `.brain/2026-10-22.md`       |
| **#25**| Loader Motion + Tab Truth — rAF loader + `completed_at`    | 22/10      | `.brain/2026-10-22.md`       |

---

## Waves#26 → #84 · DẢI OFFSET +29 (giữ 54 phiên)

| #       | Tên cũ      | Log FX  | Nội dung ngắn (1 dòng)                                            | Ngày    |
| ------- | ----------- | ------- | ----------------------------------------------------------------- | ------- |
| **#26** | Waves 26    | +29·#55 | Stream từng quest + dedupe + avatar shimmer                       | 22/10   |
| #27     | Waves 27    | +29·#56 | UI/UX: scrollbar, viền cầu vồng profile, buffer RAM, log màu      | 22/10   |
| #28     | Waves 27b   | +29·#57 | Fix viền cầu vồng bám sai vùng                                    | 22/10   |
| #29     | Waves 28    | +29·#58 | Bảng tên, viền theo palette, Sáng/Tối, dọn build 1 slot           | 22/10   |
| #30     | Waves 28b   | +29·#59 | Sáng "chìm hết màu" + bảng tên "1 chạy 1 dead"                    | 22/10   |
| #31     | Waves 28b-2 | +29·#60 | Build slot khoá cứng + bằng chứng 100%                            | 22/10   |
| #32     | Wave 29b/c  | +29·#61 | Dọn sạch workspace root + gỡ lớp lồng                             | 22/10   |
| #33     | Wave 30     | +29·#62 | Replace logo ORB cũ bằng logo mới                                 | 22/10   |
| #34     | Wave 31     | +29·#63 | CLAIM THẬT + hCaptcha dựng ngay trong client                      | 22/10   |
| #35     | Wave 32     | +29·#64 | Kiểm thử THẬT với token sống                                      | 22/10   |
| #36     | Wave 33     | +29·#65 | Backoff 429 · dọn quest 404 · hàng đợi claim                      | 22/10   |
| #37     | Wave 34     | +29·#66 | GỐC RỄ: `file://` phá cookie hCaptcha → loopback HTTP             | 22/10   |
| #38     | Wave 35     | +29·#67 | 3 lỗi làm token captcha bị Discord từ chối                        | 22/10   |
| #39     | Wave 37     | +29·#68 | Truy ra GỐC RỄ "captcha-required" (chứng minh bằng đo)            | 22/10   |
| #40     | Wave 37b    | +29·#69 | Body gửi kèm đổi PHẢN HỒI của Discord                             | 22/10   |
| #41     | Wave 38     | +29·#70 | TỰ ĐỘNG xác minh + đo "hộp trắng"                                 | 22/10   |
| #42     | Wave 39     | +29·#71 | Đọc repo `discord-quest-helper` + đúc kết                          | 22/10   |
| #43     | Wave 40     | +29·#72 | Triển khai A+B+C (giữ UI/UX, đổi logic)                           | 22/10   |
| #44     | WAVE 41     | +29·#73 | (phiên 23/10)                                                     | 23/10   |
| #45     | WAVE 42     | +29·#74 | Nhật ký ASCII · màu theo chế độ · logo thật · không tự mở captcha | 23/10   |
| #46     | WAVE 43     | +29·#75 | Sửa theo 7 ảnh bro gửi (giải mã pixel, KHÔNG đoán)                | 23/10   |
| #47     | WAVE 44     | +29·#76 | Sửa gốc rễ "??" + màu nhật ký + ô Đã làm + thương hiệu            | 23/10   |
| #48     | WAVE 45     | +29·#77 | Dấu tích nhật ký · Profile khách giữa · Discord OAuth2 · Token txt | 23/10   |
| #49     | Wave 46     | +29·#78 | Dọn "MỜI BOT" + ORB to giữa + fix chìm màu chế độ Sáng            | 23/10   |
| #50     | WAVE 47     | +29·#79 | KIỂU TÊN HIỂN THỊ (Discord Display Name Styles)                   | 24/10   |
| #51     | Wave 49     | +29·#80 | Profile effect / frame / theme colors                             | 24/10   |
| #52     | WAVE 50     | +29·#81 | BỎ KHUNG/HIỆU ỨNG Ở HERO + màu Nitro làm nền 2 khung              | 24/10   |
| #53     | WAVE 51     | +29·#82 | BỎ HẾT layer nền xếp sau chữ + khung ôm góc bo                    | 24/10   |
| #54     | WAVE 52     | +29·#83 | Khôi phục khung tên bo tròn + bỏ layer @user/ID + Nitro mờ dần    | 24/10   |
| #55     | WAVE 53     | +29·#84 | Dải trắng giữa banner/Nitro, chữ "thô", khung popout              | 25/10   |
| #56     | WAVE 54     | +29·#85 | Popout khung, xoá khung xanh, Nitro/banner, chìm màu, audit repo  | 25/10   |
| **#57** | **WAVE 55** | +29·**#86** | **4 yêu cầu bro: junction "mờ mờ" · khung tên ĐỘNG · chống chìm màu · popout** | **25/10** |
| **#85** | REBRAND 1 | — | **Xoá "khung xanh" trái** (`.up-row{border:none}` + bỏ `has-np` glow) | 25/10 |
| **#86** | REBRAND 2 | — | Banner trái `Trọng tâm` → **ZoZ Community** (topbar-brand) | 25/10 |
| **#87** | REBRAND 3 | — | **Logo mới** `assets/zoZ-logo.png` (`.side-brand .brand-logo`) | 25/10 |
| **#88** | REBRAND 4 | — | Tên app → **ZoZ Development** (title/topbar/side-brand/About) | 25/10 |
| **#89** | REBRAND 5 | — | **Dời profile xuống đáy sidebar**, 3 nav đẩy lên; `#upRow` = SIBLING `#upPop` | 25/10 |
| **#90** | REBRAND 6 | — | **Popup sổ NGƯỢC LÊN** (`bottom:calc(100% + 10px)`) | 25/10 |
| **#91** | REBRAND 7 | — | **Logout icon ĐỎ** + layer đảo (`--danger` 2 theme) | 25/10 |
| **#92** | REBRAND 8+9 | — | **Multiaccount** (`#accSwitchModal` + `#accConfirmSwitchModal` ⇒ reload) + **Cài đặt bỏ dán token** (chỉ avt/@user/UID + drawer) | 25/10 |
| **#93** | REBRAND 10 | — | **Guest hero KHÔNG ORB** ⇒ nền xanh Discord `rgb(88,101,242)` + nút Đăng nhập ⇒ mở popup | 25/10 |
| **#95** | FIX LAYOUT | — | **`body{display:block}`** — sửa "thừa nửa bên phải khi thu nhỏ tab" (`.shell` là flex item nên co về nội dung 514.5px thay vì 1064px) | 25/10 |
| **#96** | 7 HẠNG MỤC UI/UX | — | **Brand** (logo cạnh tên + vòng, tên CHỈ `ZoZ Development`) · **hết khung xanh** (`--tint: #8b5cf6` + 3 fallback) · **logout có nền `--ink-600`** 2 theme · **quét nhanh** (đảo await + nhịp bò %) · **acc list** hết cắt viền + scrollbar · **màn "Đang đăng nhập"** + reset phiên + warm-up RAM | 25/10 |
| **#97** | ĐÓNG GÓI PHÁT HÀNH | — | **MIT LICENSE** (+`LICENSE.txt` cho NSIS) · **bộ cài `setup.exe`** (NSIS: màn chào→giấy phép→chọn thư mục→shortcut→gỡ cài, theo từng user KHÔNG UAC, chặn <Win10/32-bit, tự taskkill bản đang chạy, giữ `%APPDATA%` khi gỡ) · **`icon.icns`** cho macOS · **target Linux** (AppImage+deb) **macOS** (dmg+zip x64/arm64) · `tools/build.js` cờ `--setup/--portable/--all/--linux/--mac` (mỗi loại 1 thư mục con, KHÔNG xoá chéo) · `tools/push-github.js` · README badge + bảng tải + **Star History** | 25/10 |

> ⚠️ **CHÚ Ý — cần bro chốt:** bro nói *"TÍNH TỪ CON SỐ 84 TRƯỚC BRO LÀM ẤY"* ⇒ nếu "con số 84" là **phiên `WAVE 55`** (4 yêu cầu #81/#82/#83/#84 của bro) thì **`Waves#84` = WAVE 55** và dải counter trên **đúng 54 phiên**. Chờ bro xác nhận.

---

## 🧪 BẢN ĐỒ COUNTER HỢP LỆ (đề xuất — bro chốt)

| Phương án                                   | `Waves#84` = ? | Tổng phiên | Có lỗ hổng `#36/#48`? | Nhận xét |
| ------------------------------------------- | -------------- | ---------- | --------------------- | -------- |
| **A · Khớp counter (ĐANG DÙNG)**            | `WAVE 55`      | 54         | Không (liền mạch)     | Giữ nguyên số gốc 0–25 ✓ |
| B · Khớp log thật                           | `Wave 46`      | 54 + lỗ 36/48 | Có (36, 48 trống)  | Số gốc 0–25 khớp code ✓ |

---

## ✅ ĐÃ PUSH — v1.0.0 (25/10/2026)

> Release: https://github.com/duyzoz/AUTO-QUEST/releases/tag/v1.0.0 (id `411911191`)
> Commit `17c5eeb` → merge `4b44573` → `e78d050` trên nhánh `main`.
> Asset: `Auto.Quest.Setup.1.0.0.exe` (84.85 MB) · `Auto.Quest.1.0.0.portable.exe` (84.33 MB) · `SHA256SUMS.txt`

## ⏳ CHỜ PUSH (đợt sau)

> Gom mọi `#` chưa lên GitHub. Khi bro ra lệnh build ⇒ chuyển thành release notes.

| #        | Thay đổi ngắn                                                       | Ref code                                                      |
| -------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| #53–#57  | (xem bảng trên — dải `Waves#53 → #57`)                              | `electron/renderer/styles.css` · `renderer.js`                |
| **#57**  | Junction Nitro↔banner tan "mờ mờ" cả 2 profile                      | `styles.css` `.ph-banner::after` / `.up-pop-banner::after`     |
| **#57**  | Khôi phục khung bo tròn tên/logo — màu ĐỘNG (`--np-ring`)           | `renderer.js` `applyNameplate()` · `styles.css` `.ph-nameplate` |
| **#57**  | Chống chìm màu theme Sáng khi account bot (gate `has-plate`)        | `styles.css` khối `[data-theme="light"]`                     |
| **#57**  | Popout: xác minh hộp frame khớp thẻ, back-staple ẩn                 | `styles.css` `.up-pop .pf-frame-layer`                        |
| **#57**  | **Popout SÁT thẻ: `--pf-fit` 999 → 1 (hết tràn dọc 80.5px)**        | `styles.css` `.up-pop .dp-frame.custom-profile-frame`          |
| **#84**  | **Popout hết LỆCH TRÁI tourner-đo: `doCompute` đọc `offsetWidth/offsetHeight` (không bị `upPopIn scale(0.98)` làm méo)** | `renderer.js` `doCompute()` (hostW/hostH)                      |
| **#85–#91** | **REBRAND "ZoZ Development":** xoá khung xanh · banner `ZoZ Community` · logo mới · tên app · dời profile xuống đáy + nav đẩy lên · popup sổ ngược lên · logout icon ĐỎ 2 theme | `index.html` · `styles.css` `.up-row`/`.up-pop`/`.up-logout-red` |
| **#92**  | **Multiaccount + Cài đặt bỏ dán token:** `#accSwitchModal`(2 mục) → `#accConfirmSwitchModal`(`Đóng`/`Xác Nhận`) ⇒ **reload client**; Cài đặt chỉ avt + `@user` + UID + drawer token | `renderer.js` khối multiaccount · `main.js` `accounts:*` · `preload.js` |
| **#93**  | **Guest hero KHÔNG ORB** ⇒ nền **xanh Discord `rgb(88,101,242)`** + nút `Đăng nhập tài khoản Discord` ⇒ mở popup | `renderer.js` `resetDiscordProfile()` · `styles.css` `.profile-hero.is-discord-guest` |
| **#93b** | **5 bug thật đã vá** (kiểm ảnh mới thấy): `#upRow` trong `#upPop` · hero giữ `.is-discord-guest` · Orb sót ở guest · hint token cũ · `btnLogout2` thiếu `ui` map | `index.html` (1 `</div>`) · `renderer.js` |
| **#95**  | **Fix layout responsive:** `body{display:flex}` ⇒ **`display:block`** — hết "thừa nửa bên phải" khi thu nhỏ tab (`.shell` co về 514.5px ở cửa sổ 1064px) | `styles.css` khối `body` |
| **#96**  | **7 hạng mục UI/UX:** (1–3) **brand** — logo flex-row cạnh tên + `.brand-logo-wrap` có viền, xoá `.brand-tag`/`.topbar-tag`/tiền tố title, `ZOZ_TAG` ⇒ `'ZoZ Development'`; **xoá `--tint:#8b5cf6` + 3 fallback `\|\| '#8b5cf6'`** (nguồn khung xanh) + gate `[data-np-real='1']`. (4) **logout nền `--ink-600`** (Tối `#1d2334`/Sáng `#e2e8f2`) — KHÔNG dùng `#fff`/`--ink-800` vì TRÙNG nền cha. (5) **quét nhanh**: đảo `await saveConfig` xuống SAU `setScanning` + `startCreep()` bò % 90ms lên trần 88%. (6) **acc list**: xoá `translateX(2px)` hover + `max-height:220px;overflow-y:auto`. (7) **`.login-veil`** (2 con: chữ + 8 dot, nền `--ink-950` 98% + blur, z9000) + `showLoginVeil`/`resetQuestSessionForSwitch`/`warmUpAccountAssets` | `index.html` · `styles.css` `.side-brand`/`.brand-logo-wrap`/`.up-logout`/`.up-pop-*`/`.accsw-*`/`.login-veil` · `renderer.js` `confirmSwitchAccount`/`startCreep`/`btnScan` · `tools/probe-wave96.js` |
| **#97**  | **Đóng gói phát hành:** `LICENSE` MIT + `LICENSE.txt` (CRLF) cho trang giấy phép NSIS; `resources/installer.nsh` (chặn <Win10/32-bit · `taskkill` bản đang chạy · registry Uninstall · **giữ `%APPDATA%` khi gỡ cài**); `resources/icon.icns` + `icon-512/256/128/64.png`; `package.json` thêm **`nsis`** (`oneClick:false` · `perMachine:false` · `allowToChangeInstallationDirectory` · shortcut · `license` · `include` · `artifactName:"Auto Quest Setup ${version}.${ext}"`) + `linux`/`mac`/`dmg` + scripts `build:setup/portable/linux/mac`; `tools/build.js` cờ `--setup/--portable/--all/--linux/--mac` ghi vào **thư mục con riêng** (KHÔNG xoá chéo); `tools/push-github.js`; README badge + bảng tải setup/portable/Linux/macOS + **`## ⭐ Star History`** cuối file | `LICENSE` · `LICENSE.txt` · `package.json` · `resources/installer.nsh` · `resources/icon.icns` · `tools/build.js` · `tools/push-github.js` · `README.md` |

---

## 📜 MẪU RELEASE NOTES (chỉ ghi khi bro ra lệnh build)

```
## What's Changed

* fix(ui): tan mờ junction Nitro ↔ ảnh bìa cho cả popout và hero by @duyzoz in #57
* fix(ui): khôi phục khung bo tròn tên/logo, màu lấy động từ palette thật by @duyzoz in #57
* fix(a11y): hết chìm màu chế độ Sáng với account không Nitro/nameplate by @duyzoz in #57
* fix(ui): popout ôm sát thẻ, ẩn back-staple full-bleed by @duyzoz in #57
...
* @duyzoz
```

**Quy tắc:** `#0 → #N` đủ số · mỗi `#` **1 dòng ngắn** · có **tham chiếu bấm ra đúng đoạn code** · dòng cuối **luôn** là `@duyzoz`.
