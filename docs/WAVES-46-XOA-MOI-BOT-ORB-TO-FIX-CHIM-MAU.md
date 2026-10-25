# WAVES 46 — XOÁ "MỜI BOT" · LOGO ORB TO GIỮA · HẾT CHÌM MÀU CHẾ ĐỘ SÁNG

> Bro gửi 3 ảnh + 5 yêu cầu, kèm câu dặn: **"đọc skill uu ux pro thật kĩ mày nhé"**.
> Tài liệu này ghi lại **nguyên văn yêu cầu**, **gốc rễ đo được**, **cách sửa**, và
> **con số kiểm chứng** — không có chỗ nào là "chắc là xong".

---

## 1. Năm yêu cầu (nguyên văn của bro)

| # | Nguyên văn | Việc phải làm |
|---|---|---|
| 1 | *"mày chỉnh ngay profiles ở giữa về NHƯ CŨ"* · *"nhất cái profiles ở giữa ĐÉO AI BẮT MÀY ĐỂ CHÍNH GIỮA"* | Trả profile giữa về **hàng ngang** như cũ |
| 2 | *"mục chưa làm mày đang làm CÁI ĐEOW GÌ VẬY ??? nó xếp chồng nên nhau"* · *"mày phải fix hiện tượng trồng lên nhau này trước đi"* | Fix ô "Chưa làm" **xếp chồng** |
| 3 | *"bố cần là logo orb to ở chính giữa và logo Game chữ game trích được từ server đícord á"* | Logo Orb **TO ở chính giữa** + logo/tên game lấy từ server Discord |
| 4 | *"xoá hết bò hẩn chức năng mời bot server xoá sạch đi cho tao"* | **Xoá sạch** chức năng "Mời bot vào server" |
| 5 | *"ảnh đại diện lẫn profile ở giữa khi chuyển chế độ sáng nó đitn mẹ mày chứ chìm màu rất xấu"* | Fix **chìm màu** ở chế độ Sáng |

---

## 2. Gốc rễ tìm được (đo bằng số, không phỏng đoán)

### 2.1. Ô "Chưa làm" xếp chồng → **`.qstate` là CON CỦA LƯỚI**

`.quest-list` là `display: grid`. Ô "rỗng" `.qstate` cũng là **một mục của chính lưới** với
`grid-column: 1 / -1`. Khi `scanning = true` nó **vẫn hiện** → chiếm trọn hàng đầu và
**đẩy toàn bộ thẻ xuống 107px**. Mắt người đọc thành "các khối lệch / xếp chồng".

```
{"before":{"cards":9,"firstTop":694},"scanning":true,"stateHidden":false,
 "stateDisplay":"flex","stateH":87,"stateTop":690,"stateBottom":777,
 "firstTop":801,...,"shiftedDown":107}
```

**Sửa 2 lớp** (phòng thủ kép):
- **JS** — `setEmptyState()` thêm `hasCards`: lưới đã có thẻ thì ô rỗng **LUÔN** ẩn.
- **CSS** — chốt cứng, kể cả khi JS sót:
  ```css
  .quest-list:has(> .qcard) > .qstate,
  .quest-list:has(> .qdone) > .qstate { display: none; }
  ```

**Đo lại:** `shiftedDown: 107 → 0`, `stateH: 0`, `display: none`.

### 2.2. Chìm màu chế độ Sáng → **THIẾU LUẬT `[hidden]` TOÀN CỤC**

Đây mới là thủ phạm thật — **không phải** sai token màu (token đúng hết: `--bg-base` sáng,
`--fg` tối…). Vấn đề: **nhiều component set `display: flex/grid` trên chính element đó**,
mà class có độ ưu tiên **cao hơn** thuộc tính `hidden` của trình duyệt. Kết quả: thẻ hero
`.hero-card.profile-hero` **mang nền TỐI `rgb(9,11,19)`** và **vẫn được VẼ** dù đã `hidden`,
đè lên nội dung sáng phía dưới.

Đo trực tiếp: `#phDisplay` chỉ **1.06:1** — chữ gần như tàng hình.

**Sửa:** 1 luật duy nhất, chốt bằng `!important`:
```css
[hidden] { display: none !important; }
```

**Đo lại:** `15 mục chìm → 0`. Chữ profile từ **1.06:1 → 18.55:1**.

### 2.3. Hardcode hex theo từng màn (đúng "thủ phạm số 1" của skill UX)

Skill `01-ui-ux-pro-max.md` §4 nói rõ: *"hardcode hex từng màn ← thủ phạm số 1"*. Tìm thấy:
`#4c1d95` (banner), `#1b1c20`/`#0c0d10` (ô Đã làm), `rgba(0,0,0,0.45)` (bóng avatar),
`#f5f3ff` (số Orb). **Tất cả đã token hoá**: `--banner-c`, `--qdone-bg-a/b`, `--avatar-shadow`,
`--orb-shadow`, `--orb-num`, `--qdone-name` — override **một chỗ** cho mỗi theme.

---

## 3. Logo Orb TO ở chính giữa (yêu cầu #3)

Ảnh bro đưa: `Gemini_Generated_Image_gv00ehgv00ehgv00-removebg-preview.png`
→ đã giải mã kiểm tra: **500×500, RGBA (alpha thật), nội dung chiếm gần trọn khung 496×496**.
Copy vào `electron/renderer/assets/orb-logo-big.png`.

Thêm `.ph-orbbig` vào thẻ hero — **orb là nhân vật chính, canh giữa tuyệt đối**:

| Số đo | Giá trị |
|---|---|
| Cạnh orb | **132px** (khách) / **148px** (mặc định) |
| Lệch tâm ngang so với thẻ | **0px** |
| Ảnh nạp thật | `naturalWidth = 500` |
| Hiệu ứng | quầng sáng mờ + nhịp thở 4.6s (**tắt** khi `prefers-reduced-motion`) |

Ô **"Đã làm"** cũng được làm lại: orb từ **14px → 44px**, bỏ dạng "viên thuốc" cũ,
xếp dọc `orb trên · số Orb dưới · logo game cuối` — orb to, canh giữa, không bị lấn át.

**Tên + logo game trích từ server Discord** — đường đã có sẵn, không phải bịa:
- **Tên**: `gameTitle` ← `messages.game_title` (`src/questManager.ts:396`)
- **Logo**: leo thang `logotype → gameTile → appIcon(q.appId, q.appIcon)`

---

## 4. Xoá sạch "Mời bot vào server" (yêu cầu #4)

| Khu vực | Đã xoá |
|---|---|
| `index.html` | Cả pane "Cách 2 · Mời bot vào server" (**119 dòng**) + nút tab `gTabBot`; tab bar thành `<span>` tĩnh |
| `renderer.js` | Khối OAuth2 + khối token ứng dụng (**235 dòng**), `selectGuideTab()` và listeners |
| `main.js` | `apptoken:status/import-txt/clear`, `oauth:build-url`, `bot:whoami`, `readAppSecrets`, `writeAppSecrets`, `isSnowflake`, `looksLikeBotToken` (**235 dòng**) |
| `preload.js` | 5 bridge: `appTokenStatus/appTokenImportTxt/appTokenClear/oauthBuildUrl/botWhoami` |
| `styles.css` | `.dlogin*`, `.perm-chip*`, `.oauth-*`, `.apptok*` + override sáng của chúng |

**GIỮ LẠI** đường **ĐĂNG NHẬP THẬT** (token tài khoản từ `.txt` → `usertoken:import-txt`
→ `take` đọc 1 lần rồi xoá khỏi RAM). `parseKeyValue` được giữ vì `usertoken:import-txt` dùng.

> ⚠️ Khi cắt theo mốc nội dung, tôi **xoá nhầm `parseKeyValue` + listener `btnUserTokImport`**
> (chúng nằm trong vùng bị cắt). Phát hiện nhờ `validate-ui` FAIL → đã khôi phục.
> Đây là lý do **luôn phải chạy validate sau mỗi lần cắt lớn**.

---

## 5. Kiểm chứng cuối cùng

| Bộ kiểm | Kết quả |
|---|---|
| `validate-ui` (marker tĩnh) | **328 / 328** |
| `theme-audit` (đo màu 2 theme) | **dark 0 chìm · light 0 chìm** |
| `contrast-audit` | **ALL ≥ 4.5:1** (47 mẫu) |
| `probe-orb-big` (orb to + không xếp chồng) | **13 pass / 0 fail** |
| `probe-quest-stack` | **12 pass / 0 fail** (107px → 0px) |
| `probe-guest-centre` | **PASS** (`flex-direction = row`) |
| CSS cân bằng ngoặc | **764 / 764** |
| File rác (`harness-*.js`, `__*.html`) | **0** |

Ảnh kiểm chứng: `build-release/wave46/` — 5 PNG (2 theme × hero/ô đã làm/ô chưa làm),
**đã pixel-sample xác nhận** sáng và tối khác nhau thật (tâm hero: sáng `(255,255,255)`
vs ô đã làm tối `(6,8,14)`).

---

## 6. Bài học ghi lại

1. **`[hidden]` KHÔNG tự thắng `display: flex`.** Triệu chứng không phải "sai màu" mà là
   **"chìm màu"**: một element tối vẫn được vẽ dưới nội dung sáng. Luật toàn cục là bắt buộc.
2. **Đo màu PHẢI ép reflow sau khi đổi `data-theme`.** `contrast-audit` cũ thiếu bước này
   → báo **12 mục FAIL giả**. Thêm `void document.body.offsetHeight` + chờ 500ms → **0 FAIL**.
3. **Probe phải mở đúng panel trước khi đo.** Ô "Đã làm" nằm trong `[hidden]` → mọi `rect`
   ra `0x0`. Đó là **lỗi của probe**, không phải lỗi app. Đừng "sửa" app vì lỗi của probe.
4. **`node --check` ngay sau mỗi lần cắt JS.** Tôi để backtick trong template literal và
   chỉ phát hiện lúc chạy.
5. **Token hoá — không hardcode hex.** Đúng như skill UX dặn; đây là cách duy nhất để
   chế độ Sáng không chìm màu.
