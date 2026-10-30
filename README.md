# ⚡ AUTO-QUEST PRO (Web PWA Edition)

![Release](https://img.shields.io/github/v/release/duyzoz/AUTO-QUEST?color=ff9e64\&label=Version)

![Platform](https://img.shields.io/badge/Platforms-Web%20PWA%20%7C%20Windows%20%7C%20macOS%20%7C%20Linux-10b981)

![Theme](https://img.shields.io/badge/Theme-Dark%20Strong%20Vesper-e0af68)

![Waves](https://img.shields.io/badge/Waves%23-150%20%C2%B7%20Active-e0af68)

![License](https://img.shields.io/badge/License-MIT-3b82f6)

![GitHub stars](https://img.shields.io/github/stars/duyzoz/AUTO-QUEST?color=e0af68\&label=Stars)

![GitHub forks](https://img.shields.io/github/forks/duyzoz/AUTO-QUEST?color=10b981\&label=Forks)

> ## 🌐 BẢN THUẦN WEB (v2.0.0)
>
> - **Không cần cài đặt.** Chạy `web/start.bat` (hoặc `npm start`) rồi mở
>   **http://127.0.0.1:4173**. Trên domain riêng: xem [`docs/DEPLOY.md`](docs/DEPLOY.md).
> - **Token chỉ nằm trong trình duyệt** (IndexedDB, mã hoá AES-GCM 256, IV mới mỗi lần ghi,
>   khoá thiết bị **không export được**, không có đường rơi về base64). Không server nào,
>   không proxy nào nhìn thấy token. API `getConfig()` không trả token — muốn lấy token thật
>   phải gọi `tokenReveal()` và phải có thao tác thật của người dùng.
>   **Giới hạn thật:** web thuần không bất khả xâm phạm — script chạy cùng origin (XSS) vẫn
>   giải mã được nếu lấy được cả khoá lẫn bản mã. Lớp chắn thật là CSP khép kín + không còn điểm
>   chèn HTML/CSS. Chi tiết: [`docs/DEPLOY.md`](docs/DEPLOY.md) §7.
> - **HTTPS bắt buộc** khi deploy thật (hCaptcha + Web Crypto). `http://127.0.0.1`
>   và `http://localhost` được trình duyệt coi là nguồn tin cậy nên vẫn chạy được.
> - **Không có Electron, không có EXE.** Toàn bộ bot chạy trong Web Worker ngay trên máy bạn.
> - **hCaptcha không bị bỏ qua.** Khi Discord yêu cầu xác minh, app mở widget thật để bạn
>   tự giải — app không bao giờ tự vượt hay chuyển captcha sang người khác.
> - Kiểm tra nhanh: `npm test` (self-test cấu trúc, CSP, ID, cú pháp JS, rà token rò rỉ).

> ## 🤖 LƯU Ý CHO AI AGENT (BẮT BUỘC ĐỌC TRƯỚC KHI VIẾT/SỬA CODE)
>
> **ĐỌC [`docs/AGENT-BRIEF.md`](docs/AGENT-BRIEF.md) TRƯỚC TIÊN** — đó là điểm vào duy nhất: luật bất
> biến (I1–I7), decision log (D1–D8), bản đồ file, backlog waves có phụ thuộc + tiêu chí nghiệm thu, và
> danh sách việc **bị cấm**. Mọi tài liệu khác chỉ là bằng chứng cho file đó.
>
> Trước khi viết/sửa code, agent **PHẢI đọc hết README này** (mục **Quy trình Waves** + **`---- Log AI Agent ----`** ở cuối). Không đọc = làm lệch kiến trúc.  
> Sau mỗi phiên: ghi **1 dòng log** vào mục Log AI Agent (model thật + việc đã làm + đang dở) và **chỉ giữ đúng 3 log gần nhất** — log cũ hơn xoá khỏi README.  
> Muốn hiểu thật kĩ mọi thay đổi: đọc thư mục **`.brain/`** (log đầy đủ theo ngày `YYYY-MM-DD.txt`).

> ### 🆔 BƯỚC 0 — TỰ NHẬN DIỆN MODEL CỦA CHÍNH BẠN (BẮT BUỘC)
>
> **Bất kỳ AI nào động vào code dự án này phải biết chính xác mình là model gì trước khi gõ dòng code đầu tiên.**
>
> 1. Lấy tên model từ **thông tin runtime/phiên làm việc thật của bạn** (chuỗi model id mà hệ thống đang chạy trong phiên này).
> 2. **CẤM** điền tên model của phiên trước · **CẤM** copy log cũ · **CẤM** đoán · **CẤM** để trống.
> 3. Không tự xác định được → ghi đúng `UNKNOWN-MODEL` để chủ dự án tìm ra, đừng bịa.
> 4. Ghi 1 dòng vào đầu `.brain/` log ngày đó: `MODEL CHECK: <model-id> — session <thời gian>`.

---

## 🌊 Quy Trình Waves (BẮT BUỘC)

**Waves I / I-B / II / III là các MỤC CHÍNH bắt buộc** (khung cố định). Bên trong mỗi mục chính:

- Waves con được agent **tự vibe sáng tạo** hoặc theo promt của người dùng.
- **CẤM đặt tên waves con trùng tên đề mục chính** (`Waves I`, `Waves I-B`, `Waves II`, `Waves III`). Waves con dùng **số riêng** + **tên riêng sáng tạo** (VD: `Waves#10 · Boost progress bar`, `Waves#11 · Ninja log cleanup`).
- Mỗi waves con vẫn tuân luật đánh số `#0 → ∞` chỉ tăng bên dưới.

Các giai đoạn cố định: **Waves I → Waves I-B (tự vibe 10 waves, nếu cần) → Waves II → Waves III**.

```mermaid
flowchart LR
    U["👤 Người dùng"] -->|"promt thô sơ /<br/>không yêu cầu /<br/>yêu cầu đơn giản"| V["✨ Waves I-B<br/>Agent tự vibe<br/>TỐI THIỂU 10 waves"]
    V --> P["📜 Trình bày cho user:<br/>tóm gọn ý chính +<br/>sơ đồ waves icon đẹp"]
    P --> Q{"⚡ User bấm<br/>✅ Xác nhận hoặc<br/>➡️ Tiếp tục?"}
    Q -->|"đồng ý"| II
    Q -->|"chỉnh / từ chối"| V
    U -->|"yêu cầu rõ ràng"| I["🌊 Waves I<br/>Triển khai waves<br/>& nhận yêu cầu waves nhỏ"]
    I --> Q
    II["⚙️ Waves II<br/>Coder bắt đầu làm việc"] --> III["🧪 Waves III<br/>Kiểm thử — TS build pass<br/>(theo yêu cầu người dùng)"]
    III -.->|"feedback / yêu cầu mới"| I
```

| Giai đoạn     | Nội dung                                                                                                                | Ai quyết định                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **Waves I**   | Triển khai waves, tiếp nhận yêu cầu waves nhỏ từ người dùng                                                             | Người dùng + Agent                |
| **Waves I-B** | Agent **tự vibe ra các waves** đóng góp cho dự án (fix lỗi, tối ưu, sửa UI/UX, thêm tính năng) — **TỐI THIỂU 10 waves** | Agent đề xuất → **user xác nhận** |
| **Waves II**  | Bắt đầu làm việc (coder) — sửa code, UI/UX, logic                                                                       | Agent                             |
| **Waves III** | Kiểm thử — `tsc` build pass, syntax check, smoke test                                                                   | Agent (theo yêu cầu người dùng)   |

### ✨ Waves I-B — Tự vibe ra waves (khi yêu cầu thô sơ)

**Khi nào áp dụng:**

- Người dùng chỉ promt **thô sơ**, muốn có cái gì đó **ngay lập tức**.
- Người dùng **không yêu cầu gì** cụ thể.
- Người dùng chỉ yêu cầu **đơn giản** / mơ hồ / không đủ chi tiết để bắt tay code.

**Cách làm (BẮT BUỘC):**

1. **Từ từ** — không nhảy vô code. Agent tự suy nghĩ và liệt kê **TỐI THIỂU 10 waves** có đóng góp thật cho dự án. Ví dụ nhóm waves được vibe: 🐞 fix bug · ⚡ tối ưu / performance · 🎨 sửa UI/UX · ✨ thêm tính năng · 🧹 dọn repo / tài liệu · 🔒 bảo mật · ♿ accessibility · 🧪 kiểm thử · 📦 build & release.
2. Mỗi waves vibe ra phải có: **số waves riêng** (không trùng số cũ — xem luật đánh số bên dưới), **icon**, **mô tả 1 dòng**, **mức độ ưu tiên**.
3. **Ghi ra cho user đọc** — tóm gọn **ý chính**, trình bày gọn bằng **sơ đồ waves đẹp, icon đầy đủ** (không đổ ra tường chữ).
4. **DỪNG lại ở đây** — chờ user bấm **✅ Xác nhận** hoặc **➡️ Tiếp tục** thì mới được sang **Waves II**.
5. User chưa xác nhận → **không viết code**. User chỉnh sửa / từ chối → vibe lại.

> 🧾 Mẫu trình bày cho user (agent copy cấu trúc này, tự điền nội dung theo dự án):
>
> ```mermaid
> flowchart LR
>     A["🐞 Waves#8<br/>Fix bug X"] --> B["⚡ Waves#9<br/>Tối ưu Y"]
>     B --> C["🎨 Waves#10<br/>Sửa UI/UX Z"]
>     C --> D["✨ Waves#11<br/>Tính năng W"]
>     D --> E["🧹 Waves#12<br/>Dọn repo & docs"]
> ```

**Quy tắc đánh số (BẮT BUỘC — không được vi phạm):**

- Dải số: **`#0` → `#∞`**, mỗi phiên edit = **1 waves mới**.
- **Chỉ TĂNG**: waves kế tiếp = **số lớn nhất đã ghi + 1**.
- **CẤM** trùng số waves · **CẤM** lùi số · **CẤM** reset về `#0` · **CẤM** dùng số nhỏ hơn log gần nhất.
- Người dùng yêu cầu waves → vẫn tăng dần theo tiến độ, **không đánh lại số cũ**.
- Người dùng nhắn nhiều thay đổi trong 1 phiên → gộp vào **1 waves duy nhất** (không tách trùng số).
- Waves **tự vibe** cũng tuân luật trên: ghi trước vào kế hoạch, **chỉ tính là "đã dùng" khi user xác nhận và agent làm xong**.
- Số waves viết dạng **`Waves#<N>`** (tiền tố `#` bắt buộc, chỉ số tăng dần).

### 📒 Sổ waves `Waves#<N>` — nơi lưu (BẮT BUỘC)

| Việc                                     | Ghi vào đâu                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Mỗi waves mới sau khi làm xong            | **`.workbuddy-ai/memory/<YYYY-MM-DD>.md`** — 1 dòng: `Waves#<N> — <thay đổi ngắn>`               |
| Đang chờ push / khung giờ chờ push        | Cùng file ngày đó, thêm khối **"CHỜ PUSH"** (gom mọi `#` chưa push)                                |
| README chính                              | **CHỈ** sơ đồ tư duy Waves I/II/III/IV + skill đúc kết — **CẤM** đổ danh sách `#` liên tục vào đây |
| Build EXE / setup                        | Khi bro ra lệnh → mới gom `#0 → #N` thành **release notes** + push GitHub Releases                 |

> 📌 **Release notes** (chỉ khi build): mỗi `#` **1 dòng ngắn**, có tham chiếu bấm ra đúng đoạn code; dòng cuối luôn là tác giả **`@duyzoz`**.
> Dạng chuẩn GitHub:
> `* fix(ui): <thay đổi ngắn> by @duyzoz in #<N>`

### 📋 Backlog Waves I-B (đề xuất — chờ bro duyệt)

Khi bro chỉ cần "cải thiện / fix lỗi / thêm tính năng", agent vibe ra **≥10 waves** như sau (đã làm **Waves#9**, còn lại là đề xuất, chưa chạm code):

```mermaid
flowchart LR
    A["🐞 Waves#9 ✅<br/>Fix escapeHtml<br/>(chống injection)"] --> B["✨ Waves#10<br/>Nút mở Discord<br/>(locked IPC)"]
    B --> C["♿ Waves#11<br/>a11y: aria-live<br/>focus rõ"]
    C --> D["📊 Waves#12<br/>Tổng Orbs<br/>đã chọn"]
    D --> E["⚡ Waves#13<br/>Throttle progress<br/>giảm reflow"]
    E --> F["🔒 Waves#14<br/>Security guard<br/>chặn URL ngoài"]
    F --> G["🧹 Waves#15<br/>Dọn console.log<br/>chuẩn hoá log level"]
    G --> H["🧪 Waves#16<br/>Unit test<br/>escapeHtml/dedupe"]
    H --> I["📦 Waves#17<br/>Checksum log<br/>khi build EXE"]
    I --> J["🎨 Waves#18<br/>Empty-state<br/>hướng dẫn rõ"]
    J --> K["💾 Waves#19<br/>Lưu pref<br/>autoScroll/loop"]
    K --> L["🔔 Waves#20<br/>Toast cảnh báo<br/>khi token hết hạn"]
```

> 🟢 **Waves#9 đã làm xong** (bro xác nhận): `escapeHtml` đúng chuẩn · nút "↗ Discord" mở `discord.com/quests` qua IPC chỉ cho phép `discord.com` · `role="log" aria-live` cho nhật ký · hiển thị tổng Orbs của các quest đã chọn.  
> ⚪ **Waves#10–#20** là backlog đề xuất — bro bấm **✅ Xác nhận** / gõ "làm tiếp" để agent triển khai từng wave (mỗi wave = 1 số mới, không trùng).  
> 📒 **Sổ waves đầy đủ `Waves#0 → Waves#84`** (1 dòng/số) nằm trong **`.workbuddy-ai/memory/`** theo ngày — README cố tình KHÔNG chứa để giữ file nhẹ.

---

## 🧠 Sơ Đồ Tư Duy Dự Án

```mermaid
mindmap
  root((AUTO-QUEST PRO))
    Web PWA
      Thuần HTML/CSS/JS
      Quét - Chọn - Auto ORBs
      Account Chip Login
      Dark/Light Vesper UI
    Core Bot
      TypeScript
      Discord API trực tiếp
      Quest Manager
    Bảo mật
      Token AES-GCM (IndexedDB)
      Chặn endpoint ngoài
      Security Guard
```

## 🔄 Luồng Hoạt Động Chuẩn

```mermaid
flowchart TD
    A["🔑 Dán Token<br/>(tự xác thực @user)"] --> B["🔍 Quét nhiệm vụ"]
    B --> C["📋 Danh sách THẬT<br/>từ Discord API"]
    C --> D{"Phân loại theo<br/>completed_at"}
    D -->|"đã hoàn thành"| E["✅ Tab Đã làm<br/>xanh · dấu tích ✓"]
    D -->|"chưa hoàn thành"| F["⏳ Tab Chưa làm<br/>viền đỏ · checkbox"]
    F --> G["☑️ Tích chọn / Chọn tất cả"]
    G --> H["▶ Auto ORBs (N)"]
    H --> I["🎮 Cày nhiệm vụ<br/>pacing chậm chống rate-limit"]
    I --> E
    E --> J["🎁 Tự nhận thưởng"]
```

> ⚠️ **Nguyên tắc vàng:** App **KHÔNG tự nhận nhiệm vụ** (không auto-enroll). Chỉ quét danh sách thật — người dùng tự nhận nhiệm vụ trong app Discord nếu muốn, sau đó tích chọn trong app và bấm **Auto ORBs**.


## 🗺️ Hướng Đi (Roadmap)

> **Đây là SƠ ĐỒ TƯ DUY chính** — chỉ giữ các **trục lớn Waves I / I-B / II / III** và các **waves# mốc đã đúc kết thành skill**. Sổ `#` đầy đủ nằm trong `.workbuddy-ai/memory/`.

```mermaid
flowchart LR
    subgraph I["🌊 WAVES I · Triển khai & nhận yêu cầu"]
        I0["Waves#0<br/>Audit repo<br/>13 lỗi"] --> I3["Waves#3–8<br/>Fix orbs · dữ liệu thật<br/>luật waves · build EXE · README"]
    end
    subgraph IB["✨ WAVES I-B · Agent tự vibe ≥10 waves"]
        I9["Waves#9<br/>escapeHtml · mở Discord<br/>a11y · tổng Orbs"] --> I10["Waves#10–13<br/>Smooth Progress · Discord Dress-Up<br/>Left Rail · Kasumu Reskin"]
    end
    subgraph II["⚙️ WAVES II · Coder làm việc"]
        I14["Waves#14–20<br/>Profile & Balance · Orb Wallet Truth<br/>Badge path · Orb Engine v2"] --> I21["Waves#21–30<br/>Full-HD Fit · Quest Card thật<br/>Real Assets · Tab truth · Nameplate"]
    end
    subgraph III["🧪 WAVES III · Kiểm thử & hoàn thiện"]
        I31["Waves#31–40<br/>Claim thật · hCaptcha · 429 backoff<br/>loopback HTTP · tự xác minh"] --> I41["Waves#41–49<br/>Nhật ký ASCII · OAuth2 · DNS styles<br/>Profile effect / frame / theme colors"]
        I41 --> I50["Waves#50–84<br/>Bỏ layer nền sau chữ · khung ôm góc bo<br/>Nitro↔banner tan mờ · khung tên ĐỘNG<br/>chống chìm màu Sáng/Tối · popout sát thẻ"]
    end
    I3 --> I9
    I13["Waves#13 ✅"] -.-> I14
    I10 --> I14
    I30["Waves#30 ✅"] -.-> I31
    I50 --> PUSH["⏸ Push GitHub<br/>(chờ lệnh bro)"]
```

### 🧠 Skill đúc kết (kiến thức chốt lại của dự án)

| Skill / Luật chốt                                       | Nội dung cốt lõi                                                                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Waves#11–13 · Discord Look**                          | Bê nguyên design system Discord/kasumu: rail 88px · sidebar 256px · Inter + JetBrains Mono · **diệt 100% emoji** → SVG stroke.                                                    |
| **Waves#20 · Orb Engine v2**                            | Phủ **20 loại nhiệm vụ** Discord (`TASK_META` + `kind` → endpoint), ví Orb THẬT `virtual-currency/balance`, fail-fast chống treo.                                                |
| **Waves#25 · Tab Truth**                                | Phân loại tab theo **`completed_at` / `claimed_at`** (không theo "đã enroll") → hết quest rác ở tab Chưa nhận.                                                                  |
| **Waves#34–39 · Captcha thật**                          | `file://` phá cookie hCaptcha ⇒ **serve qua loopback HTTP**; token captcha bị từ chối vì body/`sitekey`/`rqdata`; kết luận: không có mẹo nào ở lại trong app.                    |
| **Waves#47 · Display Name Styles**                      | `data-dns-effect` = solid / gradient / prism / neon / toon / pop / gummy; toon dùng `--custom-toon-stroke-width`.                                                                |
| **Waves#49 · Frame + Effect model**                     | `staple` / `rail` / `border` · `anchor` top/bottom · `order` front/back; INNER 1200 × OVERFLOW 304/212/56; `<img>`là replaced element ⇒ host effect phải là `<div>`.             |
| **Waves#53 · Luật 4.5:1 cho CẢ dải gradient**           | `--theme-fg` phải đạt ≥4.5:1 ở **MỌI điểm** dải: chọn trắng/đen theo **điểm XẤU NHẤT**, thiếu thì kẹp độ sáng **GIỮ HUE**; `--theme-fg-soft` = **đúng** màu chữ chính.           |
| **Waves#53–54 · Nitro & nền**                           | Nitro **ĐỤC, không `mask`**, gradient **dọc 180deg**, `top: var(--theme-banner-h)`; **CẤM tấm nền đặc** sau chữ/huy hiệu/icon; nội dung phải "thả" trên artwork.                  |
| **Waves#55(→#84) · Junction tan "mờ mờ"**               | `.ph-banner::after` / `.up-pop-banner::after`: `transparent 0% → 62% màu accent → --theme-b 100%`, cao `--banner-fade-h = clamp(16, h*0.28, 30)`px ⇒ hết seam, không dải trắng. |
| **Waves#55(→#84) · Khung tên ĐỘNG**                     | `--np-ring` (palette THẬT) → `--theme-b` (Nitro) → `transparent`; **CẤM** fallback tím `#8b5cf6`; `--np-fg` chỉ dùng khi có `has-plate`.                                          |
| **Waves#55(→#84) · Popout khung**                       | `--pf-fit:999 --pf-fit-x:1 --pf-shift:0` — khung **BAO QUANH** thẻ, ẩn back-staple full-bleed; `scrollHeight > clientHeight` KHÔNG phải khoảng trống thật.                        |

> 📖 Chi tiết sâu từng luật + bẫy probe: `.workbuddy-ai/memory/MEMORY.md` và các file ngày trong `.workbuddy-ai/memory/`.

---

## 🎨 Tính Năng

| Tính năng                         | Mô tả                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dark Strong Vesper**            | Nền OLED `#000000`, bề mặt than/nâu `#100d14`, điểm nhấn hổ phách `#ff9e64`.                                                                                                                                                                                                                                                                                                                                       |
| **Bố cục Discord Left-Rail**      | Rail icon trái (Auto Quest · Cài đặt · Giới thiệu) + user panel góc dưới-trái: avatar + tên + icon **Đăng xuất** (có modal xác nhận Huỷ/Đăng xuất); popout profile Discord (banner · avatar decoration · clan badge · nameplate hiệu ứng); **hero profile Discord thật** giữa trang là hero duy nhất khi đã đăng nhập.                                                                                             |
| **SỐ DƯ KHẢ DỤNG (kasumu style)** | Thẻ đầu hàng trong mục **Auto Orb** (cạnh Nhật ký): **nền XANH EMERALD** gradient + sheen kiểu thẻ ngân hàng, label uppercase + icon coins, **số font-mono emerald xanh như tiền**, nảy số + lướt sáng 1 lượt mỗi lần cập nhật. Số dư lấy từ **VÍ THẬT** `GET /users/@me/virtual-currency/balance` (fallback: cộng `orb_quantity_claimed`); orb done-chưa-claim hiện line phụ "chờ nhận thưởng".                   |
| **Thẻ nhiệm vụ kiểu Discord**     | Mỗi nhiệm vụ là **1 thẻ nhỏ bo tròn, 3 thẻ/dòng**: banner thật (`assets.hero`) + logo game, "Được quảng bá bởi ✅ NPH", "Kết thúc vào dd/mm", ảnh thưởng (**Orb** hoặc **avatar decoration**), kicker "NHIỆM VỤ …", tiêu đề "Nhận N Orbs", mô tả. **3 tab**: Chưa làm · Chưa nhận · Đã làm. Ô tích chọn nằm trên banner; **vòng tiến độ tròn chạy theo chiều kim đồng hồ**, rê chuột vào ảnh thưởng mới hiện **%**. |
| **Nhật ký gọn**                   | Nằm ngay cạnh thẻ Số dư (không chiếm thêm chiều cao trang): khi quét chỉ hiện **vòng xoay "snake"** + **đếm N/M nảy số**, xong thì chốt tổng — không spam từng dòng tiến độ.                                                                                                                                                                                                                                       |
| **Account Chip Login**            | Dán token → tự xác thực `discord.com/api` → hiện `@username` + avatar thật từ Discord CDN.                                                                                                                                                                                                                                                                                                                         |
| **Quét trước — Chạy sau**         | **Quét nhiệm vụ** lấy danh sách thật → tab **Chưa làm** (checkbox từng thẻ + **Chọn tất cả**) → **Auto ORBs (N)** chạy đúng nhiệm vụ đã chọn.                                                                                                                                                                                                                                                                      |
| **Không tự nhận nhiệm vụ**        | App tuyệt đối không auto-enroll. Nhiệm vụ "Chưa nhận" hiển thị đúng trạng thái Discord, checkbox khoá cho tới khi bạn nhận trong app Discord.                                                                                                                                                                                                                                                                      |
| **Số liệu chuẩn 100%**            | "Đã làm" chỉ chứa nhiệm vụ Discord xác nhận `completed_at`; "Chưa làm" chỉ chứa nhiệm vụ còn hiệu lực (đã bắt đầu, chưa hết hạn, không preview).                                                                                                                                                                                                                                                                   |
| **Orbs chuẩn**                    | Mỗi nhiệm vụ cộng Orbs đúng **một lần** (dedupe theo quest id), không cộng ảo khi quét lại.                                                                                                                                                                                                                                                                                                                        |
| **Bảo mật theo mô hình web**       | Chỉ kết nối `discord.com` + hCaptcha (CSP `connect-src` chốt tên host, `script-src` không `unsafe-inline`/`unsafe-eval`). Token mã hoá AES-GCM trong IndexedDB, không có server trung gian. Không phải "tuyệt đối": xem giới hạn thật ở `docs/DEPLOY.md` §7. |
| **Treo AFK Loop**                 | Tự đếm ngược chu kỳ 15/30/45/60 phút để quét lại nhiệm vụ mới.                                                                                                                                                                                                                                                                                                                                                     |

---

## 📥 TẢI VỀ CÀI ĐẶT

> 🎁 Bản phát hành chỉ có **2 loại file cho Windows**: `.setup.exe` (bộ cài) và `.portable.exe` (bản chạy trực tiếp).
> Ngoài ra có thêm bản **Linux** (`.AppImage` / `.deb`) và **macOS** (`.dmg` / `.zip`).

### 🖥️ Windows Desktop

Vào **[Releases](https://github.com/duyzoz/AUTO-QUEST/releases)** → chọn **1 trong 2**:

| File | Dùng khi nào | Đặc điểm |
| --- | --- | --- |
| **`Auto Quest Setup 1.0.0.exe`** | Cài đặt như phần mềm bình thường (**khuyến nghị**) | Có màn chào · trang **giấy phép** · **chọn thư mục cài** · tự tạo **shortcut Desktop + Start Menu** · xuất hiện trong **Apps & Features** để gỡ cài sạch sẽ |
| **`Auto Quest 1.0.0 portable.exe`** | Muốn chạy ngay, không cài | Nhấp đúp là mở · để trên USB/ổ cứng ngoài cũng chạy · không tạo shortcut, không vào registry |

> Cả hai bản dùng **cùng một chỗ lưu token** `%APPDATA%\AUTO-QUEST` — nên cài lại / gỡ cài **KHÔNG mất session**, và chuyển qua lại giữa setup ↔ portable vẫn giữ nguyên đăng nhập.

**Cách dùng:** Mở app → dán token → bấm **Quét nhiệm vụ** → chọn nhiệm vụ → **Auto ORBs**.

### 🐧 Linux

- Tải **`Auto Quest 1.0.0.AppImage`** → `chmod +x` → chạy trực tiếp (không cần cài).
- Hoặc **`Auto Quest 1.0.0.deb`** → `sudo dpkg -i "Auto Quest 1.0.0.deb"` (Debian/Ubuntu).

### 🍎 macOS

- Tải **`Auto Quest 1.0.0 x64.dmg`** (Intel) hoặc **`Auto Quest 1.0.0 arm64.dmg`** (Apple Silicon M-series).
- Mở `.dmg` → kéo **Auto Quest** vào **Applications**.
- Lần đầu mở nếu bị chặn: **Chuột phải → Open** (hoặc `System Settings → Privacy & Security → Open Anyway`) — bản này chưa ký số (unsigned).

### 🌐 Web (PWA v2.0.0 — hướng duy nhất, đã hoàn thành port)

Bản iOS/TrollStore **đã được gỡ bỏ** khỏi dự án, bản desktop Electron 1.0.0 và bản chạy thử
`web-poc/index.html` cũng đã bị xoá khỏi repo (chỉ còn trong lịch sử git). App hiện tại là
**Web PWA thuần**: chạy `npm start` rồi mở **http://127.0.0.1:4173** — xem [`docs/DEPLOY.md`](docs/DEPLOY.md).
Các tài liệu phân tích thời Electron đã được đánh dấu ARCHIVED ở đầu file.

---

## 🔑 HƯỚNG DẪN LẤY TOKEN DISCORD

### Cách 1: Máy tính (Console)

1. Mở Discord (Web/App), bấm `F12` → tab **Console**.
2. Nếu Discord chặn dán: gõ `allow pasting` rồi Enter.
3. Dán đoạn mã sau rồi Enter:

```javascript
window.webpackChunkdiscord_app.push([
	[Symbol()],
	{},
	req => {
		if (!req.c) return;
		for (let m of Object.values(req.c)) {
			try {
				if (!m.exports || m.exports === window) continue;
				if (m.exports?.getToken) return copy(m.exports.getToken());
				for (let ex in m.exports) {
					if (m.exports?.[ex]?.getToken && m.exports[ex][Symbol.toStringTag] !== 'IntlMessagesProxy') return copy(m.exports[ex].getToken());
				}
			} catch {}
		}
	},
]);
window.webpackChunkdiscord_app.pop();
console.log('%c🎉 ĐÃ COPY TOKEN DISCORD THÀNH CÔNG! 🎉', 'color: #10b981; font-size: 22px; font-weight: bold; background: #000; padding: 10px; border-radius: 8px;');
```

1. Quay lại app bấm **Dán** → chip góc phải tự hiện `@username` → **Lưu**.

### Cách 2: iPhone (Safari)

1. Safari → `discord.com/app`, đăng nhập.
2. Trong app bấm **COPY SCRIPT LẤY TOKEN**.
3. Thanh địa chỉ Safari: gõ `javascript:` rồi dán script, Enter.
4. Quay lại app bấm **Dán** → **Lưu Token**.

---

## 📁 Cấu Trúc Repo

```
AUTO-QUEST-main/
├── web/                        # ★ TOÀN BỘ ỨNG DỤNG THUẦN WEB
│   ├── app/                    # Giao diện (index.html, renderer.js, styles.css, mobile.css, sw.js…)
│   ├── engine/                 # Lõi bot đã biên dịch (bot.js, questManager.js…)
│   ├── identity.js             # Lấy token/clipboard/UA (thay IPC Electron)
│   ├── display-name-style.js   # Kiểu tên hiển thị Discord
│   ├── bridge.js               # window.autoquest — API duy nhất renderer gọi
│   ├── engine-worker.js        # Web Worker chạy bot
│   ├── engine-bundle.js        # Bundle lõi cho Worker
│   ├── build-engine.js         # Đóng gói engine → engine-bundle.js
│   ├── build-static.js         # Xuất bản tĩnh → web-dist/
│   └── server.js / start.bat   # Server tĩnh local (127.0.0.1)
├── engine-src/                 # TypeScript gốc của bot
├── docs/                       # Hướng dẫn + phân tích + DEPLOY.md
├── web-dist/                   # (sinh ra khi build) bản deploy tĩnh
└── README.md
```

---

## 🧪 Chạy Local

```bash
# Cách 1 — Windows: nhấp đúp
web\start.bat

# Cách 2 — mọi hệ điều hành có Node.js 18+
npm start                 # = node web/server.js  → http://127.0.0.1:4173
AQ_PORT=8080 npm start    # đổi cổng khi 4173 đang bận
```

Mở **http://127.0.0.1:4173** (KHÔNG mở `file://` — service worker và Web Crypto cần
nguồn HTTP(S)). Dán token Discord ở **Cài Đặt → Token**, bấm **Quét nhiệm vụ**.

## 📦 Build & Deploy

```bash
npm run build:engine   # biên dịch lõi TypeScript → web/engine-bundle.js
npm run build:static   # xuất bản tĩnh deploy được → web-dist/
npm test               # self-test: cấu trúc, CSP, ID, cú pháp, rà token rò rỉ
```

| Lệnh                   | Tác dụng                                                                       |
| ---------------------- | ------------------------------------------------------------------------------ |
| `npm start`            | Server tĩnh local, chỉ nghe `127.0.0.1` — không lộ ra mạng LAN.                 |
| `npm run build:engine` | Đóng gói `engine-src` + adapter thành bundle cho Web Worker.                    |
| `npm run build:static` | Copy toàn bộ app + adapter + font vào `web-dist/` để upload lên hosting tĩnh.   |
| `npm test`             | Chạy `web/test/self-test.js` — không cần mạng, không cần token thật.           |

**Deploy lên domain riêng:** xem [`docs/DEPLOY.md`](docs/DEPLOY.md) (Cloudflare Pages,
Netlify, Nginx). Bắt buộc **HTTPS**; `web-dist/` là document root, không cần backend —
mọi request Discord/hCaptcha đi thẳng từ trình duyệt người dùng.

> ⚠️ **Không tự ý deploy/push** nếu chủ dự án chưa ra lệnh.

---

## 📜 Giấy phép & Miễn trừ trách nhiệm

Phát hành theo **[MIT License](LICENSE)** — tự do dùng, sửa, chia sẻ, kể cả thương mại, miễn giữ nguyên dòng bản quyền.

Bản quyền © 2026 **duyzoz / NgDuy (ZoZ Community)**.

> ⚠️ **Đọc [`DISCLAIMER.md`](DISCLAIMER.md)** trước khi dùng: dự án **học tập**, **không liên kết chính thức** với Discord Inc. Thương hiệu "Discord", logo, Orb thuộc bản quyền Discord Inc. Người dùng tự chịu trách nhiệm tuân thủ Điều khoản Dịch vụ của Discord.

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=duyzoz/AUTO-QUEST&type=Date)](https://star-history.com/#duyzoz/AUTO-QUEST&Date)

> Nếu thấy dự án hữu ích, hãy để lại **1 ⭐** cho repo nhé — đó là động lực để ZoZ Development làm tiếp. 💚

---


## ---- Log AI Agent ----

> **Luật:** chỉ giữ **đúng 3 log gần nhất** (mới nhất trên cùng). Log cũ hơn xoá khỏi README. Muốn hiểu thật kĩ mọi thay đổi → đọc **.brain/**. Mỗi dòng ghi **đúng model của phiên đó**.

- **[2026-10-28 · QODER-AGENT · Wave#133a/b/c — 3 lỗi P0 sau khi chuyển web]** (a) Khoá layout fit-1080 bằng `body[data-page="quest"]` trong media query nên Thống kê/Cài đặt/Giới thiệu không còn bị chặn cuộn; `switchPage()` set `document.body.dataset.page` + reset `#appScroll.scrollTop`. (b) Theme Sáng: tên hiển thị 1.03:1 → 19.41:1 nhờ `npInkFor()` ưu tiên `--theme-fg` Nitro, đo tương phản thật với `dnsSurface()` rồi `dnsAdjustContrast(...,4.5)`, chỉ thêm shadow khi nền tối (không aura trắng); pipeline font-Nitro/màu-thật giữ nguyên 100%, chạy lại khi lật theme. (c) hCaptcha: chứng minh lỗi "hết thời gian tải" là timeout do máy yếu chứ không phải mạng (curl 0.43s) → `ensureHcaptcha()` 20s × 2 lần tự thử lại, thoát khi tab hiện lại, log `warn` + nút "Thử lại" thay vì bắt tải lại cả app. `npm test` 11/11, integrity 12/12, SW `autoquest-shell-v14`.
- **[2026-10-28 · UNKNOWN-MODEL · Wave#116 — captcha nhanh & đúng theme]** Bỏ lớp nền bao quanh widget hCaptcha (`.captcha-slot` trong suốt, không border) và tự dựng lại widget khi đổi Sáng/Tối giữa lúc mở modal; nạp sẵn API hCaptcha sau đăng nhập/quét/chạm nút Nhận; bỏ delay cứng 1,2s trước claim đầu và 800ms giữa các claim hàng loạt (bridge chỉ giữ khoảng cách 1,2s giữa 2 claim liền kề). Logic claim/`claimed_at`/captcha giữ nguyên, không bypass.
- **[2026-10-29 · QODER-AGENT · Wave#134 — vá bảo mật sau rà soát (theo cloudflare/security-audit-skill)]** F1: CSP `script-src` bỏ `unsafe-inline`/`unsafe-eval` (đo thật: 0 inline script/handler, 0 eval), host hCaptcha chốt theo tên thay wildcard, thêm `base-uri`/`object-src 'none'`/`form-action 'none'`/`upgrade-insecure-requests` + `meta referrer=no-referrer`; `frame-ancestors` chuyển khỏi `<meta>` (meta không áp dụng được) sang HTTP header. F2/F3: `getConfig()`/`accountsList()` không còn trả token → thêm `tokenReveal()` có cổng `isTrusted` (6 giây boot, dùng 1 lần), `secureStatus()`; bỏ hẳn nhánh giáng cấp `b64:` (IndexedDB/crypto bị chặn ⇒ KHÔNG ghi plaintext, chỉ RAM + cảnh báo), migration tự nâng cấp bản `b64:` cũ lên AES (QA: `b64:` → `aes:` cả top lẫn từng tài khoản), log engine đi qua `maskSecrets()`. F4: `web/server.js` + `web/build-static.js` (`web-dist/_headers`) trả đủ CSP/frame-ancestors/XFO DENY/nosniff/no-referrer/Permissions-Policy/HSTS; `docs/DEPLOY.md` thêm §3b cho **Cloudflare Workers** (Workers **không đọc `_headers`** → snippet Worker trả header + đối chiếu bằng `curl`). F5/F6: một `escapeHtml` duy nhất, whitelist `aqAssetHash`/`aqAssetToken`, `toHexColor` chỉ nhận `#rrggbb`/6 hex/số nguyên (chặn thoát CSS trong gradient banner), `renderDiscordProfile`/`discordAvatarSrc`/`appIconUrl` validate id+hash, avatar dựng bằng `createElement('img')` thay vì chuỗi HTML. F7: SW `postMessage` chặn origin lạ, `SKIP_WAITING` cần `event.source` cùng origin (v15). **QA bằng token GIẢ** (không đụng credential thật): IDB chỉ còn `aes:`, 0 chuỗi plaintext, reveal bị từ chối khi không click thật / thành công sau click thật, merge-theo-id giữ tokenEnc khi lưu settings (fix regression: lưu settings không làm mất token đăng nhập), payload hostile bị chặn hết, `a_…` (avatar gif Nitro) được nhận trở lại — đã thêm check tự test để không tái phạm. `npm test` **17/17**, curl header đủ, console 0 vi phạm CSP, hCaptcha render thật (`hcaptcha.render` + iframe `newassets`) dưới CSP khép kín không cần `unsafe-eval`. UI/UX + font Nitro/màu thật giữ nguyên 100%.
