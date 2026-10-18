# 📱 HƯỚNG DẪN BUILD & CÀI ĐẶT AUTO-QUEST PRO (.IPA) CHO IPHONE (TROLLSTORE)

> **Thiết bị:** Tương thích từ **iOS 15.0 trở lên** (Đặc biệt tối ưu riêng cho **iPhone 7 Plus chạy iOS 15.8.8**, các dòng iPhone 7/8/SE 16:9 và iPhone X - 16 Pro Max màn hình tai thỏ / Dynamic Island).  
> **Cài đặt qua:** **TrollStore** (Không bao giờ bị thu hồi chứng chỉ, không cần gia hạn 7 ngày).

---

## 🚀 CÁCH 1: BUILD FILE .IPA BẰNG EAS CLOUD (KHUYÊN DÙNG - 1 CLICK MIỄN PHÍ)

Hệ thống đã cấu hình sẵn toàn bộ source code React Native / Expo Native và file cấu hình `eas.json` chuẩn iOS 15.0+ cho TrollStore tại:
📂 `C:\Users\NgDuy-PC\Desktop\AUTO-QUEST-IOS`

### Các bước thực hiện:
1. Đăng ký một tài khoản Expo miễn phí tại: [https://expo.dev/signup](https://expo.dev/signup) (chỉ mất 30 giây).
2. Vào thư mục `AUTO-QUEST-IOS` (hoặc chạy file `build-eas.bat` trong thư mục này):
   ```cmd
   cd C:\Users\NgDuy-PC\Desktop\AUTO-QUEST-IOS
   build-eas.bat
   ```
3. Hệ thống sẽ hỏi đăng nhập tài khoản Expo của bạn một lần duy nhất.
4. Server macOS của Expo sẽ tự động biên dịch toàn bộ source code với Xcode, tạo ra file **`AUTO-QUEST PRO.ipa`** và trả về link tải trực tiếp.
5. Mở Safari trên iPhone 7 Plus, dán link tải file `.ipa` về máy.
6. Mở file `.ipa` vừa tải -> Bấm nút **Chia sẻ (Share)** -> Chọn **TrollStore** -> Bấm **Install**.
   *(Xong! App sẽ xuất hiện trên màn hình chính và hoạt động vĩnh viễn).*

---

## ⚡ CÁCH 2: BUILD FILE .IPA BẰNG GITHUB ACTIONS (HOÀN TOÀN TỰ ĐỘNG)

Trong thư mục `AUTO-QUEST-IOS` đã có sẵn file workflow:
`.github/workflows/build-ipa.yml`

1. Tạo một repository mới trên GitHub (Private hoặc Public).
2. Đẩy toàn bộ thư mục `AUTO-QUEST-IOS` lên repo đó:
   ```cmd
   cd C:\Users\NgDuy-PC\Desktop\AUTO-QUEST-IOS
   git init
   git add .
   git commit -m "AutoQuest iOS for TrollStore"
   git branch -M main
   git remote add origin https://github.com/Tên_Bạn/autoquest-ios.git
   git push -u origin main
   ```
3. Vào tab **Actions** trên GitHub -> Bấm chọn **Build iOS IPA for TrollStore** -> Bấm **Run workflow**.
4. GitHub sẽ cấp máy ảo Apple Silicon macOS miễn phí, tự động cài đặt pods và đóng gói thành file `AUTO-QUEST-PRO-TrollStore.ipa` trong vòng ~3-4 phút.
5. Tải file `.ipa` từ mục **Artifacts** về iPhone và cài bằng TrollStore!

---

## 🌟 ĐẶC ĐIỂM NỔI BẬT CỦA BẢN IOS DÀNH CHO IPHONE 7 PLUS:

| Tính năng | Chi tiết trên iOS |
|-----------|-------------------|
| **🎨 Dark Strong Vesper** | Nền đen OLED `#000000`, viền bo tròn nâu/than `#100d14`, điểm nhấn màu hổ phách/đồng `#ff9e64`. |
| **⚡ Siêu mượt (60 FPS)** | Không dùng hiệu ứng blur nặng, tối ưu riêng cho chip Apple A10 Fusion của iPhone 7 / 7 Plus chạy iOS 15.8.8. |
| **💾 Ghi nhớ Token vĩnh viễn** | Nút "Lưu Token" lưu vào bộ nhớ mã hóa `AsyncStorage`, nạp lại hiển thị dấu chấm `●●●●●●`. |
| **📋 Hướng dẫn lấy Token Mobile** | Nút **"COPY SCRIPT LẤY TOKEN DISCORD"** 1-tap dành riêng cho Safari / Bookmarklet trên iPhone kèm thông báo to rõ. |
| **🌟 Discord Orbs Counter** | Giữ nguyên số Orb tài khoản, chỉ hiện thẻ tăng dần **(+X)** màu xanh lá/vàng theo từng nhiệm vụ hoàn thành. |
| **⏳ 2 Tab Nhiệm Vụ** | Tab **"⏳ Đang làm"** (thanh % tiến độ, icon loại nhiệm vụ) và Tab **"✅ Đã làm"** (danh sách nhiệm vụ đã xong). |
| **🌙 Màn hình Treo Pin (OLED Saver)** | Bấm nút **🌙 Treo Pin** trên góc phải để biến màn hình thành đen hoàn toàn với đồng hồ mờ, giữ app không bị iOS tắt mà tốn 0% pin. |
| **🔄 AFK Loop Mode** | Chế độ treo liên tục, tự động đếm ngược chu kỳ 15, 30, 60 phút để quét và làm nhiệm vụ mới. |
| **🛡️ Bảo mật tuyệt đối** | 100% kết nối thẳng tới Discord API, chặn đứng mọi domain bên thứ 3. |
