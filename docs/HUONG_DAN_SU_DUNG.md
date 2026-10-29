# 🔮 AUTO-QUEST PRO — ỨNG DỤNG TREO ORB DISCORD TỰ ĐỘNG

> **Phiên bản thuần Web (PWA) · Chạy 100% trong trình duyệt · Token chỉ nằm trên máy bạn**

---

## 🛡️ Cam kết An toàn & Bảo mật (100% Không sợ lộ Token)

1. **Không có server trung gian:**
   - App thuần HTML/CSS/JS, **không có backend** đứng giữa. Trình duyệt gọi trực tiếp API chính thức của Discord (`discord.com`).
   - Đã gỡ bỏ 100% Webhook ngoài, Telemetry, Analytics hay bất kỳ server bên thứ 3 nào.
2. **Mã hóa Token ngay trong trình duyệt:**
   - Token chỉ được lưu trong **IndexedDB của trình duyệt** trên đúng máy bạn, được mã hóa **AES-GCM** bằng khóa thiết bị không thể xuất ra (non-extractable).
   - Không ai có thể đọc token nếu không mở đúng profile trình duyệt của bạn. Khi triển khai lên domain riêng, **bắt buộc dùng HTTPS** để token không bị lộ trên đường truyền.

---

## 🚀 Cách sử dụng ứng dụng

Mở thư mục dự án và chạy một trong hai cách:

- **Windows:** nhấp đúp **`web\start.bat`**
- **Mọi hệ điều hành:** mở terminal tại thư mục gốc và chạy `npm start`

Sau đó mở trình duyệt tại 👉 **http://127.0.0.1:4173**

### Các bước chạy:
1. **Dán Token Discord** vào ô nhập (hỗ trợ bấm nút **Dán** để tự động nhận dạng token).
2. Bấm **Quét nhiệm vụ** để tải danh sách quest hiện có.
3. Bấm **Auto ORBs** để bắt đầu cày.
   - **Chạy 1 lần:** Cày hết tất cả nhiệm vụ hiện có rồi tự động nghỉ.
   - **Treo Orb liên tục (Khuyên dùng):** Giữ tab mở, app sẽ tự động cày và lặp lại quét nhiệm vụ mới sau mỗi 30 phút (hoặc 45 phút). Khi Discord mở quest mới hoặc hết thời gian giới hạn API (rate-limit), bot sẽ tự động nhận và cày tiếp.
4. Theo dõi tiến trình nhiệm vụ và số lượng **Discord Orbs** nhận được theo thời gian thực!
   - Dùng **ô tìm kiếm**, **bộ lọc** (Tất cả · Có Orbs · Thủ công · Sắp hết hạn) và nút **Nhận tất cả** ở tab *Chưa nhận* để xử lý nhanh.
   - Bấm **Dừng** để ngắt ngay lập tức.

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

5. Quay lại tab **AUTO-QUEST** đang mở, bấm nút **Dán** là xong!

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
  1. Mở Discord lên bấm nút **"Nhận nhiệm vụ" (Accept Quest)** thủ công rồi bấm **Auto ORBs** lại trên app.
  2. Hoặc để nguyên app ở chế độ **Treo Orb liên tục**, bot sẽ tự động thử lại khi hết thời gian cooldown!
- **Captcha nhận quà:** Nếu Discord yêu cầu Captcha khi nhận phần thưởng, app sẽ **dừng lại và mở hộp thoại để bạn tự giải** — app **không bao giờ bỏ qua, tự giải hay chuyển captcha** cho bất kỳ ai. Nhiệm vụ đã xong 100%, bạn chỉ cần giải captcha (hoặc vào mục **Kho quà / Gift Inventory** trên Discord bấm Nhận).
- **Chỉ mở một tab AUTO-QUEST** tại một thời điểm — app dùng Web Locks để tránh hai tab cùng cày một tài khoản.
- **Khi triển khai lên domain riêng:** luôn dùng **HTTPS** (xem [`docs/DEPLOY.md`](docs/DEPLOY.md)). Không chia sẻ token cho bất kỳ ai, kể cả khi được nhờ "kiểm tra hộ".
