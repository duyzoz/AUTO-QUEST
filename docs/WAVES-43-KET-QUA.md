# WAVE 43 — KẾT QUẢ (ô "Đã làm" có logo Orb + hover chi tiết · dời 3 nút vào khung quest · nhật ký màu mặc định)

> Ngày: 2026-10-23 · Trạng thái: **HOÀN TẤT**
> Kiểm chứng: `validate-ui` **258/258** · `tsc` **exit 0** · `probe-wave42` **PASS** ·
> `probe-wave42-visual` **PASS** · `probe-done-tile` **PASS** · `probe-log-color` **PASS** ·
> `theme-audit` **0 mục chìm / 2 chế độ** · `contrast-audit` **41/41** · `quest-classify-test` **10/10**.

---

## 0. Bro báo gì → tôi kiểm tra bằng số, không đoán

Bro gửi 7 ảnh nhưng **model này không đọc được ảnh**. Thay vì đoán, tôi **giải mã pixel**
7 ảnh bằng Python (tự viết bộ đọc PNG: inflate + un-filter) để lấy dữ liệu khách quan:

| Ảnh | Kích thước | Màu trội | Suy ra |
|---|---|---|---|
| -037Z | 1920×1080 | `#ffffff` 38.8% + `#ebeff6` | Toàn app ở **chế độ Sáng** |
| -050Z | 262×167 | `#ffffff` + `#bdacef` (tím nhạt) | Một khối ở chế độ Sáng |
| -052Z | (jpeg 160KB) | — | Ảnh minh hoạ tooltip |
| -054Z/-057Z/-059Z | ~255×265 | `#1a1a1e` 19-27% | **3 panel tooltip TỐI** (tên + Orb + ngày) |
| -064Z | 32×236 | `#0b0d12` + `#34d399` (xanh) | Dải dọc TỐI rất hẹp |

Đối chiếu với **đo DOM thật** trong Electron:

- `.side-actions` rect = `x:16, y:730, right:239, bottom:869` → **nằm ĐÁY sidebar**, không phải
  cạnh khung "Đã làm" ⇒ **bro đúng, Wave 42 xếp sai chỗ.**
- `<p class="nav-label">Menu</p>` **vẫn còn** ⇒ còn mục tiêu đề chưa xoá.
- Nhật ký: tôi đã tô màu **cả dòng** theo trạng thái (`t-ok` xanh, `t-warn` vàng…) ⇒
  bro phàn nàn "sao làm cho chữ phải có màu" là **đúng**, và ở chế độ Sáng chữ màu bị chìm.

---

## 1. Ô "Đã làm": khôi phục LOGO ORB + số Orb + hover chi tiết

Wave 42 tôi **xoá nhầm** badge Orb. Nay khôi phục đúng yêu cầu — mỗi ô 3 tầng:

```
┌──────────────┐
│   [ LOGO ]   │  ← tầng 1: logo THẬT nhiệm vụ (logotype → game_tile → app icon)
│    GAME      │
│  (🟣) 700    │  ← tầng 2: logo ORB + SỐ Orb đã nhận
└──────────────┘
     ↕ rê chuột
┌────────────────────────┐
│ ROR2 Hallowed Concepts │  ← tên nhiệm vụ
│ Risk of Rain 2         │  ← tên game
│ Nhận được   (🟣)+700 Orbs │
│ Thời gian   16:15 20/10/2026 │  ← thời điểm NHẬN THẬT (claimed_at)
└────────────────────────┘
```

**Dữ liệu thật, không bịa:**
- `src/questManager.ts::getQuestCardData` trả thêm `orbs` + `claimedAt` (đọc
  `userStatus.claimed_at` của Discord) → biên dịch sang `electron/bot/src/questManager.js`.
- Renderer nhận `claimedAt` trong `quest:inventory` → `upsertQuest`.
- `fmtClaimTime()` đổi ISO → giờ địa phương `HH:MM DD/MM/YYYY`.
- `escapeHtml()` chống phá DOM (tên quest do Discord cấp).
- `updateDoneTile()` cập nhật **tại chỗ** (không dựng lại node) khi Orb/thời gian đổi.
- `aria-label` đọc được: `"Đã nhận: <tên> · <N> Orbs · nhận lúc <giờ>"`.

### 🐞 LỖI THẬT đã bắt: số Orb gần như VÔ HÌNH

Đo lần đầu: **`orbNumContrast: 1.56`** (Tối) / **`1.47`** (Sáng) — chữ tím sáng
(`--brand-bright: #a78bfa`) trên nền badge tím nhạt. Đây đúng là "chìm màu" bro phàn nàn.

Sửa: nền badge tím **đậm** `rgba(76,29,149,.55)` + chữ gần trắng `#f5f3ff` (Tối) ·
nền tím rất nhạt `rgba(237,233,254,.95)` + chữ tím đậm `#4c1d95` (Sáng).

Kết quả đo lại: **9.99:1** (Tối) · **9.23:1** (Sáng) — tăng ~6×.

---

## 2. 3 nút điều khiển DỜI vào cạnh khung "Đã làm"

Trước: `.side-actions` nằm trong `.side-inner` (đáy sidebar), `y=730`.
Nay: `.side-actions` nằm **trong `.quest-head`** — cùng hàng với 3 tab
`Chưa làm · Chưa nhận · Đã làm`, ngay cạnh khung "Đã làm". Layout đo được:

| Phần tử | x | y | w | h |
|---|---|---|---|---|
| `tab-buttons` | 339 | 484 | 343 | 36 |
| `side-actions` | **933** | **482** | 399 | 39 |
| `questCounter` | 1344 | 491 | 57 | 21 |

`inQuestHead: true` · `inSidebar: false` · `overlapTabs: false` · cả 3 nút `visible: true`.

Đồng thời **xoá hẳn `<p class="nav-label">Menu</p>`** → `navLabels: []`.
Màn hẹp (`max-width: 1180px`) tự xuống dòng nhưng **vẫn trong khung quest**.

---

## 3. Nhật ký: MÀU MẶC ĐỊNH (bro yêu cầu rõ)

Trước (Wave 42): tô màu **cả dòng** theo trạng thái — chữ xanh/vàng/đỏ loè loẹt và
ở chế độ Sáng bị chìm.

Nay đúng luật "màu mặc định":
- **Nội dung dòng luôn MỘT màu mặc định**: `#f2f5fa` (Tối, gần trắng) · `#10151f` (Sáng, gần đen).
- **Màu ngữ nghĩa CHỈ nằm ở NHÃN** `[ ok ]` / `[ !! ]` / `[ err ]` / `[ orb ]` / `[ $ ]`
  → màu không phải chỉ báo duy nhất (vẫn có chữ), và chữ không bị tô.
- CSS đã xoá hẳn 4 rule `.u229-line.t-ok/.t-warn/.t-err/.t-orb { color: ... }`.

**Đo thật** (`probe-log-color.js`, cả 2 chế độ):
`allBodiesDefault: true` · tương phản nội dung thấp nhất **13.44:1** (Tối) / **8.03:1** (Sáng) ·
`hasBlockGlyph: false` (hết "??").

---

## 4. Bảng kiểm chứng cuối

| Bộ kiểm | Kết quả |
|---|---|
| `tools/validate-ui.js` | **258/258 marker** (thêm 28 marker Wave 43) · 110 id · 0 thiếu ref · HTML cân bằng |
| `npx tsc -p tsconfig.build.json` | **exit 0** |
| `tools/probe-done-tile.js` (mới) | **PASS ✅** — 7 ô, 6 ô có badge Orb, 7 ô có tooltip, Orb **9.99:1 / 9.23:1** |
| `tools/probe-log-color.js` (mới) | **PASS ✅** — màu mặc định, 13.44:1 / 8.03:1, hết tofu |
| `tools/probe-wave42.js` | **PASS ✅** |
| `tools/probe-wave42-visual.js` | **PASS ✅** — Dừng đỏ 5.44:1 / 6.3:1 |
| `tools/theme-audit.js` | **dark 0 · light 0 mục chìm** |
| `tools/contrast-audit.js` | **41/41 ≥ 4.5:1** |
| `tools/quest-classify-test.js` | **10/10 PASS** |
| `tools/probe-terminal.js` | thanh bar `[#---------------] 0% → 25% → 75% → 100%` |

---

## 5. File đã đổi

- `electron/renderer/renderer.js` — `buildDoneTile` 3 tầng (logo + badge Orb + tooltip),
  `updateDoneTile`, `doneTileAria`, `doneTileTipHtml`, `fmtClaimTime`, `escapeHtml`,
  `ORB_ICON_SRC`; nhận `claimedAt` từ inventory.
- `electron/renderer/styles.css` — `.qdone-orbs`/`.qdone-orb`/`.qdone-orb-num` (tương phản cao),
  `.qdone-tip*` (tooltip 2 chế độ), `.side-actions` chuyển sang **hàng ngang trong card**,
  `.u229` màu mặc định + bỏ tô màu cả dòng, light override tương ứng.
- `electron/renderer/index.html` — xoá `<p class="nav-label">Menu</p>`; dời `.side-actions`
  từ sidebar vào `.quest-head`.
- `src/questManager.ts` — `getQuestCardData` trả thêm `orbs`, `claimedAt`.
- `tools/probe-done-tile.js` (mới) · `tools/probe-log-color.js` (mới) ·
  `tools/validate-ui.js` (+28 marker, sửa 3 marker cũ đã lỗi thời).

---

## 6. GIỚI HẠN THẬT (không tô hồng)

- **Model này KHÔNG đọc được ảnh** bro gửi, và máy test **không có Windows OCR**.
  Nên mọi kết luận đều từ **giải mã pixel thủ công + đo computed style/DOM tươi trong
  Chromium thật** — không phải đoán nội dung ảnh.
- **Không thể quét/nhận thật trên account của bro từ shell này**: ciphertext DPAPI được
  mã hoá ở phiên Windows của bro, khác phiên agent. ⇒ Bro tự chạy `npm run dev` để xác nhận.
- Ảnh bro gửi là **tooltip của Discord thật** (3 panel tối ~255×265). Tôi đã dựng tooltip
  in-app theo **đúng bố cục** đó (tên · Orb · thời gian) nhưng **không copy pixel** của Discord.
