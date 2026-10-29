# WAVES 46e — NHẬT KÝ CÓ HỒN, VÀ DỌN SẠCH "CHÌM MÀU"

Ngày: 2026-10-24
Sau khi bro xác nhận 46c *"dc rồi bro sau khi xem tôi đã thấy rất ổn rồi"*, bro đưa tiếp 6 việc.

---

## 0. Yêu cầu gốc (nguyên văn, tách ý)

| # | Nguyên văn | Việc phải làm |
|---|---|---|
| 1 | *"cấm đổi màu khung chỉ đổi màu dòng text thôi kiểu cái chữ chính bros đổi màu đỏ chẳng hạn còn text thường bro để xanh hay gì tuỳ"* | Chỉ đổi màu CHỮ, không đổi khung. Chữ chính → đỏ, chữ thường → màu dịu. |
| 2 | *"mỗi phần [] này bắt buộc phải có phác hoạ ra một cái logo gì đó thông minh chạy LUÔN SAU TEXT cấm dc tràm lboir viện hoặc loạn trong khi text"* | Mỗi nhãn `[ … ]` phải có huy hiệu, nằm **ngay sau** chữ nhãn, không chen vào câu. |
| 3 | *"1 dòng text nếu quá dài thì chỉ nên gói gọn lại trong 2 dòng hoặc giản lược nó lại hoặc …"* | Kẹp tối đa 2 dòng, có dấu `…`. |
| 4 | *"lúc mà nhận thành công ORBS text log phải đổi màu theo kiểu rainbown ko phải 7 mầu cầu vồng ngẫu nhiên chayh quanh text"* | Quang phổ **liên tục**, không phải 7 màu rời. |
| 5 | *"khi tôi chuyển qua chế độ sáng tô ithaays phần chữ này trên proflies bị chìm fix ngay"* | Hồ sơ: chữ trên banner sáng không được chìm. |
| 6 | *"rà soát lại toàn bộ từng ngóc ngách cấm cái nào chìm màu"* | Quét toàn bộ, cả 2 theme. |

---

## 1. Hai vai trò màu chữ (yêu cầu 1)

Trước đây **cả dòng** bị tô kín theo trạng thái (`t-ok` xanh, `t-warn` vàng, `t-err` hồng…),
nên một câu văn dài đọc rất mỏi và "sặc sỡ". Nay chỉ còn **hai** vai trò:

```css
.u229 { --ux-text: #b9c7dd;  /* chữ THƯỜNG — trung tính, hơi ngả xanh */ }
.u229 { --ux-key:  #ff9d9d;  /* CHỮ CHÍNH  — đỏ san hô */ }
/* Nền Sáng */
:root[data-theme="light"] .u229 { --ux-text: #333d4f; --ux-key: #b3141f; }
```

* **Chữ thường** của mọi nhóm (`ok/warn/err/orb/sys`) dùng chung `--ux-text`.
* **Chữ chính** — số, `"tên nhiệm vụ"`, `@tài khoản`, `7.3s`, `429` — bọc trong
  `<span class="u229-key">` và tô `--ux-key`.
* Màu ngữ nghĩa **chỉ còn ở nhãn và huy hiệu**, không lan sang câu.

`logBodyHtml()` tách **chuỗi gốc** rồi mới escape từng mảnh, nên không thể sinh HTML hỏng:

```js
const LOG_KEY_RE = /("[^"]{1,80}"|@[A-Za-z0-9._]{2,32}|\d+(?:[.,]\d+)?\s?(?:Orbs?|giây|ms|s\b|%|phút|nhiệm vụ)?)/g;
```

## 2. Huy hiệu ngay sau nhãn (yêu cầu 2)

Bỏ "nét đơn" thời Waves 45, thay bằng **họ huy hiệu lục giác**: một khung chung + dấu riêng
→ 5 hình khác nhau mà vẫn cùng một ngôn ngữ thị giác.

```js
const U229_HEX = 'M12 3.2 19.6 7.6v8.8L12 20.8 4.4 16.4V7.6z';
const U229_MARK = {
  ok:   `<path d="${U229_HEX}"/><path d="m9.1 12.1 2.1 2.1 3.9-4.3"/>`,   // dấu tích
  err:  `<path d="${U229_HEX}"/><path d="m9.6 9.6 4.8 4.8m0-4.8-4.8 4.8"/>`, // dấu X
  warn: `<path d="${U229_HEX}"/><path d="M12 8.9v3.4"/><path d="M12 15.1h.01"/>`,
  sys:  `<path d="${U229_HEX}"/><path d="M10.3 10.3h3.4v3.4h-3.4z"/>`,
  orb:  '<path d="M12 2.8 16 8l5.2 4-5.2 4-4 5.2-4-5.2L2.8 12 8 8z"/>…',
};
```

Thứ tự dựng **bắt buộc** là `tag → ico → body`:

```js
div.append(tag, ico, body);   // ✅ huy hiệu NẰM SAU chữ nhãn, TRƯỚC câu
```

Probe kiểm cả 3 điều: mọi dòng đều có huy hiệu · thứ tự DOM đúng `tag>ico>body` ·
≥ 5 hình khác nhau (không phải một hình lặp lại) · và **không** có `[nhãn]` nào bị lặp
lại bên trong câu.

## 3. Kẹp 2 dòng — và cái bẫy `scrollHeight` (yêu cầu 3)

CSS kẹp bằng `-webkit-line-clamp: 2`. Nhưng **chỉ CSS thì không bao giờ có dấu `…`**
vì `-webkit-line-clamp` kẹp **luôn cả `scrollHeight`**:

```js
// ❌ đọc scrollHeight khi clamp đang bật → luôn "không tràn"
if (body.scrollHeight <= maxH) return;
```

Nên `fitLogBody()` phải **tắt clamp để đo**, rồi bật lại trong cùng một frame:

```js
body.style.webkitLineClamp = 'unset';        // mở khoá để đo được
body.innerHTML = logBodyHtml(text);
if (body.scrollHeight <= maxH) { body.style.webkitLineClamp = ''; return; }
// nhị phân tìm độ dài ngắn nhất mà vẫn vừa 2 dòng, rồi gắn "…"
body.innerHTML = logBodyHtml(`${text.slice(0, lo).trimEnd()}…`);
body.style.webkitLineClamp = '';
```

## 4. Cầu vồng khi nhận Orb thành công (yêu cầu 4)

**13 điểm dừng**, bước màu 30°, nhân đôi để vòng lặp liền mạch — quang phổ liên tục,
không phải 7 màu rời:

```css
.u229-line.is-orbwin .u229-body {
  background-image: linear-gradient(90deg, var(--rb), var(--rb));
  background-size: 200% 100%;
  -webkit-background-clip: text; background-clip: text;
  color: transparent; -webkit-text-fill-color: transparent;
  animation: u229Rainbow 5s linear infinite;
}
```

Bản Sáng **buộc phải tối hơn** (nếu để sắc bright thì trên nền trắng chỉ còn ~1.5:1):

| Theme | Số điểm dừng | Tương phản thấp nhất |
|---|---|---|
| Tối | 13 | **6.48:1** (điểm #8) |
| Sáng | 13 | **5.04:1** (điểm #3) |

Vẫn giữ gradient khi `prefers-reduced-motion: reduce` — chỉ dừng animation.

Nhận diện theo **nội dung**, không theo tham số `stream` (vì `streamOf()` xếp mọi dòng
có chữ "Orb" vào nhóm `orb` trước):

```js
function isOrbWinLine(line) {
  if (!/\borbs?\b/i.test(s)) return false;
  if (/lỗi|thất bại|cảnh báo|giới hạn|hết hạn|bỏ qua|không nhận/i.test(s)) return false;
  return /(đã nhận|nhận được|thành công|\+\s*\d)/i.test(s);
}
```

## 5. Hồ sơ chìm trên banner sáng (yêu cầu 5)

**Nguyên nhân thật** không phải thiếu màu chữ, mà là một luật `:has` ép chữ **TRẮNG**
lên **mọi** banner ảnh — banner sáng thì trắng trên trắng:

```css
/* ❌ ĐÃ XOÁ */
[data-theme="light"] .hero-card:has(.ph-banner:not(.default)) .ph-display { color: #fff; }
```

Nay mỗi dòng chữ có **bề mặt riêng** lấy từ token `--card`, nên chữ luôn nằm trên nền đã biết:

```css
.ph-username {
  width: fit-content; padding: 2px 9px; border-radius: 999px;
  background: color-mix(in oklab, var(--card) 88%, transparent);
  border: 1px solid var(--line); backdrop-filter: blur(8px);
}
```

Áp dụng cho cả `.ph-username`, `.ph-userid`, `.ph-nameplate`.
Ảnh chứng minh: `build-release/wave46e/5-hero-light-on-light-banner.png` (Sáng) và
`6-hero-dark-on-light-banner.png` (Tối, banner sáng — ca khó nhất).

## 6. Lỗi NẶNG nhất tìm được: khối token Sáng khớp luôn vào nút chọn theme

Đây là lỗi mà audit cũ **không thể** thấy, và cũng là lỗi đẹp nhất của wave này.

```css
/* ❌ TRƯỚC */
[data-theme="light"] { --fg-muted: #414b5e; /* … */ }
```

`[data-theme="light"]` là selector **thuộc tính trần** → khớp với **BẤT KỲ** phần tử nào
mang thuộc tính đó. Mà trong `index.html`:

```html
<button class="theme-opt" id="themeLight" data-theme="light" role="radio" aria-checked="false">
```

⇒ Chính nút "Sáng" tự ghi đè `--fg-muted` **lên bản thân nó**. Ở chế độ **Tối**, nhãn
"Sáng" lấy màu xám đậm của chế độ Sáng và nằm trên nền đen:

```
✘ 2.17:1 (cần 4.5)  Settings button#themeLight>span "Sáng"
   fg=rgb(65,75,94)  bg=rgb(20,15,13)
```

Sửa bằng cách scope vào gốc:

```css
:root[data-theme="light"] { /* … token … */ }   /* ✅ chỉ <html> mới khớp */
```

Marker `w46e: light token block scoped to root` ghim lại để không tái phát.

## 7. Panel "Đang tải trình xác minh" hardcode màu

```css
/* ❌ TRƯỚC — nền TRẮNG + chữ xám, không có bản cho chế độ Tối */
.captcha-loading { color: #5b6272; background: rgba(255,255,255,0.97); }
/* ✅ SAU — token, đúng cả 2 theme */
.captcha-loading { color: var(--fg-muted); background: var(--ink-850); }
```

Kèm `.captcha-spinner` đổi viền từ `rgba(0,0,0,.18)` (gần như vô hình trên nền tối)
sang `var(--line-strong)`.

## 8. `--fg-subtle` bản Sáng nâng nhẹ

`#606b7e` chỉ đạt **4.23:1** trên bề mặt modal → đổi `#5a6478` = **4.67:1**, vẫn nhạt hơn
`--fg-muted` (#414b5e) nên giữ nguyên thứ bậc thị giác.

---

## 9. Đo đạc: quét "chìm màu" bằng PIXEL THẬT

Audit cũ đi ngược cây DOM để *đoán* nền → sai hoàn toàn khi sau chữ là **ảnh banner**.
`tools/probe-contrast-pixels.js` (mới) đo đúng thứ đã vẽ:

1. chụp ảnh toàn trang · 2. cắt đúng rect của phần tử · 3. nền = **TRUNG VỊ** pixel
(chữ chỉ chiếm thiểu số nên trung vị = nền, kể cả nền ảnh/gradient) · 4. so với màu chữ thật.

**Phủ 6 màn × 2 theme = 158 phần tử chữ:**

```
Quest=53 · Settings=21 · About=17 · Done=53 · ModalLogout=6 · ModalCaptcha=8
DARK  thấp nhất 4.71:1 → 0 lỗi
LIGHT thấp nhất 4.79:1 → 0 lỗi
```

### Ba cái bẫy phải vá trong chính probe

| Bẫy | Triệu chứng | Cách vá |
|---|---|---|
| Chụp 1 ảnh rồi đo nhiều trang | **15 lỗi GIẢ** ở Settings/About | Chụp lại ảnh **mỗi** lần chuyển trang |
| Đo chữ **phía sau** lớp phủ modal | **46 lỗi GIẢ** | Chỉ đo phần tử `closest('#…Modal .modal-card')` |
| Animation mở modal không chạy trong cửa sổ ẨN | `veil.opacity = "0"` → ảnh modal mờ, thấy cả trang xuyên qua | Tiêm CSS `animation:none` **chỉ trong 2 modal** |

> Bẫy thứ ba đã suýt bị chẩn đoán thành "lỗi z-index". `document.elementFromPoint()`
> tại tiêu đề trả về **chính tiêu đề** → chứng minh **không** có lỗi xếp lớp; nguyên nhân
> thật chỉ là `opacity: 0` do animation đứng hình.

---

## 10. Kết quả kiểm thử

```
validate-ui                 354/354   (14 marker cũ viết lại theo thiết kế mới + 14 marker mới)
probe-log-color             PASS ✅   (13 điểm dừng/theme, cắt nền theo chữ, tôn trọng reduced-motion)
probe-contrast-pixels       PASS ✅   158 phần tử · 2 theme · 0 lỗi
probe-done-46c              14 pass / 0 fail
probe-done-tile             PASS ✅
probe-orb-big               17 pass / 0 fail
probe-all-grids             0 fail
probe-quest-stack           12 pass / 0 fail
theme-audit                 0 chìm / 0 chìm   (51 mục × 2 theme)
contrast-audit              47 mẫu ≥ 4.5:1
check-template-literals     35 file sạch
```

## 11. Tệp đã đụng

| Tệp | Việc |
|---|---|
| `electron/renderer/renderer.js` | Họ huy hiệu lục giác · `logBodyHtml` · `fitLogBody` · `isOrbWinLine` · `stripLogPrefix` · thứ tự `tag→ico→body` · class `is-orbwin` |
| `electron/renderer/styles.css` | `--ux-text`/`--ux-key` · huy hiệu · kẹp 2 dòng · cầu vồng 13 điểm (2 theme) · chip hồ sơ · nút disabled · **`:root[data-theme="light"]`** · `--fg-subtle` · token `.captcha-loading` |
| `tools/probe-log-color.js` | Viết lại cho wave này |
| `tools/probe-contrast-pixels.js` | **Mới** — quét pixel thật, 6 màn, scope modal, tắt animation |
| `tools/shot-wave46e.js` | **Mới** — 8 ảnh chứng minh |
| `tools/validate-ui.js` | 14 marker cũ viết lại + 14 marker mới cho 46e |

## 12. Chạy lại

```bash
node tools/check-template-literals.js                       # LUÔN chạy trước
env -u ELECTRON_RUN_AS_NODE npx electron tools/validate-ui.js
env -u ELECTRON_RUN_AS_NODE npx electron tools/probe-log-color.js
env -u ELECTRON_RUN_AS_NODE npx electron tools/probe-contrast-pixels.js
env -u ELECTRON_RUN_AS_NODE npx electron tools/shot-wave46e.js
```
