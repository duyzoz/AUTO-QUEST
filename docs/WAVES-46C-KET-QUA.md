# WAVES 46c / 46d — LOGO NHIỆM VỤ, ORB TO, TOOLTIP HOVER

Ngày: 2026-10-24
Yêu cầu của bro (kèm 11 ảnh chụp F12 trên Discord):

1. Logo Orb trong ô **to hơn nữa**.
2. **Nhiều ô không hiện logo Orb.**
3. **Chưa hiện được logo riêng của từng nhiệm vụ** — phải có *cả logo game lẫn chữ tên quest*, y như Discord.
4. Gọi CDN **đúng như ảnh F12**, không được bịa tên/font.
5. Rê chuột vào ô phải hiện **đúng như ảnh tooltip**, **cấm bịa đặt bất cứ thông tin gì**.

---

## 1. Gốc rễ: `loading="lazy"` trong vùng cuộn

Đây là lỗi thật đứng sau câu *"chưa hiện được logo riêng của từng nhiệm vụ"*.

```js
logo.loading = 'lazy';   // ❌ TRƯỚC
logo.loading = 'eager';  // ✅ SAU
```

Lưới "Đã làm" là một **vùng cuộn** (`overflow-y: auto`). Ảnh `lazy` nằm ngoài khung nhìn
**không bao giờ** được trình duyệt nạp → `naturalWidth = 0` → trình nạp ảnh tưởng ảnh hỏng,
leo hết chuỗi dự phòng rồi bỏ ảnh, chỉ còn chữ.

Đo bằng probe có HTTP server nội bộ (ảnh thật, cùng origin):

| | request ảnh được gửi |
|---|---|
| trước khi sửa | **1 / 6** |
| sau khi sửa | **6 / 6** |

## 2. Kích thước

| Chỗ | Trước | Sau | Ghi chú |
|---|---|---|---|
| Logo Orb trong ô "Đã làm" | 44 px | **78 px** (ô 169 px) | `clamp(64px, 50%, 96px)` ≈ tỉ lệ Discord (~50 % bề rộng ô) |
| Logo Orb ở thẻ hero | 86 px | **116 px** (full-HD **120 px**) | media query 1080p từng siết về 86 px — chính là cỡ bro nhìn thấy |

## 3. "Nhiều ô không hiện logo Orb"

`if (orbs <= 0) orbRow.hidden = true;` giấu **cả logo Orb lẫn số Orb** với mọi nhiệm vụ
thưởng vật tư (avatar decoration…). Dữ liệu thật: **4/19 quest có `orbs = 0`**.
Nay badge Orb hiện trên **mọi** ô; nhiệm vụ không có Orb thì chỗ số Orb ghi `—`.

Đo: `tilesWithOrbBadge` **6/7 → 7/7**.

## 4. CDN — đối chiếu ảnh F12, không bịa

Asset của quest **không phải hash** mà là **đường dẫn tương đối**:

```
https://cdn.discordapp.com/quests/{questId}/{snowflake}.{jpg|png|mp4}
```

Đã kiểm live bằng HTTP request:

| Route | Kết quả |
|---|---|
| `quests/{id}/{snowflake}.png` | 200 `image/png` |
| `embed/avatars/{0..5}.png` | 200 |
| `avatars/{uid}/{hash}.{ext}?size=N` | 404 với hash giả → **route tồn tại** |
| `banners/{uid}/{hash}.{ext}?size=N` | 404 với hash giả → route tồn tại |
| `avatar-decoration-presets/{hash}.png?size=96&passthrough=true` | 404 với hash giả → route tồn tại |
| `app-icons/{appId}/{hash}.{ext}?size=N` | 404 với hash giả → route tồn tại |

`"PLACEHOLDER"` = Discord không có asset → bỏ qua.

Dữ liệu thật 19 quest (`build-release/ui-preview/real-quests.json`):
`logotype` 19/19 · `gameTile` 19/19 · `hero` 19/19 · `gameTitle` 19/19 · `publisher` 19/19.

## 5. Tooltip hover — dựng lại đúng ảnh chụp

Thứ tự trong ảnh Discord, từ trên xuống:

1. **quầng Orb mờ** (chính ảnh orb phóng to + `blur(8px)`)
2. **LOGOTYPE** của game (wordmark dạng ảnh, ví dụ `EA SPORTS FC27`)
3. **`Nhiệm Vụ <tên nhiệm vụ>`** — chữ trắng đậm
4. **`<N> Orbs đã được nhận vào`** — chữ xám
5. **`<dd>/<mm>`** — chữ xám, số đều

Mọi giá trị lấy từ field **thật** Discord trả về:

| Dòng | Nguồn |
|---|---|
| tên nhiệm vụ | `messages.quest_name` |
| logotype | `config.assets.logotype_dark/light` |
| số Orb | `rewards.orb_quantity` |
| ngày nhận | `claimed_at` |

Không có chuỗi nào được thêm vào. Thưởng vật tư → `<tên phần thưởng> đã được nhận vào`.

## 6. Ba lỗi phát sinh khi soi ảnh (đã vá)

### 6.1 Ảnh chụp trả về frame cũ — không phải lỗi app

`capturePage()` lần **đầu** sau một thay đổi trả về **surface cũ**:

- ảnh 2 và 4 (theme Sáng) ra **toàn nền tối** dù `data-theme` đã là `"light"`;
- ảnh 6 ra **mặt trước** dù `getComputedStyle(info).opacity` đã là `1` và `face` là `0.16`.

Vá cả 3 phía:

- `webPreferences.backgroundThrottling: false` (cửa sổ ẩn bị bóp tiến trình vẽ);
- **chụp 2 lần, lấy lần sau**;
- tắt `transition` trước khi đổi trạng thái + `scrollIntoView` **rồi mới** đọc `getBoundingClientRect()`.

### 6.2 Hover còn để lại bóng chữ của mặt trước

Mặt trước mờ đi (`opacity: 0.16`) nhưng **tên game + logotype của nó vẫn nằm dưới tooltip**
thành một bóng chữ nhoè — trông như lỗi vẽ và trùng thông tin.

```css
.qdone--hover .qdone-name,
.qdone--hover .qdone-logo { opacity: 0; }
```

Chỉ còn logo Orb mờ làm quầng nền, đúng như Discord (Discord **thay hẳn** nội dung ô).

### 6.3 Nền Sáng: wordmark trắng vô hình

Asset `logotype` của Discord là **wordmark TRẮNG** (bản dùng cho nền tối).
Trên nền Sáng: **8/18 ô trắng trơn** — không nhìn thấy logo game nào.

- ❌ `invert(1)`: logotype còn có bản nhiều màu → phá màu thương hiệu.
- ❌ tấm nền đặc: thành **thanh đen chắn ngang ô**, nặng hơn hẳn thiết kế Discord.
- ✅ **viền tối quanh nét chữ** — nền vẫn sáng, không thêm khối trang trí, màu logo giữ nguyên:

```css
[data-theme="light"] .qdone-logo,
[data-theme="light"] .qdone-info-logo {
	filter: drop-shadow(0 0 1px rgba(8,11,18,.95)) drop-shadow(0 0 1px rgba(8,11,18,.95))
	        drop-shadow(0 1px 2px rgba(8,11,18,.7));
}
```

## 7. Quy tắc mới: chỉ WORDMARK mới được thay chữ

Trước đây: ảnh logo nạp được → **ẩn chữ**. Nhưng ảnh có thể là **icon app / game_tile** —
gần vuông — và khi đó ô chỉ còn *một hình vuông vô danh*.

```js
function logoIsWordmark(img) {
	if (!img || !img.naturalWidth || !img.naturalHeight) return false;
	return img.naturalWidth / img.naturalHeight >= 1.4;
}
```

- **wordmark** (rộng/cao ≥ 1.4, thực tế ~3–4) → thay chữ, đúng như Discord;
- **icon vuông** → vẫn hiện tên game bằng chữ.

## 8. Công cụ mới

| File | Việc |
|---|---|
| `tools/check-template-literals.js` | Chặn **backtick lạc** trong `const X = \`...\``. Khi số backtick **chẵn**, `node --check` vẫn PASS nhưng Electron chết im lặng với SIGTERM và không in gì — bẫy đã vấp 4 lần. |
| `tools/shot-wave46c.js` | 7 ảnh chứng minh. Dựng HTTP server nội bộ phục vụ ảnh thật (cùng origin — `file://` → `http://127.0.0.1` bị Chromium chặn bởi Private Network Access), chụp 2 lần chống surface cũ, lưu cả ảnh toàn trang. |

## 9. Kiểm chứng

```
validate-ui              340 / 340
probe-done-46c            14 pass / 0 fail
probe-done-tile           PASS ✅
probe-orb-big             17 pass / 0 fail
probe-all-grids           0 fail (3 lưới × 4 cỡ cửa sổ)
probe-quest-stack         12 pass / 0 fail
theme-audit               0 chìm / 0 chìm (Dark + Light)
contrast-audit            47 mẫu, tất cả ≥ 4.5:1
check-template-literals   33 file sạch
CSS braces                0
```

Ảnh: `build-release/wave46c/`

| File | Nội dung |
|---|---|
| `1-dark-done-orb-and-game-logo.png` | lưới "Đã làm" — Dark |
| `2-light-done-orb-and-game-logo.png` | lưới "Đã làm" — Light |
| `3-dark-hero-orb-bigger.png` | hero — Dark |
| `4-light-hero-orb-bigger.png` | hero — Light |
| `5-dark-done-grid-closeup.png` | cận cảnh lưới |
| `6-dark-hover-tooltip.png` | tooltip hover — Dark |
| `7-light-hover-tooltip.png` | tooltip hover — Light |
| `6*/7*-fullpage.png` | ảnh toàn trang của 2 lần chụp hover |
