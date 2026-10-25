# 01 — UI/UX PRO MAX: Cốt lõi Design Intelligence

> **Nguồn:** `ui-ux-pro-max-skill-main/` (NextLevelBuilder, MIT, v2.15.0)
> **Vai trò:** Bộ não thiết kế — tra cứu style/màu/font/UX guideline có bằng chứng, thay vì đoán.
> **Đúc kết bởi:** AUTO-QUEST (Waves 28b) sau khi dùng để thiết kế lại chế độ Sáng/Tối.

---

## 1. Bản chất: nó KHÔNG phải design system — nó là cỗ máy TRA CỨU

Đây là điểm hiểu sai phổ biến. Skill này **không vẽ UI cho bạn**. Nó là một
**database tra cứu được (searchable)** gồm 79 UI style, 192 color palette, 74 cặp
font, 119 UX guideline, 25 loại chart, trải trên 22 tech stack — và một engine
tìm kiếm **BM25 + regex hybrid** để lôi đúng tri thức ra.

**Hệ quả thực hành:** muốn dùng đúng, phải biết **hỏi đúng domain**, chứ đừng hỏi
một câu chung chung rồi nhận kết quả chung chung.

```bash
python src/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> [-n <max>]
```

### Chọn chế độ tìm kiếm — nguyên tắc "nhỏ nhất đủ dùng"

| Tình huống | Dùng gì | Ví dụ |
|---|---|---|
| Dự án/trang mới, định hướng thị giác toàn cục | `--design-system` | `"gaming quest tool dark"` |
| Một mối quan tâm cụ thể / bug component | MỘT `--domain` | `--domain ux "color contrast"` |
| Đã biết tech stack | `--stack` (+ domain riêng nếu cần) | `--stack html-tailwind` |

> **Luật vàng:** mỗi query chỉ **MỘT ý định chủ đạo**, **2–5 từ có nghĩa**, cộng
> một ràng buộc hữu ích (product/platform/interaction). **Không** nhồi cả checklist
> vào một query — đó là cách chắc chắn nhất để nhận rác.

---

## 2. 11 domain tra cứu (bảng tra nhanh)

| Domain | Dùng để lấy | Từ khoá mẫu |
|---|---|---|
| `product` | Mẫu thiết kế theo loại sản phẩm | SaaS, e-commerce, gaming, healthcare |
| `style` | UI style + prompt AI + CSS keywords | glassmorphism, minimalism, dark mode, brutalism |
| `typography` | Cặp font + import Google Fonts | elegant, playful, professional |
| `color` | Palette theo loại sản phẩm | saas, fintech, gaming, service |
| `landing` | Cấu trúc trang + chiến lược CTA | hero, pricing, social-proof |
| `chart` | Loại chart + thư viện gợi ý | trend, comparison, funnel, real-time |
| `ux` | Best practice + anti-pattern | contrast, animation, z-index, loading |
| `icons` | Icon + code import (Phosphor/Heroicons/Lucide) | arrow, navigation, decorative |
| `react` | Performance React/Next.js | waterfall, memo, rerender, suspense |
| `web` | Guideline app interface (iOS/Android/RN) | touch targets, safe areas, Dynamic Type |
| `gsap` | Khung animation theo mức intensity | scroll reveal, stagger, page transition |

### Stack hỗ trợ (subset hay dùng)
`html-tailwind` (mặc định), `react`, `nextjs`, `vue`, `svelte`, `astro`, `swiftui`,
`react-native`, `flutter`, `shadcn`, `threejs`, `angular`, `laravel`, `javafx`, `wpf`.

### Design Dials (chỉ dùng kèm `--design-system`)
Ba con trượt 1–10 tinh chỉnh đầu ra **mà không đổi query**:

| Dial | Thấp (1–3) | Trung (4–7) | Cao (8–10) |
|---|---|---|---|
| `--variance` | Căn giữa / tối giản | Cân bằng, hiện đại | Táo bạo, bất đối xứng (Brutalism, Bento) |
| `--motion` | Micro-interaction nhẹ | Scroll/stagger chuẩn | Choreography phức tạp (pin, Flip, SplitText) |
| `--density` | Thoáng (24–96px) | Chuẩn (16–64px) | Dày/dashboard (8–32px) |

---

## 3. Quy trình 4 bước (workflow chuẩn)

### Bước 1 — Phân tích yêu cầu
Trích ra: **loại sản phẩm** · **đối tượng** · **từ khoá style** · **stack** ·
**platform** (web vs native — đừng nhầm, nhiều mục chỉ áp dụng cho mobile).

### Bước 2 — Sinh design system (chỉ dự án/trang mới)
```bash
python3 search.py "<product_type> <industry> <keywords>" --design-system [-p "Tên"]
```
Lệnh này **gộp** product + style + color + landing + typography, rồi áp **luật suy
luận** từ `ui-reasoning.csv` để chọn match tốt nhất. Trả về: pattern, style, màu,
typography, hiệu ứng — **kèm cả anti-pattern cần tránh**.

**Lưu design system để tái dùng qua nhiều phiên (Master + Overrides):**
```bash
python3 search.py "<query>" --design-system --persist -p "Tên" --output-dir "<root>"
```
Sinh ra:
- `design-system/<slug>/MASTER.md` — nguồn sự thật toàn cục
- `design-system/<slug>/pages/` — override riêng từng trang

**Cách truy hồi phân cấp:** đọc `MASTER.md` trước; khi dựng trang cụ thể (vd
"Checkout") thì kiểm `pages/checkout.md` — **nếu có thì nó ĐÈ Master**, không thì
dùng Master.

### Bước 3 — Tra chi tiết bổ sung
Dùng `--domain` cho từng mối quan tâm cụ thể (bảng ở §2).

### Bước 4 — Guideline theo stack
```bash
python3 search.py "<keyword>" --stack <stack>
```

---

## 4. ⭐ BÀI HỌC LỚN NHẤT: tương phản màu & light/dark mode

Đây chính là tri thức đã cứu Wave 28b. Ghi nhớ như luật cứng:

### Luật tương phản (WCAG)
| Loại | Ngưỡng | Ghi chú |
|---|---|---|
| Chữ thường vs nền | **≥ 4.5:1** | Bắt buộc. Đây là ngưỡng bị vi phạm nhiều nhất |
| Chữ lớn / UI non-text / icon mang nghĩa | **≥ 3:1** | Không được dùng 3:1 cho chữ thường |
| Viền/đường phân cách | **≥ 3:1** so với nền kề | Phải thấy được ở CẢ hai theme |

Ví dụ đối chiếu chuẩn (từ chính skill):
- `#333` trên trắng ≈ **7:1** → tốt
- `#999` trên trắng ≈ **2.8:1** → **tệ, không dùng**

### Bảng luật Light/Dark mode — Do / Don't

| Luật | **NÊN** | **KHÔNG** |
|---|---|---|
| Đọc được bề mặt (sáng) | Card tách khỏi nền rõ bằng opacity/elevation đủ | Bề mặt quá trong suốt làm mờ phân cấp |
| Tương phản chữ (sáng) | Chữ body ≥ 4.5:1 trên nền sáng | Chữ xám nhạt trên nền sáng |
| Tương phản chữ (tối) | Chữ thường ≥ 4.5:1 trên nền tối | Chữ mờ rơi dưới ngưỡng |
| Viền/đường phân cách | Hiện rõ ở **cả hai** theme | Viền biến mất ở một mode |
| Trạng thái tương tác | pressed/focus/disabled phân biệt được ở cả hai theme | Chỉ định nghĩa state cho một theme |
| **Theming bằng token** | Token màu ngữ nghĩa map theo theme | **Hardcode hex từng màn** ← thủ phạm số 1 |
| Scrim / modal | Đo kết quả pha trộn thật, chọn scrim đủ mạnh | Dùng một opacity cho mọi nền |

> **CẢNH BÁO THỰC CHIẾN (từ Wave 28b):** hardcode `rgba(255,255,255,…)` hay
> `#07090e` rải rác khắp CSS chính là gốc rễ khiến chế độ Sáng "chìm màu". Khi đổi
> theme, các giá trị trắng-mờ trở nên **vô hình trên nền trắng**, còn nền tối cứng
> thì **không đổi**. Giải pháp duy nhất: đưa TẤT CẢ về **token bề mặt** (`--tint-*`,
> `--hairline`, `--bg-base`, `--well`…) và override một chỗ.

### Checklist Light/Dark trước khi giao
- [ ] Chữ chính ≥ 4.5:1 ở **cả** light và dark
- [ ] Chữ phụ (secondary) cũng ≥ 4.5:1 ở cả hai mode
- [ ] Divider/viền và state tương tác phân biệt được ở cả hai mode
- [ ] Scrim modal/drawer đo trên nền thật, giữ được độ đọc của foreground
- [ ] **Đã test CẢ HAI theme** — không suy diễn từ một theme

---

## 5. Luật nghề nghiệp hay bị bỏ sót (Common Rules)

### Icons & yếu tố thị giác
| Luật | Chuẩn | Tránh | Vì sao |
|---|---|---|---|
| **Không emoji làm icon cấu trúc** | Icon vector (Phosphor / Heroicons / @expo/vector-icons) | Emoji cho nav/settings/control | Emoji phụ thuộc font, không nhất quán, không điều khiển được bằng token |
| Chỉ asset vector | SVG scale sạch, hỗ trợ theming | PNG bị mờ/vỡ hạt | Scale + dark/light |
| Ngữ nghĩa theo ngữ cảnh | Icon trang trí cạnh chữ → `aria-hidden`; icon đứng riêng có nghĩa → text alternative; icon control → accessible name + trạng thái | Coi một tên icon là cố định trang trí/nghĩa/tương tác | Cùng glyph, ngữ cảnh khác nhau |
| Trạng thái tương tác ổn định | Đổi màu/opacity/elevation khi press, **không đổi layout bounds** | Transform làm xê dịch nội dung → jitter | Giữ chất lượng chuyển động |
| Cỡ icon nhất quán | Token (icon-sm, icon-md = 24pt, icon-lg) | Trộn 20/24/28pt ngẫu nhiên | Nhịp điệu & phân cấp |
| Độ dày nét | Nhất quán trong cùng lớp (1.5px hoặc 2px) | Trộn dày/mỏng tùy tiện | Độ "bóng" nhận thức |
| Filled vs Outline | Một kiểu cho mỗi cấp phân cấp | Trộn filled/outline cùng cấp | Rõ nghĩa, mạch lạc |
| Contrast icon | Icon mang nghĩa & viền control ≥ 3:1 | Icon tương phản thấp mà mang thông tin | Vai trò non-text contrast |

### Tương tác
| Luật | **Nên** | **Không** |
|---|---|---|
| Phản hồi chạm | Ripple/opacity/elevation trong **80–150ms** | Không phản hồi khi chạm |
| Thời lượng animation | Token dùng chung, chọn theo quãng đường/độ phức tạp/ngữ cảnh | Một duration copy cho mọi transition |
| Focus trợ năng | Thứ tự focus khớp thứ tự thị giác, label mô tả rõ | Control không label / focus lộn xộn |
| Trạng thái disabled | Dùng semantics `disabled`, giảm nhấn mạnh, không phản hồi | Trông bấm được mà không làm gì |
| Touch target | **≥ 44pt (iOS) / ≥ 48dp (Android)**, mở rộng vùng chạm khi icon nhỏ | Target tí hon không padding |
| Chống xung đột gesture | Một gesture chính mỗi vùng | Gesture lồng nhau gây hành động nhầm |
| Control native ngữ nghĩa | Dùng primitive native (`Button`, `Pressable`) đúng vai trò | Container chung làm control chính |

### Layout & Spacing
| Luật | **Nên** | **Không** |
|---|---|---|
| Safe-area | Tôn trọng top/bottom cho header/tab bar/CTA cố định | UI cố định nằm dưới notch/gesture |
| Nhịp 4/8dp | Hệ spacing 4/8dp nhất quán cho padding/gap/section | Tăng giảm ngẫu nhiên |
| Bề rộng nội dung | Nhất quán theo device class | Trộn bề rộng tùy tiện |
| Độ dài dòng đọc | Giữ mức đọc được trên màn lớn | Đoạn chữ tràn viền trên tablet |
| Phân cấp khoảng section | Tầng nhịp dọc rõ (16/24/32/48) | Cùng cấp mà spacing khác nhau |
| Gutter theo breakpoint | Tăng inset ngang ở màn lớn/landscape | Một gutter hẹp cho mọi kích thước |
| Scroll vs phần tử cố định | Thêm inset trên/dưới để list không bị che | Nội dung bị che bởi header/footer sticky |

---

## 6. UX Guidelines cấp Critical & High (119 mục, trích bộ quan trọng)

Phân bố thực tế trong `ux-guidelines.csv`: **Critical 4 · High 44 · Medium 62 · Low 9**.
Theo chuyên mục: Accessibility 20 · Forms 11 · Animation 10 · Layout 9 · Interaction 8 ·
Performance 8 · Responsive 8 · Typography 7 · Content 7 · Navigation 6 · Touch 6 · Feedback 6…

### 🔴 CRITICAL — vi phạm là hỏng sản phẩm
- **Accessible Authentication (Minimum)** — cho phép password manager & dán, có
  phương án không dùng trí nhớ (không bắt giải đố nhận thức).
- **Text Reflow and Spacing** — nội dung phải reflow được ở 320px CSS, không mất chữ.
- **Essential Text Truncation** — **không** cắt cụt văn bản thiết yếu.
- **Compact Control Semantics** — control nhỏ vẫn phải có semantics đúng.

### 🟠 HIGH — nhóm hay bị bỏ qua nhất
| Nhóm | Mục |
|---|---|
| **Accessibility** | Color Contrast · Color Only (màu là chỉ báo DUY NHẤT → cấm) · Alt Text · ARIA Labels · Keyboard Navigation · Form Labels · Error Messages · Motion Sensitivity · Focus Not Obscured · Dragging Movements · Target Size (Minimum) · Contextual Live Badge Updates |
| **Animation** | Reduced Motion (`prefers-reduced-motion`) · Excessive Motion · Loading States · Hover vs Tap · Auto-Rotating Content Controls · Cancellable State Transitions |
| **Forms** | Input Labels · Error Placement · Submit Feedback · Focusable Error Summary |
| **Interaction** | Focus States · Loading Buttons · Error Feedback · Confirmation Dialogs |
| **Layout** | Z-Index Management · Content Jumping (CLS) · Long Token Wrapping · Chip Collection Reflow |
| **Navigation** | Smooth Scroll · Back Button |
| **Performance** | Image Optimization |
| **Responsive** | Touch Friendly · Readable Font Size · Viewport Meta · Horizontal Scroll |
| **Typography** | Contrast Readability |
| **Feedback** | Loading Indicators |
| **Content** | Compact Label Semantics · Compact Label Overflow |
| **Security/A11y** | Accessible Authentication (Minimum) |

> ⚠️ **Cancellable State Transitions** đúng là lỗi Wave 28b đã gặp: viền chip
> `opacity` transition 0.35s khiến khung đứng hình 2.6s. **Chuyển trạng thái phải
> hủy/hoàn tất được, không được treo.** Cách xử lý: gắn class TRƯỚC khi chèn media,
> ép hiện tức thì (`transition:none` + giá trị đích), rồi khôi phục transition qua
> double-`requestAnimationFrame`.

---

## 7. Quick Reference — tra nhanh khi gặp vấn đề

| Vấn đề | Tra gì |
|---|---|
| Không chọn được style/màu | Xác minh category, thử lại 1 lần với 1 product + 1 tone |
| Chế độ tối tương phản kém | `--domain ux "color-dark-mode color-accessible-pairs"` |
| Animation gượng | `--domain ux "spring-physics easing"` |
| Form UX kém | `--domain ux "inline-validation error-clarity"` |
| Nav rối | `--domain ux "nav-hierarchy back-behavior"` |
| Layout vỡ màn nhỏ | `--domain ux "mobile-first breakpoint-consistency"` |
| Kém mượt / jank | `--domain ux "virtualize-lists debounce-throttle"` |
| Chữ/nhãn bị wrap xấu | `--domain ux "orphan heading line balance"` |

---

## 8. Checklist trước khi giao UI (Pre-Delivery)

### Chất lượng thị giác
- [ ] Không emoji làm icon (dùng SVG)
- [ ] Mọi icon cùng một họ & style
- [ ] Asset brand chính thức, đúng tỉ lệ & clear space
- [ ] Pressed-state không xê dịch layout
- [ ] Token theme ngữ nghĩa dùng nhất quán (**không hardcode hex từng màn**)

### Tương tác
- [ ] Mọi phần tử chạm được có phản hồi pressed rõ
- [ ] Touch target ≥ 44×44pt (iOS) / ≥ 48×48dp (Android)
- [ ] Micro-interaction dùng token chung, vẫn nhạy trong ngữ cảnh
- [ ] Disabled rõ ràng và không tương tác
- [ ] Thứ tự focus screen-reader khớp thị giác, label mô tả rõ
- [ ] Vùng gesture không lồng/xung đột

### Light/Dark
- [ ] Chữ chính & phụ ≥ 4.5:1 ở **cả hai** mode
- [ ] Divider/viền và state phân biệt được ở cả hai mode
- [ ] Scrim modal đo trên nền thật, giữ độ đọc foreground
- [ ] **Test cả hai theme trước khi giao**

### Layout
- [ ] Safe-area cho header/tab bar/CTA bar
- [ ] Nội dung scroll không bị che bởi sticky bar
- [ ] Kiểm trên phone nhỏ / phone lớn / tablet (portrait + landscape)
- [ ] Inset/gutter ngang thích ứng theo kích thước & hướng
- [ ] Nhịp spacing 4/8dp nhất quán
- [ ] Độ dài dòng chữ đọc được trên màn lớn

### Trợ năng
- [ ] Icon trang trí cạnh chữ bị ẩn khỏi a11y tree (`aria-hidden="true"`)
- [ ] Ảnh/icon mang nghĩa không có chữ kèm → có text alternative
- [ ] Icon control có accessible name + announce selected/pressed/expanded
- [ ] Form field có label, hint, thông báo lỗi rõ
- [ ] **Màu không phải chỉ báo duy nhất**
- [ ] Hỗ trợ reduced-motion & dynamic text size không vỡ layout
- [ ] Sticky UI/overlay không che keyboard focus
- [ ] Kéo/swipe có phương án nút/bàn phím
- [ ] Xác thực cho phép password manager & dán, có phương án không nhận thức
- [ ] Nội dung tự xoay có nút pause/stop, dừng khi focus hoặc reduced-motion
- [ ] Form lỗi giữ inline error; nhiều lỗi thì focus error summary đã liên kết
- [ ] Trait/role/state (selected/disabled/expanded) được announce đúng

---

## 9. Kiến trúc skill (để hiểu, không cần copy)

```
src/ui-ux-pro-max/               # SOURCE OF TRUTH
├── data/                        # CSV chuẩn
│   ├── products.csv styles.csv colors.csv typography.csv
│   ├── ux-guidelines.csv ui-reasoning.csv charts.csv
│   ├── landing.csv icons.csv motion.csv app-interface.csv
│   ├── react-performance.csv google-fonts.csv
│   └── stacks/                  # guideline theo stack
├── scripts/
│   ├── search.py                # CLI entry
│   ├── core.py                  # engine BM25 + regex
│   ├── design_system.py         # sinh design system
│   ├── reasoning_contract.py    # luật suy luận
│   └── validate_data.py         # kiểm dữ liệu
└── templates/
    ├── base/                    # skill-content.md, quick-reference.md
    └── platforms/               # claude.json, cursor.json, ...
```

- **Không có symlink** (trên Windows git checkout thành text file → phá skill).
  Mọi bản mirror là file thật, đồng bộ bằng `cli/scripts/sync-assets.mjs`, CI
  "Check asset sync" ép đúng.
  ```bash
  cd cli && npm run sync:assets && npm run check:assets
  ```
- Chỉ cần **Python 3 standard library** — không cài package, không truy cập mạng.
- Trên Windows dùng `python`, không phải `python3`.

---

## 10. Nguyên tắc vàng rút ra (áp dụng cho AUTO-QUEST)

1. **Tra cứu thay vì đoán.** Có bằng chứng trong CSV thì trích, không tự bịa.
2. **Một query = một ý định.** Nhồi nhét → kết quả rác.
3. **Tương phản 4.5:1 là luật cứng**, không phải gợi ý. Đo bằng số thật.
4. **Token bề mặt là bắt buộc** nếu muốn light/dark không "chìm màu".
5. **Reduced-motion phải tôn trọng** nhưng **đừng tắt tín hiệu tiến trình**
   (bài học Wave 25: `*{animation-duration:.01ms}` giết cả thanh nạp).
6. **Chuyển trạng thái phải hủy/hoàn tất được** — không treo UI (Wave 28b chip frame).
7. **Kiểm tra kết quả trả về** trước khi dùng: domain/category đúng chưa, có khớp
   product & platform không. Kém thì **retry 1 lần**; vẫn kém thì nói rõ "không có
   match" và dùng hướng dẫn chung có dán nhãn. **Không lưu kết quả chưa xác minh.**
8. **Màu không được là chỉ báo duy nhất** — thêm icon/chữ/nhãn.
