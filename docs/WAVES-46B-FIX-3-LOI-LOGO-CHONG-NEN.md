# WAVES 46b — SỬA 3 LỖI BRO NÊU LẦN 2

> Bro gửi 2 ảnh chụp màn hình 1920×1080 kèm nguyên văn:
>
> *"mày đang làm cái đéo gì vậy ?? đtj mẹ sao tụ nhiên lòi logo orb phía trên rồi
> phần đa làm vẫn chưa fix chồng hết nhiệm vụ lên nhau ?? logo có dc add xoá nền
> đéo đâu ??? fix khẩn trương dm mày"*

Wave 46 (vòng trước) đã bị từ chối. Vòng này sửa đúng 3 điểm, mỗi điểm đều có
**số đo thật + ảnh chụp lại** làm bằng chứng.

---

## 1. "Sao tụ nhiên lòi logo orb phía trên"

### Gốc lỗi
Wave 46 dựng một lớp phủ `.ph-orbbig` đặt `position: absolute`, `top: 168px`
(đúng mép dưới banner), `transform: translate(-50%, -50%)`. Vì dịch chuyển −50%
cả trục dọc, **tâm** orb nằm ngay mép banner → orb **nhô 74px lên giữa banner**,
cộng thêm quầng `::before` (`inset: -18px`) → nhô ~92px. Ngoài ra còn phải thêm
`.profile-hero .ph-body { padding-top: 10px }` để né chồng chữ — dấu hiệu rõ của
một phần tử đặt sai chỗ.

### Cách sửa
Xoá hẳn lớp phủ `.ph-orbbig`. Cho **logo orb TO làm ẢNH CỦA CHÍNH Ô AVATAR** ở
tâm thẻ hero — nằm TRONG luồng bố cục, đúng nghĩa "chính giữa", không lơ lửng.

- `index.html`: `.ph-avatar` nay chứa
  `<img class="ph-avatar-orb" src="assets/orb-logo-big.png">` + hình người dự
  phòng `<svg class="ph-avatar-fallback">`.
- `styles.css`: bỏ toàn bộ `.ph-orbbig*`, `@keyframes orbBigBreath`,
  `.profile-hero .ph-body { padding-top }`. Thêm `.ph-avatar-orb`
  (`width/height: 100%`, `object-fit: contain`).
- `renderer.js`: thêm `syncHeroOrb()` — chỉ bật orb khi (a) user KHÔNG có ảnh
  đại diện thật, và (b) ảnh nạp được (`naturalWidth > 0`). Ảnh hỏng → gỡ class,
  hình người quay lại (không bao giờ ô trống).

### Luật ưu tiên
| Có ảnh đại diện Discord? | Hiển thị |
|---|---|
| Có (`has-photo`) | Ảnh đại diện thật; orb bị ẩn |
| Không | **Logo orb TO** |
| Không + ảnh orb lỗi | Hình người mặc định (SVG nội bộ) |

### Số đo
```
PASS  hero: KHÔNG còn lớp phủ orb lơ lửng (.ph-orbbig)
PASS  hero: ảnh orb lớn tồn tại (.ph-avatar-orb)
PASS  hero: orb cạnh >= 60px                    [w=76 h=76]
PASS  hero: ảnh orb nạp thật (naturalWidth>0)   [natural=500]
PASS  hero: orb CANH GIỮA ô avatar (lệch <= 2px) [lệch 0px]
PASS  hero: orb KHÔNG nhô lên giữa banner       [orb.top=139px / banner 168px]
```

---

## 2. "Phần đa làm vẫn chưa fix chồng hết nhiệm vụ lên nhau"

### Gốc lỗi — ĐÂY LÀ LỖI NẶNG NHẤT
`.qgrid-done` (và `.quest-list`) **chỉ khai báo CỘT, không khai báo HÀNG**:

```css
.qgrid-done { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
```

Ô `.qdone` có `aspect-ratio: 1/1` → cao ~168px. Nhưng lưới nằm trong flex card
(`.quests-card { display:flex; flex-direction:column }`) và chính nó là
`flex: 1 1 auto; overflow-y: auto`. Chromium chia **hàng auto = khoảng trống còn
lại / số hàng** → track chỉ ~108px, trong khi ô vẫn 168px → **mỗi ô tràn xuống
60px và ĐÈ LÊN hàng dưới**.

**Số đo trước khi sửa:**

```
row heights : 168, 168, 168, 168
row gaps    : -60, -59, -60      ← GAP ÂM! CSS rowGap khai báo "8px"
list 433px tall, content 495px, scrolls = true
```

### Cách sửa
```css
.quest-list  { grid-auto-rows: max-content; }
.qgrid-done  { grid-auto-rows: max-content; }
```
`max-content` buộc hàng cao ĐÚNG BẰNG nội dung (ô vuông), nên `gap` khai báo
được tôn trọng.

**Số đo sau khi sửa:** `row gaps: 9, 8, 8` ✅

### Kiểm chứng bằng pixel ảnh chụp
Wave 46 (lỗi): dải ô chạy **liên tục y=540→996** với **đúng 1 khe hở** ở đáy.
Wave 46b (đã sửa): **9–10 dải khe hở** giữa các hàng (dark: 9, light: 10).

### Quét 3 lưới × 4 kích thước cửa sổ
```
1920x1080  Active gap=15 OK | New gap=15 OK | Done gap=9  OK
1600x900   Active gap=15 OK | New gap=15 OK | Done gap=9  OK
1366x768   Active gap=15 OK | New gap=15 OK | Done gap=8  OK
1280x800   Active gap=15 OK | New gap=15 OK | Done gap=9  OK
WAVES 46b GRID STACK: 0 fail
```

---

## 3. "Logo có dc add xoá nền đéo đâu ???"

### Gốc lỗi
File bro đưa tên là `Gemini_Generated_Image_...-removebg-preview.png` nhưng pixel
**KHÔNG hề trong suốt**:

```
trước khi sửa:
  alpha=255 : 54.5%
  alpha=128 : 45.5%     ← MÀN ĐEN MỜ phủ KÍN 500×500
  alpha=0   :  0.0%     ← KHÔNG có pixel nào trong suốt
  góc TL/TR/BL/BR = (0,0,0,128)
```

Vì alpha=128 ≠ 0, ảnh vẽ ra thành **một Ô VUÔNG XÁM ĐEN** quanh đĩa orb.

### Cách sửa — `tools/cutout-orb-alpha.py`
Thuần Python (không cần thư viện ngoài):

1. Đọc PNG RGBA + **giải nén zlib + unfilter** 5 kiểu lọc dòng của PNG.
2. Tìm **tâm + bán kính đĩa orb** từ vùng alpha > 200 (dùng centroid + khoảng
   cách xa nhất → chịu được đĩa hơi lệch tâm).
3. Key alpha theo khoảng cách:
   - `d ≤ R − feather` → giữ nguyên alpha (đồng thời diệt "màn đen" còn sót)
   - `d ≥ R` → **alpha = 0** (nền thật sự trong)
   - dải chuyển tiếp → giảm alpha tuyến tính (khử răng cưa)
4. Ghi lại PNG RGBA (zlib nén mức 9, filter 0).
5. Tự kiểm tra lại: in alpha 4 góc + tỉ lệ alpha=0 / bán trong suốt.

### Số đo
```
trước:  alpha=255 54.5% | semi 45.5% | alpha=0  0.0%   góc (0,0,0,128)
sau  :  alpha=255 52.2% | semi  5.0% | alpha=0 42.8%   góc (0,0,0,0)
        centroid (249.5, 250.0)  Rmax 217.1  R 213.9
        alpha>8 bbox = 428×427  (đĩa orb gọn, đã cắt sát)
```

---

## 4. Bảng tổng kết kiểm chứng

| Hạng mục | Trước | Sau |
|---|---|---|
| Hàng lưới "Đã làm" | gap **−60 / −59 / −60 px** | gap **9 / 8 / 8 px** |
| Khe hở hàng trên ảnh chụp | **1 dải** | **9–10 dải** |
| Quét 3 lưới × 4 cỡ cửa sổ | — | **0 fail** |
| Lớp phủ orb lơ lửng | có `.ph-orbbig` | **đã xoá** |
| Orb nhô lên banner | tâm ở mép banner (nhô 74px) | orb.top 139px / banner 168px |
| Nền ảnh orb | alpha=0 **0%**, màn đen alpha=128 | alpha=0 **42.8%**, góc trong suốt |
| `validate-ui` | 326/328 | **332/332** |
| `probe-orb-big` | 13/0 | **17/0** |
| `theme-audit` | 0 chìm / 0 chìm | **0 chìm / 0 chìm** |
| `contrast-audit` | ALL ≥ 4.5:1 | **ALL ≥ 4.5:1 (47 mẫu)** |
| Ngoặc CSS | 764/764 | **758/758** |
| `node --check` | OK | **OK (3 file)** |

---

## 5. Bài học rút ra

1. **Lưới CSS chỉ khai báo cột là cái bẫy.** Bất cứ khi nào ô có `aspect-ratio`
   hoặc chiều cao tự nhiên, mà lưới lại nằm trong flex/grid cha co giãn, **hàng
   auto sẽ bị bóp nhỏ hơn nội dung** và các hàng đè nhau. Luôn khai báo
   `grid-auto-rows: max-content` khi muốn `gap` được tôn trọng.

2. **Gap âm là dấu hiệu chắc chắn của lỗi xếp chồng.** Đo `actualGap` giữa các
   hàng thay vì chỉ đọc `getComputedStyle().rowGap` — cái sau LUÔN trả về giá trị
   khai báo, kể cả khi bố cục thực tế đang đè lên nhau.

3. **"Đã tách nền" trong tên file không có nghĩa là đã tách nền.** Phải đọc
   thẳng kênh alpha: `alpha=0` ở 4 góc là tiêu chí tối thiểu.

4. **`position:absolute` + `translate(-50%,-50%)` ở mép một khối khác thì luôn
   nhô ra.** Nếu phải nới padding của khối lân cận để né, đó là dấu hiệu phần tử
   đặt sai chỗ — nên đưa nó vào luồng bố cục.

5. **Ảnh chụp màn hình là dữ liệu, không phải chỉ để xem.** Bộ giải mã
   `tools/jpeg-ascii.py` (thuần Python) cho phép đo pixel thật: tìm dải khe hở,
   đếm cột, xác định chỗ nhô. Nhờ đó mới tìm ra "1 khe hở thay vì 5".

6. **`idct()` phải cộng 128 (level shift).** Thiếu nó, ảnh JPEG giải ra đen thui
   và chỉ còn kênh màu — dễ tưởng ảnh gốc hỏng.

---

## 6. File thay đổi

| File | Thay đổi |
|---|---|
| `electron/renderer/index.html` | Xoá `.ph-orbbig`; `.ph-avatar` chứa `.ph-avatar-orb` + `.ph-avatar-fallback` |
| `electron/renderer/styles.css` | Xoá `.ph-orbbig*` + keyframes; thêm `.ph-avatar-orb`, `.has-orb`, `.has-photo`; thêm `grid-auto-rows: max-content` cho `.quest-list` và `.qgrid-done` |
| `electron/renderer/renderer.js` | Thêm `syncHeroOrb()`; `ui.phAvatarOrb`; cập nhật nhánh avatar trong `renderDiscordProfile()` + `resetDiscordProfile()` |
| `electron/renderer/assets/orb-logo-big.png` | **Tách nền thật** (alpha=0 ở 42.8%, góc trong suốt) |
| `tools/cutout-orb-alpha.py` | **MỚI** — công cụ tách nền PNG thuần Python |
| `tools/probe-all-grids.js` | **MỚI** — quét 3 lưới × 4 cỡ cửa sổ |
| `tools/probe-gap-collapse.js` | **MỚI** — đo gap hàng thật trong lưới "Đã làm" |
| `tools/shot-wave46b.js` | **MỚI** — chụp 6 ảnh kiểm chứng |
| `tools/validate-ui.js` | Thay 2 marker orb cũ bằng 6 marker `w46b:` |
| `tools/probe-orb-big.js` | Viết lại phần hero + thêm kiểm tra gap hàng |
| `tools/probe-done-tile.js` | Cập nhật ảnh orb `orb-logo.png` → `orb-logo-big.png` |
| `tools/jpeg-ascii.py` | Sửa `idct()` cộng 128 (level shift) |
| `build-release/wave46b/*.png` | 6 ảnh kiểm chứng |
