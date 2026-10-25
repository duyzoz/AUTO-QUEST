---
name: auto-quest-knowledge
description: >
  Bộ tri thức đúc kết cho dự án AUTO-QUEST — gồm 3 nguồn sự thật: (1) UI/UX Pro Max
  design intelligence (style, màu, font, UX guideline, tương phản WCAG), (2) Kasumu UI
  design system tham chiếu (token màu dark-first, typography, bố cục, animation),
  (3) Discord Quest Engine (API endpoint, cờ phân loại quest, header giả mạo client,
  thuật toán chống gian lận). Dùng khi: thiết kế/sửa UI, thêm theme sáng-tối, tra
  tương phản màu, làm việc với Discord Quest API, sửa logic bot, hoặc cần tra cứu
  quy ước thiết kế đã chốt của dự án.
---

# AUTO-QUEST KNOWLEDGE — Bộ tri thức đúc kết

Đây là **skill nội bộ dự án AUTO-QUEST**, chứa toàn bộ tri thức đúc kết từ 3 repo
nguồn. Đọc file phù hợp với việc đang làm **trước khi** viết code.

## Cấu trúc

```
auto-quest-knowledge/
├── SKILL.md                          # File này — chỉ mục + luật cứng
├── 01-ui-ux-pro-max.md               # Design intelligence: tra cứu style/màu/UX
├── 02-kasumu-ui.md                   # Design system tham chiếu: token, layout, animation
└── 03-discord-quest-engine.md        # Discord API: endpoint, cờ phân loại, thuật toán
```

## Khi nào đọc file nào

| Việc đang làm | Đọc |
|---|---|
| Thiết kế/sửa giao diện, chọn màu/font/style | `01-ui-ux-pro-max.md` |
| Kiểm tra tương phản, thêm theme sáng/tối, sửa "chìm màu" | `01` §4 + `02` §8 |
| Cần token màu / bo góc / typography / animation của dự án | `02-kasumu-ui.md` |
| Sửa bố cục sidebar/nav/card/control | `02` §4–§6 |
| Làm việc với Discord Quest API (fetch, enroll, claim, progress) | `03-discord-quest-engine.md` §2–§3 |
| Sửa logic phân loại quest (tab Chưa làm / Chưa nhận / Đã nhận) | `03` §4 |
| Sửa bot bị chặn / 401 / 403 khi gọi Discord | `03` §7 |
| Quest video/stream/heartbeat chạy sai | `03` §6 |
| Gặp lỗi lạ, cần tra triệu chứng → nguyên nhân | `03` §10 |

## ⭐ 10 LUẬT CỨNG của dự án (rút từ 3 nguồn + kinh nghiệm thực chiến)

1. **Tương phản chữ ≥ 4.5:1** (WCAG AA) ở CẢ hai theme. Chữ lớn/icon mang nghĩa ≥ 3:1.
   Đo bằng số thật, không đoán. (`01` §4)

2. **Token hoá toàn bộ bề mặt.** KHÔNG hardcode `rgba(255,255,255,…)` hay `#07090e`
   rải rác — đó là gốc rễ của "chìm màu" khi đổi theme. Dùng `--tint-*`, `--hairline`,
   `--bg-base`, `--well`. (`02` §8)

3. **Không viết `*/` trong comment CSS.** Nó đóng comment sớm và **nuốt luôn rule bên
   dưới** mà không báo lỗi. Luôn kiểm tra comment cân bằng. (`02` §8)

4. **Chuyển trạng thái phải hủy/hoàn tất được.** Không để UI treo giữa transition —
   gắn class TRƯỚC khi chèn media, ép hiện tức thì, rồi khôi phục transition qua
   double-`requestAnimationFrame`. (`01` §6)

5. **Tôn trọng `prefers-reduced-motion`** nhưng **ĐỪNG tắt tín hiệu tiến trình**
   (thanh nạp, spinner). Chỉ tắt hiệu ứng trang trí. (bài học Wave 25)

6. **Phân loại quest đúng 3 cờ:** `todo = !completed_at` ·
   `claimable = completed_at && !claimed_at` · `claimed = completed_at && claimed_at`.
   **KHÔNG** dùng `enrolled_at` để phân tab. (`03` §4)

7. **Luôn lọc quest rác:** bỏ `excluded_quests`, `preview === true`, `isExpired()`. (`03` §3)

8. **Header giả mạo client là bắt buộc:** bỏ tiền tố `Bot ` khỏi `Authorization`, gửi
   đủ `sec-fetch-*` + `x-super-properties` (base64 của `CLIENT_PROPS`), override
   `fetchGatewayInformation`. (`03` §7)

9. **Chống gian lận tiến trình video:** `maxAllowed = (Date.now() - enrolledAt)/1000 + 10`,
   chỉ gửi khi `diff >= 7`, sleep 1s/nhịp, bước nhảy 7s + `Math.random()`. (`03` §6.1)

10. **`Promise.allSettled`** khi chạy nhiều quest — 1 quest lỗi không được giết cả mẻ.
    (`03` §8)

## Quy ước dự án đã chốt

- **Accent:** tím `#8b5cf6` (dark) → `#6d3ff0` (light, đậm hơn để đủ tương phản).
- **Bo góc:** field `0.75rem` · card `1.125rem` · hero `1.5rem`.
- **Font:** Inter (UI) + JetBrains Mono (số liệu/log/id). Self-host woff2, chạy offline.
- **Nền:** 3 lớp — base `#07090e` + 2 glow lệch màu 8% + overlay 50%.
- **Sidebar:** 256px cố định, active = nền `white/8` + thanh 3px `brand-bright`.
- **Animation:** duration 150–180ms, dịch chuyển ≤ 10px, nhấn `scale(0.98)`.
- **Theme:** qua `data-theme="light"` trên `<html>` + CSS custom properties.
- **Log màu (light):** ok `#067647` · warn `#a15c07` · err `#c11d2b` · orb `#6d3ff0`.
- **Màu log (dark):** ok `#3fd07a` · warn `#ffce4d` · stderr `#ff6b6b` · orb `#b79dff`.

## Nguồn gốc (KHÔNG xoá — là source chính)

| Repo nguồn (ngoài `AUTO-QUEST-main/`) | Vai trò |
|---|---|
| `../ui-ux-pro-max-skill-main/` | Design intelligence toolkit (NextLevelBuilder, MIT) |
| `../kasumu-ui/` | Trích xuất giao diện kasumu.cloud (tham khảo UI) |
| `../Discord-Auto-Quests-main/` | HieuTool — engine Discord Quest (© Nguyễn Mạnh Hiếu) |

> 3 thư mục trên **không được xoá**. Skill này chỉ là bản **đúc kết** để tra cứu nhanh,
> không thay thế source gốc khi cần đối chiếu chi tiết.
