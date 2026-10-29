# WAVES 44 — KẾT QUẢ

> Mục tiêu: sửa **đúng gốc rễ** 2 lỗi bro báo lặp lại nhiều lần (nhật ký "??" +
> không đổi màu text), thiết kế lại ô "Đã làm" theo đúng ý, đổi thương hiệu, và
> thêm hướng dẫn token có mũi tên + cách đăng nhập bằng Bot.
> Mọi kết luận dưới đây đều **đo được** trong Chromium thật, không phải đoán.

---

## 1. Lỗi "??" trong nhật ký — TÌM RA GỐC RỄ, sửa tận gốc

### Gốc rễ (không phải như tôi tưởng ở Wave 42–43)

Tôi đã trích xuất bảng `unicode-range` của `fonts.css`. Face **cuối** của
JetBrains Mono chỉ khai báo:

```
U+??, U+131, U+152-153, ..., U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, ...
```

→ Có `U+2191` (↑) và `U+2193` (↓) nhưng **KHÔNG có `U+2192` (`→`)**.
Renderer dùng đúng ký tự `→` ở **một chuỗi chạy thật**
(`renderer.js` — thông báo hCaptcha passive). Chromium không face nào phủ
`→` → vẽ ô **tofu** = đúng cái bro thấy là `??`.

Wave 42 tôi mới sửa thanh tiến trình (`▓`/`░`/`▋`); Wave 44 tìm ra `→` còn sót.

### Cách sửa (2 lớp)

1. Viết lại chuỗi hCaptcha bỏ `→`.
2. **`asciifyLog()` chặn ở CỬA VÀO `appendLog`** — mọi dòng nhật ký đi qua bộ
   lọc: mũi tên → `->`, khối vẽ → `#`, emoji → chữ; đồng thời bỏ variation
   selector (`U+FE00–FE0F`) và mọi ký tự ngoài BMP. Về sau **không ai** có thể
   làm `??` xuất hiện lại dù có thêm chữ lạ.

### Bằng chứng (probe bơm ký tự độc hại)

Bơm vào log: `token hết hạn → thử lại █▓ emoji 🎮 xong`
Khung nhật ký hiển thị:

```
[ !! ] token hết hạn -> thử lại ## emoj
```

`hasBlockGlyph: false` · `arrowSanitised: true` ✅

---

## 2. Nhật ký "không hề đổi màu text" — làm ĐÚNG cả hai yêu cầu

Wave 43 tôi hiểu nhầm *"để màu mặc định"* thành **bỏ hết màu** → mọi dòng
giống hệt nhau. Bro phản hồi: *"vẫn không hề đổi màu text"*. Wave 44 làm đủ hai:

| Trạng thái | Nền TỐI | Nền SÁNG | Tương phản đo được |
|---|---|---|---|
| `ok`   | `#7cf0b4` | `#055c37` | **14.44 : 1** / **8.10 : 1** |
| `warn` | `#ffd76a` | `#7a4205` | **14.63 : 1** / **8.05 : 1** |
| `err`  | `#ff8f8f` | `#a6111b` | **9.23 : 1** / **7.73 : 1** |
| `orb`  | `#c9b3ff` | `#4c1d95` | **10.97 : 1** / **10.95 : 1** |
| `sys`  | `#cbd3e1` | `#46506a` | **13.44 : 1** / **8.03 : 1** |

`distinctColours: 4` — 4 nhóm màu **khác nhau thật** (đo bằng `Set` trên
`getComputedStyle().color`), chứng minh bằng số chứ không bằng lời.

Màu **không phải** chỉ báo duy nhất: nhãn `[ ok ] / [ !! ] / [ orb ] / [ $ ]`
luôn kèm theo → vẫn đọc được nếu mù màu.

---

## 3. Ô "Đã làm" — thiết kế lại đúng ý bro

Nguyên văn bro: *"phải có logo ORBS **VÀ BÊN DƯỚI NÓ LÀ LOGO CỦA QUEST ẤY** …
đéo phải sổ lên khi người dùng truy cập vào mà **sổ NGAY TRONG khung vuông ấy**
cơ mà … di chuột vào vuông ấy nó **TỰ LÀM MỜ Orb logo** phía sau rồi trôi vào các
logo text: **nhận được bao nhiêu, khi nào, nhiệm vụ gì**"*.

### Trước (sai) → Sau (đúng)

| | Wave 43 (bị chê) | Wave 44 |
|---|---|---|
| Thứ tự | logo quest **trên**, badge Orb dưới | **badge ORB TRÊN, logo quest DƯỚI** |
| Hiện thông tin | panel **nổi lên** phía trên ô | **NGAY TRONG** ô vuông |
| Hiệu ứng | hiện panel | **Orb tự MỜ** (opacity .16 + blur 2px) rồi chữ trôi vào |

### Đo được (probe-done-tile, 7 ô, cả 2 theme)

```
orbBeforeLogo      : true        ← Orb ở TRÊN, logo ở DƯỚI (kiểm bằng index DOM)
legacyTipPresent   : false       ← KHÔNG còn panel nổi
tileOverflow       : hidden      ← chữ bị cắt trong ô, không tràn ra ngoài
infoOpacityIdle    : 0   →  hover: 1
faceOpacityIdle    : 1   →  hover: 0.16 + blur(2px) saturate(0.5)
tileH x tileW      : 169 x 169   ← vẫn là ô VUÔNG
infoTitleText      : "ROR2 Hallowed Concepts"
infoRewardText     : "+700" (kèm logo Orb, không chỉ số trần)
infoWhenText       : "16:15 20/10/2026"
infoContrastTitle  : 18.01 : 1 (tối) / 17.90 : 1 (sáng)
```

Để harness đo được trạng thái hover trong môi trường headless (Chromium không
bắn `:hover` từ script), tôi thêm class `.qdone--hover` **song song** với
`:hover` — và ghi rõ trong CSS phải giữ 2 khối đồng bộ.

---

## 4. Thương hiệu

| Chỗ | Trước | Sau |
|---|---|---|
| `<title>` | `AUTO QUEST · Treo Orb Discord` | `Auto Quest · Nền tảng ALL IN ONE DISCORD` |
| Topbar / Sidebar | `AUTO QUEST` | `Auto Quest` |
| Khẩu hiệu | *(không có)* | `Nền tảng ALL IN ONE DISCORD by NgDuy` |
| Topbar tag | *(không có)* | `ALL IN ONE DISCORD · by NgDuy` |
| Trang Giới thiệu | `Về AUTO QUEST` | `Về Auto Quest` |
| package.json | `AUTO-QUEST` / `AUTO-QUEST` | `Auto Quest` / `NgDuy (ZoZ Community)` |

Chuỗi `THỐNG KÊ THU NHẬP VƯỢT LINK` **không tồn tại** trong mã nguồn app này
(đã grep toàn bộ `electron/`) — nó thuộc một app khác trong ảnh bro gửi. Không
cần xoá, chỉ cần đặt khẩu hiệu đúng như bro yêu cầu.

---

## 5. Chưa đăng nhập → thẻ "ZoZ Community" + ảnh mặc định

Bro: *"replace lại bằng ZoZ Community nhé; nếu user không có ảnh bìa và avt thì
bro để mặc định"*.

- `ZOZ_NAME = 'ZoZ Community'`, `ZOZ_TAG = 'Nền tảng ALL IN ONE DISCORD by NgDuy'`
- `defaultAvatarSvg(size)` — silhouette SVG **nội bộ**, không gọi mạng, nên hiện
  được cả khi offline.
- Khi guest: hero giữa trang **HIỆN** (trước đây ẩn hẳn) với tên ZoZ Community,
  avatar mặc định, banner `.default`.
- Đã đăng nhập bằng Bot mà không có avatar → cũng dùng avatar mặc định.

Đo được: `dpDisplay="ZoZ Community"` · `heroHidden=false` · `avatarHasSvg=true`.

---

## 6. Hướng dẫn lấy token — MŨI TÊN sổ ra + 2 cách

Bro: *"làm một cái mũi tên ấy khi người dùng click vào nó sẽ sổ ra tutorial; còn
phương thức thứ 2 là đăng nhập bằng discord, tôi sẽ tạo một con bot và cho phép
nó quyền đọc ảnh đại diện"*.

- **Mũi tên lớn** (`#btnGuideToggle`): mặc định **ĐÓNG**, bấm mới sổ. Có
  `aria-expanded` và mũi tên **xoay 180°** khi mở (không dùng màu làm chỉ báo
  duy nhất).
- **Tab Cách 1 · Console**: giữ nguyên hướng dẫn cũ + nút copy lệnh.
- **Tab Cách 2 · Đăng nhập bằng Bot**: ô `Bot Token` + ô `User ID`; gọi
  `GET https://discord.com/api/v10/users/{id}` với header `Authorization: Bot <token>`.
  **Chỉ đọc tên + ảnh đại diện** — không claim hộ, không đụng token tài khoản.
- **Mũi tên phụ** (`#btnBotGuideToggle`): sổ ra **hướng dẫn tạo bot 5 bước**
  (developers/applications → Reset Token → bật `SERVER MEMBERS INTENT` →
  OAuth2 scope `bot` → Copy User ID).
- Lỗi Discord hiển thị **nguyên văn** (`Discord trả 401: ...`) — không bịa thành
  công.

Hành vi đã kiểm bằng click thật: `bodyHidden true→false`,
`paneBotHidden true→false` + `paneConsoleHidden false→true`,
`botGuideHidden true→false`. ✅

---

## 7. Khối "Cấu hình tài khoản" — tông ĐEN NÂU

Bro: *"hoàn toàn màu đen nâu chỉnh một chút ở phần cấu hình tài khoản"*.

Token riêng (không đụng thẻ khác):
`--brown-900 #120d0a` · `--brown-850 #17110d` · `--brown-800 #1e1712` ·
`--brown-line rgba(198,158,116,.16)` · `--brown-accent #d9a441`.

Đo được:
- Tối: `linear-gradient(rgb(23,17,13) → rgb(18,13,10))` · `.hint` **7.65 : 1**
- Sáng: `linear-gradient(rgb(253,247,239) → rgb(246,236,224))` · `.hint` **6.61 : 1**

---

## 8. Hai LỖI THẬT do thay đổi làm lộ ra (đã sửa)

### (a) `#phBanner` / `#dpBanner` thiếu class `default` trong HTML — 1.06 : 1

Luật `[data-theme="light"] .hero-card:has(.ph-banner:not(.default)) .ph-display`
đổi chữ sang **trắng** khi có banner thật. Nhưng trong `index.html` ban đầu
`#phBanner` **không** có class `default` (chỉ được JS thêm lúc chạy) → lúc mới
dựng trang chữ **trắng trên nền trắng**.

Trước đây vô hại vì hero bị **ẩn** ở trạng thái guest. Wave 44 cho hero hiện →
lỗi lộ ra. **Sửa: đặt sẵn class `default` trong `index.html`** cho cả 2 banner.

`contrast-audit` từ 13 mục chìm → **0 mục**; `ph-display` lên **18.55 : 1**.

### (b) `.loop-box` trong config-card vẫn nền nâu ĐẬM ở chế độ Sáng — 2.68 : 1

`.hint` (chữ nâu đậm) nằm trong `.loop-box` mà hộp này chưa được override cho
chế độ Sáng → chữ chìm. **Sửa: thêm override Sáng** cho `.loop-box`, `.guide-box`,
`.guide-tab`, `.bot-label`, `.step-item`.

---

## 9. Bảng kiểm chứng cuối (toàn bộ đều XANH)

| Harness | Kết quả |
|---|---|
| `tsc --noEmit` | exit **0** |
| `node --check` × 3 (main / preload / renderer) | **OK** |
| `validate-ui.js` | **297 / 297** |
| `probe-done-tile.js` | **PASS ✅** (thiết kế lại cho Wave 44) |
| `probe-log-color.js` | **PASS ✅** (distinctColours 4, 7.73–14.63:1) |
| `probe-wave44.js` | **PASS ✅** (MỚI — thương hiệu/ZoZ/mũi tên/bot/nâu) |
| `probe-wave42.js` | **PASS ✅** |
| `probe-wave42-visual.js` | **PASS ✅** |
| `theme-audit.js` | **0 mục chìm** cả 2 chế độ (50 mục chữ mỗi chế độ) |
| `contrast-audit.js` | **41 / 41 ≥ 4.5 : 1** |
| `quest-classify-test.js` | **10 PASS / 0 FAIL** |
| Tệp rác trong `electron/renderer/` | **0** |

Ngoài ra `contrast-audit.js` nay **tự dọn** `harness-api.js` / `harness-data.js`
(trước chỉ xoá `.html` nên để rác lại).

---

## 10. Việc còn lại / chờ bro

- **Chờ xác nhận trên bản build thật.** Bro báo *"vẫn không được"* — rất có thể
  bro đang mở **bản build cũ**. Các thay đổi Wave 44 nằm trong mã nguồn; cần
  build lại (`npm run build`) rồi mở lại app mới thấy.
- Nếu bro muốn bot đọc thêm **server / role**: mở rộng `applyBotProfile()` gọi
  `/users/{id}/guilds` (cần thêm scope). Nói tôi biết là làm.
