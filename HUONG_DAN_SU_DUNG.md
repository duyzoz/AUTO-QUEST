# 🔮 AUTO-QUEST PRO — ỨNG DỤNG TREO ORB DISCORD TỰ ĐỘNG

> **Phiên bản độc quyền 100% Local · Đã cắt đứt toàn bộ Endpoint ngoài · Tuyệt đối bảo mật Token**

---

## 🛡️ Cam kết An toàn & Bảo mật (100% Không sợ lộ Token)

1. **Cắt đứt toàn bộ Endpoint trung gian:**
   - Đã gỡ bỏ 100% Webhook ngoài, Telemetry, Analytics hay bất kỳ server bên thứ 3 nào.
   - Cơ chế bảo mật `SecurityGuard` chặn đứng mọi kết nối mạng không thuộc về máy chủ chính thức của Discord (`discord.com`, `gateway.discord.gg`, `discordsays.com`).
2. **Mã hóa Token cục bộ:**
   - Token chỉ được lưu trên máy của bạn và được mã hóa bằng thuật toán **Windows DPAPI** của hệ điều hành.
   - Không ai có thể giải mã token này nếu không đăng nhập vào đúng tài khoản Windows của bạn.

---

## 🚀 Cách sử dụng ứng dụng

Chỉ cần mở thư mục **`Desktop\AUTO-QUEST`** và nhấp đúp chạy file:
👉 **`AUTO-QUEST.exe`**

### Các bước chạy:
1. **Dán Token Discord** vào ô nhập (hỗ trợ bấm nút **📋 Dán** để tự động nhận dạng token).
2. **Chọn chế độ chạy**:
   - **Chạy 1 lần:** Cày hết tất cả nhiệm vụ hiện có rồi tự động nghỉ.
   - **Treo Orb liên tục (Khuyên dùng):** Giữ app mở, ứng dụng sẽ tự động cày và lặp lại quét nhiệm vụ mới sau mỗi 30 phút (hoặc 45 phút). Khi Discord mở quest mới hoặc hết thời gian giới hạn API (rate-limit), bot sẽ tự động nhận và cày tiếp.
3. Bấm **▶ Bắt đầu Treo Orb**.
4. Theo dõi tiến trình nhiệm vụ và số lượng **Discord Orbs** nhận được theo thời gian thực!

---

## 🔑 Hướng dẫn lấy Token Discord cá nhân (Dễ nhất)

1. Mở trình duyệt (Chrome / Edge / Brave / Cốc Cốc) và vào trang web: [discord.com/app](https://discord.com/app).
2. Bấm phím **F12** (hoặc `Ctrl + Shift + I`) để mở DevTools.
3. Chuyển sang tab **Console**.
4. Dán đoạn mã sau vào rồi nhấn **Enter**:

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
console.log('%cĐã copy Token vào Clipboard thành công!', 'color: #10b981; font-size: 16px;');
```

5. Quay lại app **AUTO-QUEST**, bấm nút **📋 Dán** là xong!

---

## 🌟 Các loại nhiệm vụ được hỗ trợ tự động (Không xót quest nào)

- 🎥 **Xem video (`WATCH_VIDEO` / `WATCH_VIDEO_ON_MOBILE`):** Tự động giả lập xem video và gửi mốc thời gian hoàn thành.
- 🎮 **Chơi game PC & Console (`PLAY_ON_DESKTOP`, `PLAY_ON_XBOX`, `PLAY_ON_PLAYSTATION`):** Gửi heartbeat mô phỏng chơi game đủ thời gian yêu cầu (15-30 phút).
- 🔊 **Hoạt động Voice / Call (`PLAY_ACTIVITY`):** Giả lập hoạt động phòng thoại tự động.
- 🏆 **Thành tựu Discord Says (`ACHIEVEMENT_IN_ACTIVITY`):** Tự động xin mã quyền OAuth2, đẩy tiến độ và thu hồi quyền sạch sẽ.
- 🎁 **Nhiệm vụ phụ (`excluded_quests`):** Tự động quét và nạp cả các nhiệm vụ bổ sung mà phiên bản cũ bỏ qua.
- 🎁 **Tự động nhận thưởng (Auto Claim):** Tự động bấm Claim quà ngay sau khi xong để tích lũy Orbs vào tài khoản.

---

## ⚠️ Lưu ý quan trọng
- **Giới hạn nhận nhiệm vụ của Discord (Rate Limit):** Discord quy định mỗi tài khoản chỉ nhận được 1 nhiệm vụ mới qua API mỗi khoảng ~45 phút. Khi gặp thông báo này, bạn có thể:
  1. Mở Discord lên bấm nút **"Nhận nhiệm vụ" (Accept Quest)** thủ công rồi bấm Bắt đầu lại trên app.
  2. Hoặc để nguyên app ở chế độ **Treo Orb liên tục**, bot sẽ tự động thử lại khi hết thời gian cooldown!
- **Captcha nhận quà:** Nếu Discord yêu cầu giải Captcha khi nhận phần thưởng, nhiệm vụ đã xong 100%, bạn chỉ cần vào mục **Kho quà (Gift Inventory)** trên Discord bấm nút Nhận là được.
