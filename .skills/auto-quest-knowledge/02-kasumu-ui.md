# 02 — KASUMU UI: Design System tham chiếu (Dark-first)

> **Nguồn:** `kasumu-ui/` — bản trích xuất 100% giao diện của `https://kasumu.cloud/`
> (Next.js + Tailwind v4), đóng gói static chạy offline.
> **Vai trò:** Bộ xương UI thực tế đã dùng cho AUTO-QUEST (Waves 13+). Đây là
> **"nguồn sự thật" về token màu / typography / bố cục** của dự án.
> ⚠️ Nội dung chỉ để tham khảo/học tập UI. Route `/api/*` đăng nhập Discord
> **không** được sao chép.

---

## 1. Vì sao kasumu là bộ xương phù hợp cho AUTO-QUEST

Cùng bài toán: **web app dark, tập trung số liệu, sidebar cố định, card thống kê,
bảng danh sách, badge trạng thái, skeleton loading**. Không phải landing page
marketing — mà là **dashboard công cụ**. Nên mọi token dưới đây chuyển thẳng được.

---

## 2. ⭐ BẢNG TOKEN GỐC (trích 1:1 từ CSS — dùng làm chuẩn dự án)

### Màu nền `--color-ink-*` (thang tối 6 bậc)
| Token | Hex | Dùng cho |
|---|---|---|
| `ink-950` | `#05060b` | **Nền chính toàn app** (`<body>`) |
| `ink-900` | `#090b13` | **Sidebar / topbar / card** |
| `ink-850` | `#0b0e18` | Panel phụ, vùng chìm nhẹ |
| `ink-800` | `#10141f` | Card nổi, hộp nhập |
| `ink-700` | `#151a28` | Hover / lớp phủ nhẹ |
| `ink-600` | `#1d2334` | Viền đậm, chip, badge |

> **Quy tắc thang:** mỗi bậc cách nhau rất nhỏ (~1–4 đơn vị RGB). Đó là lý do giao
> diện "phẳng nhưng vẫn có tầng" — phân cấp bằng **chênh sáng cực nhẹ + viền**, chứ
> không bằng đổ bóng nặng.

### Màu chữ & viền
| Token | Giá trị | Ghi chú |
|---|---|---|
| `fg` | `#f3f5fa` | Chữ chính (gần trắng, hơi lạnh) |
| `fg-muted` | `#aab3c8` | Chữ phụ, mô tả |
| `fg-subtle` | `#838da4` | Nhãn nhỏ, meta, chữ mờ nhất |
| `line` | `#ffffff14` (= `rgba(255,255,255,0.08)`) | Viền mặc định |
| `line-strong` | `#ffffff29` (= `rgba(255,255,255,0.16)`) | Viền nhấn / hover |

### Accent (tím — nhận diện thương hiệu)
| Token | Hex | Vai trò |
|---|---|---|
| `brand` | `#8b5cf6` | Màu thương hiệu chính (violet-500) |
| `brand-strong` | `#7c3aed` | Đậm hơn — dùng cho text trên nền sáng, viền nhấn |
| `brand-bright` | `#a78bfa` | Sáng hơn — dùng cho icon active, chỉ báo |

### Màu ngữ nghĩa (từ palette Tailwind gốc của kasumu)
| Vai trò | Token | Hex |
|---|---|---|
| Thành công | `emerald-400` | `#00d294` |
| Lỗi | `red-500` | `#fb2c36` |
| Lỗi nhạt | `red-400` | `#ff6568` |
| Cảnh báo | `amber-400` | `#fcbb00` |
| Thông tin | `cyan-400` | `#00d2ef` |

### Typography
| Token | Giá trị |
|---|---|
| `font-sans` | **Inter** (variable 100–900), fallback `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| `font-mono` | **JetBrains Mono** — dùng cho **số liệu, id, code, log** |
| Cân nặng dùng | `400` normal · `500` medium · `600` semibold · `700` bold |

> **Bài học:** số liệu trong dashboard PHẢI dùng font mono. Nó khiến cột số thẳng
> hàng, mắt so sánh nhanh, và tạo cảm giác "công cụ chính xác".

### Bo góc
| Token | Giá trị | Dùng cho |
|---|---|---|
| `radius-xs` | `0.125rem` | Chi tiết nhỏ |
| `radius-field` | `0.75rem` | **Ô nhập, nút, nav item** |
| `radius-2xl` | `1rem` | Khối trung |
| `radius-card` | `1.125rem` | **Card, panel** |
| `radius-3xl` | `1.5rem` | Khối lớn / hero |

---

## 3. Nền app: 3 lớp chồng (dấu hiệu nhận biết)

Đây là "chữ ký" thị giác của kasumu — tái tạo chính xác:

```html
<div class="pointer-events-none fixed inset-0 select-none overflow-hidden" style="z-index:0" aria-hidden="true">
  <!-- Lớp 1: nền đặc -->
  <div class="absolute inset-0 bg-[#07090e]"></div>
  <!-- Lớp 2: 3 radial-gradient tạo ánh sáng lệch -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_20%_0%,rgba(222,68,59,0.08),transparent_60%),
                                          radial-gradient(ellipse_60%_50%_at_85%_25%,rgba(0,107,180,0.08),transparent_65%),
                                          radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(16,24,39,0.4),transparent_70%)]"></div>
  <!-- Lớp 3: overlay làm dịu -->
  <div class="absolute inset-0 bg-ink-950/50"></div>
</div>
```

**Giải phẫu:** base `#07090e` + **glow đỏ-trái** (222,68,59 @ 8%) + **glow
xanh-phải** (0,107,180 @ 8%) + **bóng đáy** (16,24,39 @ 40%) + overlay `ink-950/50`.

> **Vì sao hiệu quả:** hai glow **lệch màu đối lập** (đỏ ↔ xanh dương) ở hai góc chéo
> tạo chiều sâu mà không cần ảnh. Cường độ chỉ **8%** — đủ thấy, không phá nền.
> Đây là mẹo đáng copy cho mọi dark dashboard.

---

## 4. Bố cục & thành phần

### Sidebar 256px cố định
```html
<aside class="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-ink-900 lg:block">
```
- Rộng **`w-64` = 256px**, `inset-y-0` (kéo dài full chiều cao).
- **Ẩn dưới `lg`** (`hidden ... lg:block`) → mobile dùng cách khác.
- Viền phải `border-line`; nền `ink-900` (sáng hơn nền app 1 bậc).

### Nav item — 2 trạng thái, khác biệt rõ
```html
<!-- ACTIVE -->
<a aria-current="page" class="... rounded-xl px-3 py-2.5 text-sm font-medium
   transition-colors bg-white/8 text-fg">
  <span class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-bright"></span>
  ...
</a>
<!-- IDLE -->
<a class="... rounded-xl px-3 py-2.5 text-sm font-medium
   transition-colors text-fg-muted hover:bg-white/5 hover:text-fg"> ... </a>
```

| Trạng thái | Chỉ báo |
|---|---|
| **Active** | Thanh dọc **3px** bên trái (`bg-brand-bright`, `rounded-r-full`) + nền `bg-white/8` + chữ `text-fg` + icon `text-brand-bright` |
| **Hover** | `bg-white/5` + chữ `text-fg-muted → text-fg` |
| **Idle** | chữ `text-fg-muted`, icon `text-fg-subtle` |

> **Bài học:** phân biệt active/hover bằng **cường độ nền khác nhau** (`white/8` vs
> `white/5`) **+ thanh chỉ báo dọc**. Thanh 3px bo tròn đầu phải là "chữ ký" rất dễ
> nhận và không chiếm chỗ.

### Nhãn nhóm nav
```html
<p class="px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">Menu</p>
```
`11px` · uppercase · `letter-spacing 0.12em` · `text-fg-subtle`.

### Nút Discord CTA (dùng cho đăng nhập)
```html
class="bg-[#5865F2] text-white border border-white/12 hover:bg-[#4752C4]
       shadow-[0_8px_24px_-12px] shadow-[#5865F2] h-8 rounded-lg px-3 text-xs gap-1.5"
```
Màu Discord chính thức `#5865F2` → hover `#4752C4`, kèm **glow cùng màu**
(`shadow-[0_8px_24px_-12px]` với màu brand) — mẹo tạo cảm giác "phát sáng" đúng màu.

### Trạng thái focus (chuẩn chung mọi control)
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
disabled:pointer-events-none disabled:opacity-50
active:scale-[0.98]
```
> `active:scale-[0.98]` — phản hồi nhấn rất nhẹ (2%) đủ tạo cảm giác "nảy" mà
> **không xê dịch layout**.

### Bảng chữ ký của control (copy nguyên)
```
whitespace-nowrap font-semibold
transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]
cursor-pointer select-none
```

---

## 5. Bảng thành phần đặc trưng của kasumu

| Thành phần | Đặc điểm then chốt |
|---|---|
| **Card stat** | Gradient border viền (`border-line`) + `rounded-card` + icon ở góc phải |
| **Hero** | Card bo lớn, tiêu đề `text-xl`, mô tả muted, CTA Discord `#5865F2` |
| **Hàng link** | Badge loại dịch vụ + thanh progress + 2 hàng sub-stat "hôm nay" + mũi tên `→` |
| **Skeleton** | Dùng nhiều (`.skeleton`) cho vùng chờ hydrate |
| **Hộp đăng nhập** | `rounded-2xl` + `border-line` + `bg-ink-950/50` + icon lucide-sparkles `text-brand-bright` |

---

## 6. Animation — bộ keyframes gốc (trích nguyên)

| Keyframe | Nội dung | Dùng cho |
|---|---|---|
| `kasumi-fade` | `0%{opacity:0} → to{opacity:1}` | Xuất hiện mờ dần |
| `kasumi-rise` | `0%{opacity:0; translateY(10px)} → to{opacity:1; none}` | **Nội dung trồi lên** (phổ biến nhất) |
| `kasumi-pop` | `0%{opacity:0; scale(.96)} → to{opacity:1; none}` | Modal / popup / thẻ bật ra |
| `kasumi-float` | `0%,to{translateY(0)} 50%{translateY(-6px)}` | Trang trí trôi nhẹ |
| `kasumi-slide-down` | `0%{opacity:0; translateY(-8px)} → to{opacity:1; none}` | Dropdown / toast |
| `shimmer` | `to{transform:translate(100%)}` | **Skeleton loading** |
| `ping` | `75%,to{opacity:0; scale(2)}` | Chấm thông báo "nhịp" |
| `pulse` | `50%{opacity:.5}` | Nhấp nháy nhẹ |

> **Lưu ý quan trọng:** quãng dịch chuyển rất nhỏ (**6–10px**). Đây là mấu chốt của
> cảm giác "cao cấp": animation **gợi ý** chuyển động, không phô diễn.
> Đi kèm `transition duration-150` cho hầu hết control.

### Nguyên tắc chuyển động
- **Duration:** `150ms` cho màu/nền/viền; `180ms` cho transform.
- **Easing:** kasumu dùng `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint) cho
  animation "bật ra" — nhanh lúc đầu, êm lúc cuối.
- **Scale nhấn:** `0.98` (2%) — không bao giờ nhiều hơn 5%.

---

## 7. Ngữ nghĩa thị giác rút ra (áp vào AUTO-QUEST)

1. **Phân cấp bằng độ sáng cực nhẹ + viền, KHÔNG dùng bóng nặng.** Thang `ink-950 →
   ink-600` chỉ 6 bậc, mỗi bậc chênh rất ít.
2. **Số liệu dùng font mono.** Inter cho giao diện, JetBrains Mono cho con số.
3. **Accent duy nhất là tím** (`#8b5cf6`), chia 3 độ sáng để biểu đạt trạng thái.
4. **Sidebar 256px là chuẩn**; active = nền `white/8` + thanh 3px tím.
5. **Nền 3 lớp với 2 glow lệch màu 8%** — chiều sâu không cần ảnh.
6. **Bo góc:** field `0.75rem`, card `1.125rem` — nhất quán tuyệt đối.
7. **Animation 150ms, dịch chuyển ≤10px, nhấn scale 0.98.**

---

## 8. ⚠️ MẶT TRÁI PHẢI BIẾT: kasumu gốc chỉ có DARK

Bản gốc **không có chế độ Sáng**. Toàn bộ token viền là `#ffffff14` (trắng mờ) —
**vô hình trên nền trắng**. Đây chính là gốc rễ lỗi Wave 28b: khi AUTO-QUEST thêm
light mode, các giá trị `rgba(255,255,255,…)` hardcode không đổi → "chìm màu".

### Luật bắt buộc khi thêm Light mode (bài học Wave 28b)
1. **Không hardcode `rgba(255,255,255,…)`** trong CSS. Thay bằng **token bề mặt**:
   ```css
   :root {
     --tint-04: rgba(255,255,255,0.04);   /* nền nhấn rất nhẹ */
     --tint-06: rgba(255,255,255,0.06);
     --tint-08: rgba(255,255,255,0.08);
     --tint-10: rgba(255,255,255,0.10);
     --tint-14: rgba(255,255,255,0.14);
     --tint-16: rgba(255,255,255,0.16);
     --hairline: rgba(255,255,255,0.12);
     --bg-base:  #07090e;
     --up-row-bg: rgba(5,6,11,0.5);
     --scroll-thumb: rgba(255,255,255,0.14);
     --scroll-thumb-hover: rgba(255,255,255,0.28);
   }
   ```
2. Ở light, **đảo hướng tint sang ĐEN mờ**:
   ```css
   [data-theme="light"] {
     --ink-950: #eef1f7; --ink-900: #ffffff;
     --fg: #131722; --fg-muted: #414b5e; --fg-subtle: #606b7e;
     --line: rgba(15,23,42,0.10); --line-strong: rgba(15,23,42,0.20);
     --tint-04: rgba(15,23,42,0.035); --tint-06: rgba(15,23,42,0.05);
     --tint-08: rgba(15,23,42,0.07);  --tint-10: rgba(15,23,42,0.09);
     --tint-14: rgba(15,23,42,0.13);  --tint-16: rgba(15,23,42,0.16);
     --hairline: rgba(15,23,42,0.14);
     --bg-base: #eaeef6; --up-row-bg: #ffffff;
   }
   ```
3. **Brand phải đậm hơn ở light:** `brand #8b5cf6 → #6d3ff0`,
   `brand-bright #a78bfa → #6a3de8` (vì `#a78bfa` trên trắng chỉ ~2.5:1).
4. **Khối nền tối cứng phải đổi hết** — kể cả **bảng log/console** (phải chuyển
   nền TRẮNG ở light, chữ đậm).
5. **Màu log ngữ nghĩa chuyển sang bản đậm ở light:** ok `#067647` · warn `#a15c07`
   · err `#c11d2b` · orb `#6d3ff0`.

> 💀 **BẪY CSS chết người (Wave 28b):** trong comment CSS **không được viết `*/`**.
> Một comment kiểu `/* dùng --tint-*/--hairline */` sẽ **đóng comment sớm**, khiến
> Chromium **nuốt luôn cả rule bên dưới** mà không báo lỗi. Triệu chứng: khối
> `[data-theme="light"]` biến mất khỏi CSS đã parse. **Luôn kiểm tra** comment cân
> bằng trước khi đổ lỗi cho logic.

---

## 9. Checklist áp kasumu vào dự án mới

- [ ] Copy nguyên thang `--ink-*` (6 bậc) + `fg/fg-muted/fg-subtle` + `line/line-strong`
- [ ] Cài Inter + JetBrains Mono (self-host `woff2` để chạy offline)
- [ ] Nền 3 lớp (base + 2 glow 8% lệch màu + overlay 50%)
- [ ] Sidebar 256px `fixed`, ẩn dưới `lg`
- [ ] Nav active: nền `white/8` + thanh 3px `brand-bright` bo tròn
- [ ] Bo góc: field `0.75rem`, card `1.125rem`
- [ ] Animation: `kasumi-rise`/`kasumi-pop`, dịch ≤ 10px, duration 150–180ms
- [ ] Nhấn: `active:scale-[0.98]`
- [ ] **Nếu thêm light mode → token hoá TOÀN BỘ trước**, không hardcode trắng mờ
- [ ] Có **skeleton** cho vùng chờ hydrate

---

## 10. Bản đồ file nguồn

```
kasumu-ui/
├── index.html          # "Thống Kê Thu Nhập Vượt Link" — màn chính
├── earn.html           # "Vượt Link" — trạng thái yêu cầu đăng nhập
├── withdraw.html       # "Rút Tiền & Đổi Thẻ" — yêu cầu đăng nhập
├── settings.html       # "Cài Đặt" — yêu cầu đăng nhập
├── assets/
│   ├── css/            # 2 file CSS gốc (Tailwind v4 + design token)
│   ├── media/          # 15 file font .woff2 (Inter + JetBrains Mono)
│   └── icons/          # gtraffic.png
└── preview-*.png       # 4 ảnh chụp (viewport 1440px)
```
Chạy: mở trực tiếp `index.html`, hoặc `python -m http.server 8080` để font load chuẩn.
