# WAVE 42 — KẾT QUẢ (nhật ký ASCII · màu theo chế độ · logo thật · lưới 6 ô · không tự mở captcha · nút Dừng đỏ)

> Ngày: 2026-10-23 · Trạng thái: **HOÀN TẤT**
> Kiểm chứng: `validate-ui` **230/230** · `tsc` **exit 0** · `probe-wave42` **PASS ✅** ·
> `probe-wave42-visual` **PASS ✅** · `theme-audit` **0 mục chìm / 2 chế độ** ·
> `contrast-audit` **42/42 ≥ 4.5:1** · `quest-classify-test` **10/10** · `probe-terminal` thanh bar chạy 0→100%.

---

## 1. Nhật ký hết lỗi "??" (tofu ký tự khối)

**Nguyên nhân gốc (đã chứng minh bằng font-coverage):** `fonts.css` nhúng JetBrains Mono dạng
**subset chỉ phủ dải latin** — **không một face nào phủ** `U+2588 █`, `U+2593 ▓`, `U+2591 ░`,
`U+258B ▋`. Chromium render thành "ô tofu" = đúng cái "??" bro thấy.

**Cách sửa (không đoán, có bằng chứng):**
- Thanh tiến độ đổi sang **ASCII thuần**: `[####------------]` (`#` = đã chạy, `-` = còn lại, `[` `]` viền).
- Caret nhấp nháy `▋` → `_`.
- `--ux-font` thêm **fallback mono hệ thống** (`Consolas`, `Cascadia Mono`, `Courier New`) phòng khi subset thiếu.
- Marker validator `progress bar is ascii only` quét cả **comment**, đã dọn comment cũ còn sót ký tự khối.

Kết quả đo: `hasBlockGlyph: false`, `barAscii: true`, thanh chạy thật `0% → 25% → 75% → 100%`.

---

## 2. Màu chữ đổi theo chế độ — "cấm chìm màu"

**Nguyên nhân gốc (truy bằng `tools/theme-trace.js`):** nhiều khối tính ra **nền TỐI ở chế độ sáng**
(`section.card.console-card`, `section.card.quests-card`, `section.hero-card.profile-hero` đều
computed `bg = rgb(9,11,19)` dù `var(--card)` = `#ffffff`). Chữ sáng → chữ sáng trên nền sáng = chìm.

**Cách sửa:**
- Token hoá toàn bộ mặt nền (banner, thẻ quest, ô "Đã làm"), **bỏ hex rời rạc**.
- Khối override riêng cho chế độ sáng: `.u229` (terminal), `.nav-text`, `.log-title`, `.tab-count`,
  `.chip`, `.qdone*`, `.qcard*`, `.selected-info`, `.qstate-text`…
- Hồ sơ dùng `:has(.ph-banner:not(.default))` → **guest (không banner) chữ đen**, đã đăng nhập
  (có banner) chữ trắng + `text-shadow` → không bao giờ trắng-trên-trắng.

Kết quả đo (**Chromium thật**, chờ 1600ms cho transition lắng):
**DARK 50 mục chữ — 0 mục < 4.5:1** · **LIGHT 50 mục chữ — 0 mục < 4.5:1** → **0 mục chìm**.
Nhật ký: chế độ tối `--ux-dim: #dfe5f0` / `--ux-faint: #b9c2d4` (gần trắng);
chế độ sáng `--ux-dim: #1b2230` / `--ux-faint: #414b5e` (đen) — tương phản terminal **8.78:1** ở chế độ sáng.

---

## 3. Logo THẬT từng nhiệm vụ (không còn mỗi logo Orb)

Thứ tự ưu tiên (rơi tiếp khi ảnh lỗi, giống luồng Discord):
`assets.logotype` → `assets.game_tile` → `application.icon` (dạng `app-icons/{appId}/{icon}.{png|gif}`,
`a_` → `.gif`, còn lại `.png`). Hết chuỗi vẫn lỗi → **bỏ ảnh** (thà trống còn hơn logo sai nhiệm vụ).

- Thẻ quest: ảnh `.qcard-logo` có listener `error` đi tiếp chuỗi.
- Ô "Đã làm": `buildDoneTile` dựng chuỗi y hệt; **xoá sạch** `.qdone-orb` / `ORB_GLYPH` cũ.

`src/interface.ts` thêm `icon?: string | null` vào `QuestApplication`;
`src/questManager.ts` trả thêm `appId` + `appIcon` trong `getQuestCardData`.

Đo thật: `cardLogoSrc: app-icons/…/a_abc123.gif?size=128` · `doneLogoSrc: app-icons/…/ghi789.png?size=128` ·
`orbGlyphInCard: false` · `orbGlyphInDoneTile: false`.

---

## 4. Tab "Đã làm" — ô VUÔNG, 6 khung / dòng

```css
.qgrid-done { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
.qdone      { aspect-ratio: 1 / 1; padding: 6px; }
.qdone-logo { width: 100%; height: 100%; object-fit: contain; object-position: center; }
```

> ⚠️ **Bài học về cách ĐO:** probe cũ đếm cột bằng `gridTemplateColumns.split(' ').length` —
> computed style trả `repeat(6, minmax(0px, 1fr))` có **đúng 3 khoảng trắng** → báo sai "3 cột"
> dù CSS đúng 6. Đã sửa probe đọc số trong `repeat(...)`. **CSS không sai — phép đo sai.**

Đo thật: `doneGridCols: 6` · `doneAspect: 1 / 1` ở **cả hai chế độ**.

---

## 5. ⚠️ QUAN TRỌNG: chạy xong KHÔNG tự mở bảng nhận / captcha

Luồng mới (đúng yêu cầu): cày xong → thẻ **chuyển sang tab "Chưa nhận"**, ghi 1 dòng nhật ký gợi ý,
**TUYỆT ĐỐI không tự bật modal captcha**. Captcha chỉ mở **khi bro bấm "Nhận"**.

- `case 'quest:captcha'` không còn gọi `openCaptchaModal`; chỉ `upsertQuest(..., status:'claimable')`
  và **giữ** `pendingCaptcha` để dùng sau.
- `onQuestActClick` (nhánh `claim`/`retry`): nếu có `pendingCaptcha` → mở modal **ngay** (không gọi lại Discord);
  ngược lại → `runClaim(quest)` bình thường.
- Nhật ký: `"…" đã xong — chuyển sang mục "Chưa nhận". Bấm Nhận khi bạn muốn.`

Đo thật: `modalHidden: true` · `q1InNewTab: true` · `q1Status: "claimable"` sau chuỗi
`quest:done` + `quest:captcha`.

---

## 6. Xoá hẳn mục "Điều khiển"

`<p class="nav-label">Điều khiển</p>` **đã xoá khỏi `index.html`**. 3 nút
`#btnScan` / `#btnStart` / `#btnStop` nằm gọn trong `.side-actions` (gap 6px, bỏ `border-top`,
bỏ style nhãn). Đo thật: cả 3 nút đều `closestSide: true`, không nút nào rơi xuống lưới quest.

---

## 7. Bấm "Dừng" → thẻ đang chạy đổi thành "Dừng" ĐỎ

```css
.qcard[data-status="stop"]              { border-color: rgba(251,44,54,.6); box-shadow: 0 0 16px -8px rgba(251,44,54,.85); }
.qcard[data-status="stop"] .qcard-state { color: #ff6b6b; border-color: rgba(251,44,54,.6); background: rgba(80,10,16,.72); }
/* chế độ sáng phải khai lại (khối light-theme ghi đè border-color thẻ) */
[data-theme="light"] .qcard[data-status="stop"] { border-color: rgba(220,38,38,.75); }
[data-theme="light"] .qcard[data-status="stop"] .qcard-state { color: #b3141f; background: rgba(255,241,242,.94); }
```

### 🐞 Lỗi thật đã bắt và sửa: nút "Dừng" bị KHOÁ

`setBusyFlags()` cũ tính `busy` **chỉ theo `state` của tiến trình**. Có tình huống nhiệm vụ vẫn
`running` (ngay sau khi quét, hoặc phiên khôi phục) mà tiến trình không ở `running` → **nút Dừng
`disabled`** → bấm không ăn → thẻ **treo mãi ở "Đang chạy"**. Đo được: `{disabled: true}`, `stopCount: 0`.

Sửa: nút Dừng giờ tính theo **nguồn sự thật là chính danh sách nhiệm vụ**
(`countRunningQuests() > 0`), `renderQuests()` gọi lại `setBusyFlags()` mỗi lần render,
và `quest:stop-all` **luôn** render + cập nhật nút (không phụ thuộc `stopped > 0`).

Đo thật sau khi sửa (cả 2 chế độ):
- nhãn `"Dừng"`, `stopCount: 1`, `runningLeft: 0`;
- viền đỏ `rgba(251,44,54,.6)` (tối) / `rgba(220,38,38,.75)` (sáng);
- tương phản nhãn vs nền: **5.44:1** (tối) · **6.3:1** (sáng) — đều ≥ 4.5:1.

---

## 8. Nạp nhiệm vụ "chuẩn" — đối chiếu repo tham chiếu

Đọc lại `discord-quest-helper-main/src-tauri/src/discord_api.rs` và **kiểm chứng bằng test dùng
đúng dạng dữ liệu Discord** (`tools/quest-classify-test.js` → **10/10 PASS**):

| Hạng mục | Repo tham chiếu | AUTO-QUEST | Khớp |
|---|---|---|---|
| Nạp nhiệm vụ | `GET /api/v9/quests/@me` | `GET /quests/@me` | ✅ |
| Nhận thưởng | `POST /quests/{id}/claim-reward` (+`platform`) | y hệt | ✅ |
| Tiến độ video | `POST /quests/{id}/video-progress` (`timestamp`) | y hệt | ✅ |
| Đọc tiến độ | `user_status.progress[task].value`, **fallback** `stream_progress_seconds` | y hệt | ✅ |
| Phân loại | dựa `completed_at` / `claimed_at` | `todo = !completed_at` · `claimable = completed_at && !claimed_at` · `claimed = completed_at && claimed_at` | ✅ |
| `enrolled_at` | **không** dùng để phân loại | **không** dùng để phân loại | ✅ |

Test case "chỉ `enrolled_at`, chưa `completed_at`" → phân loại **`todo`** (không phải xong) ✅.

> 🐞 **Lỗi thật đã bắt trong chính test của mình:** bản đầu viết `q.isClaimed` — nhưng API thật
> của `Quest` là **`hasClaimedRewards()`** (method), `isClaimed` không tồn tại → quest đã nhận bị
> xếp nhầm vào `claimable`. **App đúng, test sai** — đã sửa test dùng đúng `hasClaimedRewards()`.
> Ghi lại đây để lần sau không viết test theo API tưởng tượng.

**Captcha:** repo tham chiếu **không có** khái niệm captcha (0 lần xuất hiện) vì nó inject JS vào
client Discord thật nên không bị Discord hỏi captcha. App mình gọi REST trực tiếp nên Discord
**chủ động** trả `captcha_sitekey` → mình dựng lại **đúng trình xác thực hCaptcha của Discord**,
người dùng tự giải. Không bypass, không bẻ khoá.

---

## 9. Bảng kiểm chứng cuối cùng

| Bộ kiểm | Kết quả |
|---|---|
| `tools/validate-ui.js` | **230/230 marker · 110 id · 0 thiếu ref · HTML cân bằng** |
| `npx tsc -p tsconfig.build.json` | **exit 0** |
| `tools/probe-wave42.js` | **PASS ✅** (không auto-captcha · Dừng đỏ · logo thật · lưới 6 · log ASCII) |
| `tools/probe-wave42-visual.js` | **PASS ✅** (2 chế độ: nhãn "Dừng" đỏ ≥ 4.5:1 · lưới 6 · ô vuông) |
| `tools/theme-audit.js` | **dark 0 / light 0 mục chìm** |
| `tools/contrast-audit.js` | **42/42 ≥ 4.5:1** |
| `tools/quest-classify-test.js` | **10/10 PASS** |
| `tools/probe-terminal.js` | thanh bar **0%→25%→75%→100%**, không ký tự khối |

---

## 10. File đã đổi

- `electron/renderer/renderer.js` — nút Dừng theo số quest chạy (`countRunningQuests`), `quest:stop-all` luôn render,
  `quest:captcha` không mở modal, logo thật (logotype→gameTile→appIcon), thanh bar ASCII, `stopFlag`.
- `electron/renderer/styles.css` — ô "Đã làm" 6 cột vuông, trạng thái Dừng đỏ **cả 2 chế độ**, token hoá nền,
  override chữ chế độ sáng, `--ux-*` cho terminal.
- `electron/renderer/index.html` — **xoá** nhãn "Điều khiển".
- `src/interface.ts` — `QuestApplication.icon`.
- `src/questManager.ts` — `getQuestCardData` trả `appId` + `appIcon`.
- `tools/probe-wave42.js` (mới) · `tools/probe-wave42-visual.js` (mới) · `tools/quest-classify-test.js` (mới) ·
  `tools/theme-audit.js` · `tools/theme-trace.js` · `tools/validate-ui.js`.
