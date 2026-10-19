# ⚡ AUTO-QUEST PRO (Multiplatform Edition)

[![Release](https://img.shields.io/github/v/release/duyzoz/AUTO-QUEST?color=ff9e64&label=Version)](https://github.com/duyzoz/AUTO-QUEST/releases)
[![Platform](https://img.shields.io/badge/Platforms-Windows%20%7C%20iOS%20TrollStore-10b981)](#)
[![Theme](https://img.shields.io/badge/Theme-Dark%20Strong%20Vesper-e0af68)](#)
[![Waves](https://img.shields.io/badge/Waves-4%20%C2%B7%20Active-e0af68)](#-quy-tr%C3%ACnh-waves)

> ## 🤖 LƯU Ý CHO AI AGENT (BẮT BUỘC ĐỌC TRƯỚC KHI VIẾT/SỬA CODE)
> Trước khi viết/sửa code, agent **PHẢI đọc hết README này** (mục **Quy trình Waves** + **`---- Log AI Agent ----`** ở cuối). Không đọc = làm lệch kiến trúc.
> Sau mỗi phiên: ghi **1 dòng log** vào mục Log AI Agent (model thật + việc đã làm + đang dở) và **chỉ giữ đúng 3 log gần nhất** — log cũ hơn xoá khỏi README.
> Muốn hiểu thật kĩ mọi thay đổi: đọc thư mục **`.brain/`** (log đầy đủ theo ngày `YYYY-MM-DD.txt`).
> **Ghi đúng tên model đang chạy** (VD: `deepseek-v4.1-flash`, `gemini-3.8-flash`, `claude-...`) — không copy model phiên trước, không ghi chung chung.

---

## 🌊 Quy Trình Waves (BẮT BUỘC)

Mọi phiên làm việc đều chạy theo 3 giai đoạn cố định:

```mermaid
flowchart LR
    I["🌊 Waves I<br/>Triển khai waves<br/>& nhận yêu cầu waves nhỏ"] --> II["⚙️ Waves II<br/>Coder bắt đầu làm việc"]
    II --> III["🧪 Waves III<br/>Kiểm thử — TS build pass<br/>(theo yêu cầu người dùng)"]
    III -.->|"feedback / yêu cầu mới"| I
```

| Giai đoạn | Nội dung | Ai quyết định |
|---|---|---|
| **Waves I** | Triển khai waves, tiếp nhận yêu cầu waves nhỏ từ người dùng | Người dùng + Agent |
| **Waves II** | Bắt đầu làm việc (coder) — sửa code, UI/UX, logic | Agent |
| **Waves III** | Kiểm thử — `tsc` build pass, syntax check, smoke test | Agent (theo yêu cầu người dùng) |

**Quy tắc đánh số:**
- Agent **tự gán số waves từ `0` → `∞`** theo tiến độ thực tế.
- Người dùng **yêu cầu waves** → xác định số waves theo tiến độ hiện tại.
- Người dùng **không yêu cầu** → mặc định gán **waves mới cho từng phiên edit**.

---

## 🧠 Sơ Đồ Tư Duy Dự Án

```mermaid
mindmap
  root((AUTO-QUEST PRO))
    Desktop
      Electron 38
      Quét - Chọn - Auto ORBs
      Account Chip Login
      Dark Vesper UI
    iOS TrollStore
      React Native Expo
      IPA No Revoke
      OLED Saver
    Core Bot
      TypeScript
      Discord API trực tiếp
      Quest Manager
    Bảo mật
      Token DPAPI
      Chặn endpoint ngoài
      Security Guard
```

## 🔄 Luồng Hoạt Động Chuẩn

```mermaid
flowchart TD
    A["🔑 Dán Token<br/>(tự xác thực @user)"] --> B["🔍 Quét nhiệm vụ"]
    B --> C["📋 Danh sách THẬT<br/>từ Discord API"]
    C --> D{"Phân loại theo<br/>completed_at"}
    D -->|"đã hoàn thành"| E["✅ Tab Đã làm<br/>xanh · dấu tích ✓"]
    D -->|"chưa hoàn thành"| F["⏳ Tab Chưa làm<br/>viền đỏ · checkbox"]
    F --> G["☑️ Tích chọn / Chọn tất cả"]
    G --> H["▶ Auto ORBs (N)"]
    H --> I["🎮 Cày nhiệm vụ<br/>pacing chậm chống rate-limit"]
    I --> E
    E --> J["🎁 Tự nhận thưởng"]
```

> ⚠️ **Nguyên tắc vàng:** App **KHÔNG tự nhận nhiệm vụ** (không auto-enroll). Chỉ quét danh sách thật — người dùng tự nhận nhiệm vụ trong app Discord nếu muốn, sau đó tích chọn trong app và bấm **Auto ORBs**.

## 🗺️ Hướng Đi (Roadmap)

```mermaid
flowchart LR
    W0["Waves 0<br/>Audit repo"] --> W3["Waves 3<br/>Fix orbs + UI/UX"]
    W3 --> W4["Waves 4<br/>Dữ liệu thật<br/>bỏ auto-enroll"]
    W4 --> W5["Waves 5<br/>Polish UI theo feedback"]
    W5 --> W6["Waves 6<br/>Build EXE (chờ lệnh)"]
    W6 --> W7["Waves 7<br/>Push GitHub (chờ lệnh)"]
```

---

## 🎨 Tính Năng

| Tính năng | Mô tả |
|-----------|-------|
| **Dark Strong Vesper** | Nền OLED `#000000`, bề mặt than/nâu `#100d14`, điểm nhấn hổ phách `#ff9e64`. |
| **Account Chip Login** | Dán token → tự xác thực `discord.com/api` → hiện `@username` + avatar thật từ Discord CDN. |
| **Quét trước — Chạy sau** | **Quét nhiệm vụ** lấy danh sách thật → tab "⏳ Chưa làm" (viền đỏ, checkbox từng nhiệm vụ + **Chọn tất cả**) → **Auto ORBs (N)** chạy đúng nhiệm vụ đã chọn. |
| **Không tự nhận nhiệm vụ** | App tuyệt đối không auto-enroll. Nhiệm vụ "Chưa nhận" hiển thị đúng trạng thái Discord, checkbox khoá cho tới khi bạn nhận trong app Discord. |
| **Số liệu chuẩn 100%** | "Đã làm" chỉ chứa nhiệm vụ Discord xác nhận `completed_at`; "Chưa làm" chỉ chứa nhiệm vụ còn hiệu lực (đã bắt đầu, chưa hết hạn, không preview). |
| **Orbs chuẩn** | Mỗi nhiệm vụ cộng Orbs đúng **một lần** (dedupe theo quest id), không cộng ảo khi quét lại. |
| **Bảo mật 100%** | Chỉ kết nối `discord.com` — chặn đứng mọi webhook/endpoint ngoài. Token mã hóa Windows DPAPI. |
| **Treo AFK Loop** | Tự đếm ngược chu kỳ 15/30/45/60 phút để quét lại nhiệm vụ mới. |
| **🌙 OLED Saver (iOS)** | Giữ app hoạt động qua đêm với 0% hao pin. |

---

## 📥 TẢI VỀ CÀI ĐẶT

### 🖥️ Windows Desktop
- Vào **[Releases](https://github.com/duyzoz/AUTO-QUEST/releases)** → tải **`AUTO-QUEST.exe`**.
- Mở file, dán token, bấm **Quét nhiệm vụ** → chọn → **Auto ORBs**.

### 📱 iPhone (TrollStore)
- Tải **`AUTO-QUEST-PRO-TrollStore.ipa`** từ Releases/Actions.
- Mở bằng **TrollStore** → **Install** (chạy vĩnh viễn, không hết hạn chứng chỉ).

---

## 🔑 HƯỚNG DẪN LẤY TOKEN DISCORD

### Cách 1: Máy tính (Console)
1. Mở Discord (Web/App), bấm `F12` → tab **Console**.
2. Nếu Discord chặn dán: gõ `allow pasting` rồi Enter.
3. Dán đoạn mã sau rồi Enter:

```javascript
window.webpackChunkdiscord_app.push([
	[Symbol()],
	{},
	req => {
		if (!req.c) return;
		for (let m of Object.values(req.c)) {
			try {
				if (!m.exports || m.exports === window) continue;
				if (m.exports?.getToken) return copy(m.exports.getToken());
				for (let ex in m.exports) {
					if (m.exports?.[ex]?.getToken && m.exports[ex][Symbol.toStringTag] !== 'IntlMessagesProxy') return copy(m.exports[ex].getToken());
				}
			} catch {}
		}
	},
]);
window.webpackChunkdiscord_app.pop();
console.log('%c🎉 ĐÃ COPY TOKEN DISCORD THÀNH CÔNG! 🎉', 'color: #10b981; font-size: 22px; font-weight: bold; background: #000; padding: 10px; border-radius: 8px;');
```

4. Quay lại app bấm **Dán** → chip góc phải tự hiện `@username` → **Lưu**.

### Cách 2: iPhone (Safari)
1. Safari → `discord.com/app`, đăng nhập.
2. Trong app bấm **COPY SCRIPT LẤY TOKEN**.
3. Thanh địa chỉ Safari: gõ `javascript:` rồi dán script, Enter.
4. Quay lại app bấm **Dán** → **Lưu Token**.

---

## 📁 Cấu Trúc Repo

```
AUTO-QUEST-main/
├── bot.ts                  # Entry point bot (compile → electron/bot/)
├── src/                    # Core logic TypeScript
│   ├── client.ts           # Discord REST + Gateway
│   ├── questManager.ts     # Quản lý & thực thi nhiệm vụ
│   ├── security.ts         # Chặn endpoint ngoài
│   └── ...
├── electron/               # Desktop app
│   ├── main.js             # Main process + IPC
│   ├── preload.js          # Bridge an toàn
│   └── renderer/           # UI (index.html, renderer.js, styles.css)
├── mobile/                 # iOS (React Native) — KHÔNG ĐỤNG
├── build-release/          # Script build/release (IPA, desktop)
├── docs/                   # Hướng dẫn sử dụng
├── .brain/                 # Log AI Agent theo ngày (YYYY-MM-DD.txt)
└── README.md
```

---

## 🧪 Dev Mode (xem giao diện trước khi build)

```bash
npm install        # lần đầu
npm run dev        # build bot TS + mở Electron
```

Chỉ build EXE khi có lệnh: `npm run build`.

---

## 📜 Giấy phép & Miễn trừ trách nhiệm
Dự án phục vụ mục đích học tập và tối ưu trải nghiệm cá nhân. Không liên kết chính thức với Discord Inc.

---

## ---- Log AI Agent ----

> **Luật:** chỉ giữ **đúng 3 log gần nhất** (mới nhất trên cùng). Log cũ hơn xoá khỏi README. Muốn hiểu thật kĩ mọi thay đổi → đọc **`.brain/`**. Mỗi dòng ghi **đúng model của phiên đó**.

- **[2026-10-19 ~19:55 · deepseek-v4.1-flash · Waves 4 — chuẩn hoá log]** Sửa README: log chỉ giữ 3 phiên gần nhất, thêm dòng trỏ `.brain/`, bắt buộc ghi đúng model thật từng phiên (không hardcode).
- **[2026-10-19 ~19:45 · deepseek-v4.1-flash · Waves 4 — Dữ liệu thật + bỏ auto-enroll]** Xoá `redeemPending` khỏi luồng quét/scan: quét xong dừng ngay, **không tự nhận/đăng ký nhiệm vụ**. Inventory lọc `preview` + cờ `automatable` (STREAM/loại lạ = làm thủ công). UI: chỉ còn 1 nút Auto ORBs ở khu actions; checkbox khoá với quest "Chưa nhận". **Đang dở:** chưa build EXE, chưa push (chờ lệnh).
- **[2026-10-19 ~19:00 · deepseek-v4.1-flash · Waves 3]** Fix orbs cộng ảo (dedupe quest id, bỏ fallback 300), event `quest:inventory`/`scan:complete`/`quest:redeem` + id cho mọi event; bot tách MODE `scan`/`run`/`full` + pacing chống rate-limit; UI account chip login, tab "Chưa làm" viền đỏ + checkbox + Chọn tất cả; dọn repo `build-ipa/` → `build-release/`, docs → `docs/`.
