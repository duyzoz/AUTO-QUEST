# WAVE 41 — KẾT QUẢ (terminal #229 · điều khiển lên cạnh · avatar mặc định · học repo)

> Ngày: 2026-10-23 · Trạng thái: **HOÀN TẤT** (validator 199/199, tsc 0, CDP 13/13, contrast 42/42, 0 JS error).

---

## 1. Nhật ký → TERMINAL #229 (self-typing)

**Vị trí GIỮ NGUYÊN** (hàng thẻ cạnh "Số dư khả dụng", trong `stats-row`), **không tràn viền**.

```
┌─ ● ● ●  NHẬT KÝ HOẠT ĐỘNG ───────────────  19/19  [Xóa] ┐
│ [ $ ] Sẵn sàng — bấm Quét nhiệm vụ để bắt đầu.          │
│ [ .. ] Đang nạp nhiệm vụ  ▓▓▓▓▓▓▓░░░░░░░░░  47%   9/19  │
│ [ ok ] Đã nạp 19 nhiệm vụ (2.0s) · 4 chưa làm · …       │
│ [ orb ] Đã nhận "ROR2 Hallowed Concepts" (+700 Orbs) — …│
└──────────────────────────────────────────────────────────┘
```

- Mỗi dòng **tự gõ** từng ký tự (9ms/ký tự), xếp hàng tuần tự (`typeQueue`) → không chồng chữ.
- **Caret nhấp nháy `▋`** ở dòng đang gõ (`.u229-line.is-typing::after`).
- **Nhãn trạng thái** `[ ok ]` `[ !! ]` `[ orb ]` `[ $ ]` → **màu không phải chỉ báo duy nhất** (đúng luật A11y).
- Namespace `.u229`; lớp `--ux-*` map từ token app (`--well`, `--fg`, `--line`…) → **không hardcode hex rời rạc**.

**Tiến trình quét = MỘT dòng terminal** (không còn loader nổi, không snake):
- Thanh khối ASCII `▓▓▓▓░░░░░░░░░░░░` + `%` + `N/M`, cập nhật theo sự kiện thật.
- Khi đang chạy luôn giữ **ít nhất 1 ô sáng** → thấy chuyển động ngay cả ở 0%.
- Xong → 1 dòng tĩnh `[ ok ] Đã nạp N nhiệm vụ (Xs) · …` rồi **xoá dòng động**.

**Đã XOÁ sạch code cũ:** `.snake-spin`, `.log-loader`, `.ll-*`, `.log-line`, `.console`, `#logSpin`, `loaderTick/paintLoader/ensureLoader`.

---

## 2. Điều khiển lên CẠNH (sidebar)

- `#btnScan` / `#btnStart` / `#btnStop` **dời vào `.side-actions`** (đầu cạnh sidebar), giữ nguyên ID + icon + handler.
- Dưới lưới quest **chỉ còn nhiệm vụ** (xoá `.quest-actions`).
- Nút đang chạy có `.is-busy` (viền xanh + nhãn), không chỉ dựa vào màu.

---

## 3. Cài đặt — chế độ Sáng hết chìm

- `guide-box`, `btn-copy-script`, `step-num` trước hardcode `rgba(139,92,246,…)` (tím mờ) → nay **token hoá**.
- **Xoá** dòng hint "Chế độ Sáng giữ nguyên màu sắc, không bị chìm."
- Đo WCAG: **42/42 mẫu ≥ 4.5:1**; các mục từng chìm nay đạt: `guide-header 7.47`, `step-num 7.47`, `step-item 8.78`.

---

## 4. Avatar mặc định Discord

- Account **không có avt** → ảnh `cdn.discordapp.com/embed/avatars/<(id>>22)%6>.png`, nền dự phòng `#5865f2` (blurple mặc định Discord) — **KHÔNG tím thương hiệu**.
- Áp cho cả 3 khung: chip sidebar (`.up-avatar`), popup (`.dp-avatar`), hero (`.ph-avatar`) qua class `.is-default`.
- Tên/khung **không còn bị chìm** (đã đo contrast).

---

## 5. Học từ repo `discord-quest-helper-main` (task 33)

- Repo dùng **CDP vào Discord thật**; phần đáng học nhất ở lớp DỮ LIỆU:
  **`discord_api.rs::get_quest_progress`** — nếu `user_status.progress` rỗng thì đọc
  `user_status.stream_progress_seconds`.
- **Đã adopt:** `src/questManager.ts::getTaskProgress` giờ fallback `stream_progress_seconds`
  → tiến độ "Chưa làm" không bị hiển thị **0% sai** khi Discord không trả `progress`.
- Phân loại 3 tab đã **đúng luật dự án** từ trước (`todo=!completed_at`, `claimable=completed_at&&!claimed_at`, `claimed=completed_at&&claimed_at`) — giữ nguyên, nay chính xác hơn nhờ fallback tiến độ.

---

## 6. Fallback per-quest "Mở Discord để nhận" (task 34)

Kiểm chứng thật: nút `claim → open`, nhãn **"Mở Discord để nhận"**, bấm gọi `openQuest('w1')` (KHÔNG claim lại). Markup/class giữ nguyên.

---

## 7. hsw.js + phiên captcha hết hạn (task 35)

- **hsw.js `is not a function`**: đã xác định từ Wave 35 (do `sandbox:true`); nay thêm **lọc ồn** ở `main.js` — worker hCaptcha tự khởi động lại ném TypeError **không gây chết app, không làm hỏng quest** (claim vẫn 200).
- **"dead link / phiên captcha hết hạn"**: token hCaptcha passive sống rất ngắn; trước đây chỉ báo lỗi. Nay `expired-callback` gọi **`hcaptchaRecover()`** → tự reset + execute lại + chạy lại vòng auto-submit, chống lặp vô tận bằng `captchaCtx.recovering`.

---

## 8. Bằng chứng đo được

| Hạng mục | Kết quả |
|---|---|
| `tools/validate-ui.js` | **199/199**, 0 id thiếu, HTML cân bằng |
| `tsc -p tsconfig.build.json` | **exit 0** |
| `tools/cdp-selftest.js` | **13 pass / 0 fail** |
| `tools/contrast-audit.js` (Sáng) | **42/42 mẫu ≥ 4.5:1** |
| `tools/probe-terminal.js` | bar `0→25→75→100%`, count `0/40→40/40`, chạy cả khi reduced-motion |
| Self-typing | độ dài tăng dần, caret `▋`; reduced-motion → hiện nguyên dòng |
| `tools/e2e-live.js` (boot thật) | terminal ✓, nút ở sidebar ✓, không loader cũ ✓, **0 JS error** |
| `tools/probe-open.js` | per-quest `claim→open`, gọi `openQuest`, không claim lại |

### ⚠️ Giới hạn thật (không tô hồng)
**Không thể quét thật trên account của bro từ shell agent**: DPAPI/safeStorage báo
`Error while decrypting the ciphertext` (ciphertext mã hoá ở phiên đăng nhập Windows của bro,
khác phiên agent) → token không giải mã được ⇒ nút Quét bị `disabled` đúng như thiết kế.
Đã kiểm tra chuỗi này độc lập (`AVAIL:true, DEC_LEN:0`).
**⇒ Bro tự chạy `npm run dev` trên máy để xác nhận quét thật + 3 tab.**

Máy test **bật sẵn reduce-motion**, nên nhánh gõ dần được chứng minh bằng shim `matchMedia` (kết quả tăng dần như trên).
