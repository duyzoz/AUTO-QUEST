# ⚡ AUTO-QUEST PRO (Multiplatform Edition)

![Release](https://img.shields.io/github/v/release/duyzoz/AUTO-QUEST?color=ff9e64\&label=Version)

![Platform](https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20iOS%20TrollStore-10b981)

![Theme](https://img.shields.io/badge/Theme-Dark%20Strong%20Vesper-e0af68)

![Waves](https://img.shields.io/badge/Waves%23-100%20%C2%B7%20Active-e0af68)

![License](https://img.shields.io/badge/License-MIT-3b82f6)

![GitHub stars](https://img.shields.io/github/stars/duyzoz/AUTO-QUEST?color=e0af68\&label=Stars)

![GitHub forks](https://img.shields.io/github/forks/duyzoz/AUTO-QUEST?color=10b981\&label=Forks)

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
    Desktop
      Electron 38
      Quét - Chọn - Auto ORBs
      Account Chip Login
      Dark Vesper UI
    iOS TrollStore
      React Native Expo
      IPA No Revoke
      OLED Saver
    Core Bot
      TypeScript
      Discord API trực tiếp
      Quest Manager
    Bảo mật
      Token DPAPI
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
| **Bảo mật 100%**                  | Chỉ kết nối `discord.com` — chặn đứng mọi webhook/endpoint ngoài. Token mã hóa Windows DPAPI.                                                                                                                                                                                                                                                                                                                      |
| **Treo AFK Loop**                 | Tự đếm ngược chu kỳ 15/30/45/60 phút để quét lại nhiệm vụ mới.                                                                                                                                                                                                                                                                                                                                                     |
| **🌙 OLED Saver (iOS)**           | Giữ app hoạt động qua đêm với 0% hao pin.                                                                                                                                                                                                                                                                                                                                                                          |

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

### 📱 iPhone (TrollStore)

- Tải **`AUTO-QUEST-PRO-TrollStore.ipa`** từ Releases/Actions.
- Mở bằng **TrollStore** → **Install** (chạy vĩnh viễn, không hết hạn chứng chỉ).

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
├── bot.ts                  # Entry point bot (compile → electron/bot/)
├── src/                    # Core logic TypeScript
│   ├── client.ts           # Discord REST + Gateway
│   ├── questManager.ts     # Quản lý & thực thi nhiệm vụ
│   ├── security.ts         # Chặn endpoint ngoài
│   └── ...
├── electron/               # Desktop app
│   ├── main.js             # Main process + IPC
│   ├── preload.js          # Bridge an toàn
│   └── renderer/           # UI (index.html, renderer.js, styles.css)
├── mobile/                 # iOS (React Native) — KHÔNG ĐỤNG
├── tools/                  # Công cụ build (build.js EXE, upload IPA)
├── build-release/         # Script + output build/release
│   ├── build-ipa/         # Script build IPA iOS
│   └── exe/               # Output EXE portable (gitignore)
├── docs/                  # Hướng dẫn sử dụng
│   └── AGENT-BRIEF.md     # ★ ĐIỂM VÀO CHO AI AGENT: luật + decision log + backlog waves
├── web-poc/               # Bản chạy thử web (chứng minh CORS Discord mở)
├── .brain/                # Log AI Agent theo ngày (YYYY-MM-DD.txt)
└── README.md
```

---

## 🧪 Dev Mode (xem giao diện trước khi build)

```bash
npm install        # lần đầu
npm run dev        # build bot TS + mở Electron
```

## 📦 Công Cụ Build (đa nền tảng)

```bash
npm run build:check      # DRY-RUN: kiểm tra môi trường + in kế hoạch, KHÔNG tạo file
npm run build            # build Windows: setup.exe + portable.exe  (= --all)
npm run build:setup      # CHỈ build bộ cài  → "Auto Quest Setup 1.0.0.exe"
npm run build:portable   # CHỈ build bản chạy → "Auto Quest 1.0.0 portable.exe"
npm run build:linux      # Linux: AppImage + .deb
npm run build:mac        # macOS: dmg + zip (x64 & arm64) — phải chạy trên macOS thật
```

| Lệnh                             | Tác dụng                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build:check`            | Kiểm tra `node_modules`, icon (.ico/.icns/.png), `LICENSE.txt`, `installer.nsh`, bot core. In kế hoạch. **Không tạo file.**          |
| `npm run build` / `--all`        | `tsc` → `electron-builder --win nsis` **+** `--win portable` → xác minh artifact + sha256. Kết quả nằm gọn trong **`build-release/exe/`**. |
| `npm run build:setup`            | Chỉ dựng **bộ cài NSIS**: màn chào → giấy phép → chọn thư mục → thanh tiến độ → tuỳ chọn shortcut → chạy app.                        |
| `npm run build:portable`         | Chỉ dựng bản chạy trực tiếp.                                                                                                        |
| `node tools/build.js --skip-tsc` | Bỏ qua biên dịch TS (dùng lại `electron/bot/` cũ).                                                                                  |

Output luôn về `build-release/exe/latest/` (đã `.gitignore`) — không còn copy EXE ra gốc repo nữa.

**Bộ cài Windows (NSIS)** được tuỳ biến trong [`resources/installer.nsh`](resources/installer.nsh):

- Cài **theo từng user** (`%LOCALAPPDATA%\Programs\Auto Quest`) → **không hỏi UAC**, nhưng vẫn có nút *"Cài cho tất cả người dùng"* nếu muốn.
- **Chặn Windows 32-bit / Windows < 10** ngay từ đầu bằng hộp thoại rõ ràng (Electron 38 không chạy được).
- Tự **tắt app đang chạy** trước khi ghi đè file (không bị lỗi "file đang được dùng").
- Ghi đầy đủ thông tin vào **Apps & Features** (tên · nhà phát hành · phiên bản · link dự án) để gỡ cài sạch.
- **Giữ nguyên `%APPDATA%\AUTO-QUEST`** khi gỡ cài → cài lại vẫn còn session.

> ⚠️ **Không tự ý chạy `npm run build`** nếu chủ dự án chưa ra lệnh.

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

- **[2026-10-28 · UNKNOWN-MODEL · HANDOFF — rà soát toàn dự án + backlog #101–#117]** Không sửa code. Thêm `docs/AGENT-BRIEF.md` (luật I1–I7 · decision log D1–D8 · 17 wave có tiêu chí nghiệm thu), `docs/RA-SOAT-ORBS-CLAIM.md` (L1–L11, trích dòng code), `docs/PORT-WEB-100-PHAN-TICH.md`, `docs/WEB-VERSION-KHA-THI.md`, `web-poc/index.html`. Kết luận gốc: **2 danh tính Discord** + **`captcha_session_id` bị vứt** + **cổng `challengeOpened` chặn token** ⇒ claim kẹt. Wave kế tiếp: **#101 probe**.
- **[2026-10-28 · UNKNOWN-MODEL · Waves#100 — Claim telemetry & build sync]** Che metadata challenge khỏi UI/log; `pnpm run build:bot` và `node --check` cho main/preload/renderer đều qua.
- **[2026-10-28 · UNKNOWN-MODEL · Waves#99 — Account queue & duplicate claim state]** Hàng đợi và khóa quest đã bị challenge theo account ở cả main/bot; dedupe handoff/session và bỏ response cũ khi đổi account.
