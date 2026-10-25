# WAVES 47 — KIỂU TÊN HIỂN THỊ (DISCORD DISPLAY NAME STYLES)

Ngày: 2026-10-24
Bro gửi 3 ảnh: F12 của Discord (DOM thật), ô "Kiểu tên hiển thị", và modal
"Thay Đổi Kiểu Tên Hiển Thị".

Yêu cầu:

1. Trích **đúng** `innerContainer…` của F12 — **bất kể user nào**, có Nitro hay đổi màu tên gì cũng phải nhận được.
2. Font **không mặc định** — trích **100% từ server**.
3. Hiệu ứng phải chạy (có Nitro thì càng đẹp).
4. **Check thật kĩ** ở cả chế độ Tối và Sáng — chìm màu là **designer lại ngay**.

---

## 1. Vì sao KHÔNG dùng bảng ánh xạ tự chế

Có vài trang fan làm lại tính năng này, nhưng dữ liệu của họ **sai** so với Discord:
một trang liệt kê "7 font" với tên chung chung (*Serif, Handwritten, Rounded…*) và
"5 hiệu ứng" — trong khi modal của bro có **12 ô font** và **7 ô hiệu ứng**
(Đơn sắc · Chuyển Màu · Neon · Hoạt Hình · Pop · Gummy · Prism).

Dùng bảng đó là **bịa**. Nên hướng làm là: **đọc thẳng từ client Discord đang chạy**.

## 2. Cấu trúc DOM thật (đọc từ ảnh F12 của bro)

```html
<div class="container_df989 dnsFont__89a31 newRocker__89a31
            displayName__Effect_df989 loop_df989 inProfile_df989 shouldWrap_df989"
     style="--custom-display-name-styles-font-opacity: 1;">
  <span class="innerContainer_df989 toon_df989 underlineOnHover_df989"
        data-username-with-effects="Hsin">Hsin</span>
</div>
```

Đọc ra được 3 thứ quan trọng:

| Mảnh | Ý nghĩa |
|---|---|
| `dnsFont__89a31` + `newRocker__89a31` | **FONT** — "New Rocker" (một font blackletter thật) |
| `displayName__Effect_df989` + `loop_df989` | **HIỆU ỨNG** + kiểu chạy (`loop` = lặp) |
| `data-username-with-effects="Hsin"` | Dấu hiệu **hash-agnostic** để tìm phần tử, không phụ thuộc build |

Hậu tố `_df989` / `__89a31` là **hash của bản build** — đổi mỗi lần Discord cập nhật.
Vì vậy selector phải dùng `[data-username-with-effects]` và `[class*="dnsFont_"]`,
**không** hardcode class đầy đủ.

## 3. Cách trích xuất (không đoán gì)

`electron/displayNameStyle.js` chạy JS **ngay trong client Discord** qua lớp CDP sẵn có
(`electron/discordCdp.js`), rồi chép **nguyên giá trị đã tính**:

| Lấy gì | Bằng cách nào |
|---|---|
| Font | `getComputedStyle().fontFamily / fontWeight / letterSpacing` |
| Màu & gradient | `backgroundImage`, `webkitBackgroundClip`, `webkitTextFillColor`, `color` |
| Viền / bóng | `webkitTextStroke`, `textShadow`, `filter` |
| **Animation** | `animationName/Duration/Timing/Iteration` **+ chép nguyên khối `@keyframes`** tra trong `document.styleSheets` |
| **File font** | quét `CSSFontFaceRule` khớp `font-family` → lấy `url(...)` trong `src` |
| Biến riêng | `--custom-display-name-*` đọc từ **style inline** + `computedStyleMap()` |

> **Bẫy đã vấp:** vòng lặp `for (i < computedStyle.length)` **không** liệt kê được biến
> `--*` — Chromium không đưa custom property vào danh sách chỉ số. Phải đọc style inline.

Vì chép nguyên `@keyframes` của Discord nên hiệu ứng chạy **y hệt**, không phải viết lại
theo cảm tính.

## 4. Font: tải từ chính Discord

`ensureFontDataUrl()` tải file `.woff2` từ URL mà `@font-face` của Discord trỏ tới
(`https://discord.com/assets/…`), cache vào `userData/display-name-style/`, rồi trả
**data URL** để renderer nhét vào `@font-face`. Nhờ vậy:

- Lần đầu cần mạng; các lần sau **offline vẫn đúng font**.
- Không phụ thuộc CSP `font-src`.
- Discord đóng vẫn dùng được style đã cache (`dns:read` trả `source: "cache"`).

## 5. Tương phản — phần bro dặn kỹ nhất

### Ngưỡng đúng là 3:1, không phải 4.5:1

`.ph-display` là **1.45rem / font-weight 800** ≈ 23px → theo WCAG AA đây là
**chữ lớn đậm**, ngưỡng là **3:1**. Áp 4.5:1 cho chữ 23px bold là tự làm khó vô ích.

### "Designer lại" = chỉnh ĐỘ SÁNG, giữ nguyên hue

Không đổi sang màu khác (mất chất của user), không bóp mờ. Với **từng điểm dừng màu**
của gradient: nếu chưa đạt thì nâng/hạ **độ sáng HSL** theo từng bước 1% cho tới khi đạt.
Cấu trúc gradient (góc, vị trí điểm dừng, số điểm dừng) **giữ nguyên** — chỉ thay `rgb()`.

```
nền sáng  → hạ sáng dần (tối đi)
nền tối   → nâng sáng dần
```

### Vì sao đích là 3.4 chứ không phải 3.0

Nền cục bộ của nameplate **không phải** `--card` thuần: nó có thêm lớp phủ màu brand 16%.
Đo thật phát hiện đúng ca này:

| | tính với `--card` | **đo bằng pixel thật** |
|---|---|---|
| hiệu ứng tím than trên nền Tối | 3.0:1 (tưởng đạt) | **2.73:1 (chìm)** |

Nên đặt đích **3.4** để kết quả **đo được** vẫn ≥ 3.0.

### Quầng dự phòng

Nếu nâng sáng vẫn không đủ (ca hiếm: màu xám giữa), bật `data-dns-lift="1"` →
`drop-shadow` nhiều lớp, màu quầng theo theme (nền sáng → quầng tối, nền tối → quầng sáng).

## 6. Đo thật — 2 theme × 2 nền banner × 2 kiểu tên

`tools/probe-dns-theme.js` đo **màu đã vẽ thật** (đọc lại inline style) với **nền thật**
(trung vị pixel vùng padding của nameplate trong ảnh chụp):

| Theme | Banner | Hiệu ứng | Tương phản |
|---|---|---|---|
| Tối | sáng | pink→tím | **3.34:1** |
| Tối | sáng | tím than | **3.08:1** |
| Tối | tối | pink→tím | **3.36:1** |
| Tối | tối | tím than | **3.13:1** |
| Sáng | sáng | pink→tím | **3.29:1** |
| Sáng | sáng | tím than | **11.25:1** |
| Sáng | tối | pink→tím | **3.25:1** |
| Sáng | tối | tím than | **11.14:1** |

Tất cả ≥ 3:1. Kèm: font nạp thật (`document.fonts.check` = true), animation chạy
(`loop_df989`), và nhánh **giảm chuyển động** dừng animation nhưng **vẫn giữ gradient**.

## 7. Trích xuất — 17/17

`tools/probe-dns-extract.js` dựng lại **đúng** DOM + CSS trong ảnh F12 của bro
(`newRocker` + gradient + `loop_df989` + `@font-face`) rồi khẳng định bộ trích xuất lấy được:

- đúng tên, đúng class Discord, đúng `data-username-with-effects`
- font `New Rocker`, weight `700`, **URL file font** trong `@font-face`
- `linear-gradient` + `background-clip: text` + chữ trong suốt
- tên animation + thời lượng + **nguyên khối `@keyframes`** (có `background-position`)
- biến `--custom-display-name-styles-font-opacity`
- **không có hiệu ứng → `ok:false`**, tuyệt đối không bịa style

## 8. Kết quả kiểm thử

```
validate-ui             369/369   (+15 marker cho wave 47)
probe-dns-extract       17 pass / 0 fail   PASS ✅
probe-dns-theme         15 pass / 0 fail   PASS ✅  (8 tổ hợp, tất cả ≥ 3:1)
probe-log-color         PASS ✅
probe-contrast-pixels   PASS ✅   158 phần tử · 2 theme
probe-done-46c          14 pass / 0 fail
probe-done-tile         PASS ✅
probe-orb-big           17 pass / 0 fail
probe-all-grids         0 fail
probe-quest-stack       12 pass / 0 fail
theme-audit             0 chìm / 0 chìm
contrast-audit          47 mẫu ≥ 4.5:1
cdp-selftest            13 pass / 0 fail
check-template-literals 38 file sạch
```

## 9. Tệp đã đụng

| Tệp | Việc |
|---|---|
| `electron/displayNameStyle.js` | **Mới** — JS trích xuất trong Discord + tải/cache font |
| `electron/main.js` | IPC `dns:read`, `dns:font` |
| `electron/preload.js` | `dnsRead`, `dnsFont` |
| `electron/renderer/renderer.js` | `applyDisplayNameStyle` · `dnsLiftCss` (nâng sáng giữ hue) · `dnsRegisterFont` · `dnsInjectKeyframes` |
| `electron/renderer/styles.css` | `.ph-display.dns-active` · `[data-dns-lift='1']` · nhánh reduced-motion |
| `tools/probe-dns-extract.js` | **Mới** — 17 khẳng định trích xuất |
| `tools/probe-dns-theme.js` | **Mới** — đo tương phản pixel thật, 8 tổ hợp |
| `tools/shot-wave47.js` | **Mới** — 4 ảnh chứng minh |
| `tools/fixtures/new-rocker.woff2` | Font New Rocker thật (OFL) — **chỉ dùng cho ảnh**, lúc chạy app tải từ Discord |
| `tools/validate-ui.js` | +15 marker wave 47 |

## 10. Điều kiện để chạy thật

1. Mở Discord kèm cổng debug (app đã có nút: Cài đặt → CDP → "Mở lại Discord kèm debug").
2. Đăng nhập token trong app.
3. App chạy JS trong Discord, đọc style, tải font, áp lên tên hiển thị.

Discord đóng → dùng style đã cache. Không đọc được gì → hiện tên thường (không chặn đăng nhập).
