# Smoke checklist — kiểm tra bằng trình duyệt thật (CHƯA XÁC MINH)

Danh sách này chỉ liệt kê những trạng thái cần chụp màn hình thật trên web
sau khi deploy. Không có ảnh chụp nào được đính kèm từ lần chạy này — tất cả
các mục dưới đây đều ở trạng thái CHƯA XÁC MINH cho tới khi có người kiểm
tra bằng trình duyệt thật.

## Drawer (mobile 375px)
- [ ] Mở drawer, bấm Settings / Stats / About: phải chuyển trang rồi mới đóng drawer.
- [ ] Bấm vào overlay: chỉ đóng drawer, không đổi trang.
- [ ] Nhấn Esc khi drawer mở: đóng drawer và trả focus về nút mở drawer.
- [ ] Khi drawer đóng: overlay không chặn bấm vào nội dung bên dưới.

## Toolbar nâng cao
- [ ] Mở "Bộ lọc nâng cao", bật từng lọc (nền tảng, loại nhiệm vụ, sắp hết hạn,
      khoảng ngày, loại trừ chưa có ngày, nhóm theo game): số (n) trên nút phải
      bằng đúng số lọc đang bật, kể cả sau khi đổi tab và sau khi xóa cache.

## Logo / favicon / theme
- [ ] Tab trình duyệt hiện favicon tròn (zoZ-logo-round), không còn logo vuông.
- [ ] Logo sidebar và ảnh thưởng hiển thị đúng ở cả theme light và dark, không
      còn lớp xanh/dark phía sau logo.
- [ ] PWA cài đặt: icon maskable tròn hiển thị đúng trên Android.
- [ ] Theme "Theo hệ thống": đổi theme OS thì app đổi theo không cần bấm lại.

## Các tính năng mới cần nhìn thấy
- [ ] Offline: tắt mạng, mở app từ cache thấy trang offline có nút "Thử lại".
- [ ] Quest sắp hết hạn trong 7 ngày hiện đếm ngược (giờ/phút) và số này thay
      đổi theo thời gian thật sau ~1 phút.
- [ ] Chọn theo game ở tab Chưa làm chỉ chọn đúng game đó.
- [ ] Thẻ chia sẻ tải về là ảnh PNG chỉ có tên/game/phần thưởng/ngày, không code.
- [ ] Sau một lần quét có quest mới: có thông báo riêng "Có N quest mới".
