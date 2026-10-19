# ⚡ AUTO-QUEST PRO (Multiplatform Edition)

[![Release](https://img.shields.io/github/v/release/duyzoz/AUTO-QUEST?color=ff9e64&label=Version)](https://github.com/duyzoz/AUTO-QUEST/releases)
[![Platform](https://img.shields.io/badge/Platforms-Windows%20%7C%20iOS%20TrollStore-10b981)](#)
[![Theme](https://img.shields.io/badge/Theme-Dark%20Strong%20Vesper-e0af68)](#)

> ## 🤖 LƯU Ý CHO AI AGENT (BẮT BUỘC ĐỌC TRƯỚC KHI VIẾT/SỬA CODE)
> Trước khi viết hoặc sửa bất kỳ dòng code nào trong repo này, agent **PHẢI đọc hết README này** và mục **`---- Log AI Agent ----`** ở cuối file để nắm bối cảnh: đã làm gì, đang làm dở gì, quy ước gì. Không đọc trước = làm lệch kiến trúc. Sau khi hoàn thành nhiệm vụ, agent **PHẢI ghi log ngắn gọn** vào mục Log AI Agent (và `.brain/` theo ngày) — tối đa 3–5 dòng, tiết kiệm token, ghi rõ model + việc đã làm + việc còn dở.

Hệ thống tự động cày nhiệm vụ Discord (Discord Quests) và cày **Discord Orbs** đa nền tảng:
- 🖥️ **Windows Desktop:** Ứng dụng Portable EXE (`AUTO-QUEST.exe`) gọn nhẹ, không cần cài đặt.
- 📱 **iOS Mobile (TrollStore):** Ứng dụng Native iOS tương thích từ **iOS 15.0+** (đặc biệt tối ưu riêng cho **iPhone 7 Plus chạy iOS 15.8.8** và các dòng tai thỏ / Dynamic Island), cài qua **TrollStore** vĩnh viễn không bao giờ bị thu hồi chứng chỉ (No Revoke/No 7 days).

---

## 🎨 Giao Diện & Tính Năng Đột Phá

| Tính năng | Mô tả chi tiết |
|-----------|----------------|
| **Dark Strong Vesper** | Nền đen tuyền OLED `#000000`, bề mặt bo tròn than/nâu `#100d14`, điểm nhấn màu hổ phách/đồng `#ff9e64`. |
| **Account Chip Login** | Nút đăng nhập góc phải trên: dán token là tự xác thực qua `discord.com/api` → hiện `@username` + avatar thật từ Discord CDN. |
| **Quét trước — Chạy sau** | Bấm **Quét nhiệm vụ** để lấy danh sách → tab **"⏳ Chưa làm"** (khung viền đỏ, có ô tích từng nhiệm vụ + **Chọn tất cả**) → bấm **Auto ORBs (N)** để chạy đúng những gì đã chọn. |
| **Tab "✅ Đã làm"** | Nhiệm vụ hoàn thành tự chuyển tab, xanh đẹp, dấu tích ✓ — chỉ hiện nhiệm vụ gần đây, không sổ lại nhiệm vụ cũ. |
| **Orbs chuẩn 100%** | Số Orb cộng đúng một lần mỗi nhiệm vụ (dedupe theo quest id), không cộng ảo khi quét lại. |
| **Bảo mật tuyệt đối 100%** | Kết nối trực tiếp 100% tới Discord API (`discord.com`). **Chặn đứng hoàn toàn** mọi webhook hay endpoint bên ngoài. Không lưu token trên bất kỳ server nào. |
| **Lưu Token an toàn** | Nút **"💾 Lưu"** lưu token vào máy (mã hóa Windows DPAPI). Mở lại app token tự động nạp, có nút `👁️` ẩn/hiện. |
| **Treo AFK Loop** | Chế độ tự động đếm ngược chu kỳ 15, 30, 60 phút để quét và làm nhiệm vụ mới. |
| **🌙 Màn hình Treo Pin (iOS)** | Chế độ OLED Saver giữ app hoạt động liên tục qua đêm với 0% hao pin. |
| **Hỗ trợ đầy đủ nhiệm vụ** | Tự động làm nhiệm vụ Video, Game Heartbeat, Activity, quét nhiệm vụ bổ sung (excluded quests) và tự nhận quà (Claim Reward). |

---

## 📥 TẢI VỀ CÀI ĐẶT

### 🖥️ 1. Dành cho Windows Desktop:
- Vào mục **[Releases](https://github.com/duyzoz/AUTO-QUEST/releases)** trên GitHub.
- Tải file **`AUTO-QUEST.exe`**.
- Mở file lên, dán token Discord và bấm **BẮT ĐẦU TREO ORB**.

### 📱 2. Dành cho iPhone (TrollStore):
- Vào mục **[Releases](https://github.com/duyzoz/AUTO-QUEST/releases)** hoặc tab **[Actions](https://github.com/duyzoz/AUTO-QUEST/actions)**.
- Tải file **`AUTO-QUEST-PRO-TrollStore.ipa`**.
- Mở file `.ipa` trên iPhone bằng **TrollStore** ➔ Bấm **Install** là xong (chạy vĩnh viễn không lo hết hạn).

---

## 🔑 HƯỚNG DẪN LẤY TOKEN DISCORD

### Cách 1: Trên Máy Tính (Console)
1. Mở Discord trên trình duyệt (Web hoặc Desktop App), bấm `F12` (hoặc `Ctrl + Shift + I`) để mở Developer Tools.
2. Chọn tab **Console**.
3. Nếu Discord chặn dán, gõ chữ: `allow pasting` rồi bấm **Enter**.
4. Dán đoạn mã sau vào bấm **Enter**:
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
Token sẽ tự động copy vào bộ nhớ tạm. Quay lại app bấm **Dán** ➔ Bấm **Lưu**!

### Cách 2: Trên iPhone (Safari)
Trong app đã có sẵn nút **"📋 COPY SCRIPT LẤY TOKEN DISCORD"**:
1. Mở **Safari** vào `discord.com/app` đăng nhập nick của bạn.
2. Mở app bấm **COPY SCRIPT LẤY TOKEN**.
3. Trên thanh địa chỉ Safari, gõ `javascript:` rồi dán script vào bấm **Đi (Enter)**.
4. Script sẽ trích xuất token vào Clipboard và hiện popup thông báo thành công.
5. Quay lại app bấm **Dán** ➔ Bấm **Lưu Token**!

---

## 📜 Giấy phép & Tuyên bố miễn trừ trách nhiệm
Dự án được xây dựng phục vụ mục đích học tập và tối ưu trải nghiệm cá nhân. Không liên kết chính thức với Discord Inc.

---

## ---- Log AI Agent ----

> Agent đọc mục này TRƯỚC khi code. Ghi log ngắn gọn (3–5 dòng) sau mỗi đợt làm việc. Log chi tiết theo ngày nằm trong `.brain/`.

- **[2026-10-19 ~19:00 · GLM (Z.ai) · Wave 3 HOÀN THÀNH]** Fix orbs cộng ảo (dedupe quest id, bỏ fallback 300), thêm event `quest:inventory`/`scan:complete`/`quest:redeem` + id cho mọi event; bot tách MODE `scan`/`run`/`full` + pacing chậm (enroll 3s, heartbeat 25s) chống rate-limit; UI mới: account chip login góc phải trên (dán token tự xác thực, hiện @user + avatar CDN), tab "Chưa làm" viền đỏ + checkbox từng nhiệm vụ + Chọn tất cả + nút Auto ORBs(N), quest card update theo node, log tự tắt auto-scroll khi cuộn lên, CSS `.invalid` + responsive <900px + focus states + reduced-motion; dọn repo: `build-ipa/` → `build-release/build-ipa/`, docs → `docs/`. **Đang dở:** chạy `npm run dev` xem giao diện, chưa build EXE (chờ lệnh chủ), chưa push (chờ lệnh).
- **[2026-10-19 ~18:30 · GLM (Z.ai) · Audit]** Đọc toàn bộ repo, lập danh sách 13 lỗi UI/UX + logic, đề xuất Wave 3A/3B/3C/4. Không sửa code.
