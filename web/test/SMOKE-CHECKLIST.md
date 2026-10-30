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

## Mobile (CHƯA XÁC MINH)

- [ ] iPhone 7 Safari iOS 15: viền/nền các thẻ vẫn có màu (fallback cho
      trình duyệt cũ), không còn khung trắng/xám do màu hiện đại bị vứt.
- [ ] iPhone 7: bấm nút tài khoản trên topbar mở bottom sheet (không còn
      popout ngược bị cắt trong drawer), đổi tài khoản và đăng xuất đúng.
- [ ] iPhone 7: drawer cuộn tới đâu cũng thấy hàng tài khoản dính ở đáy,
      bấm mục Tài khoản ở đầu nav tới đúng khu vực tài khoản.
- [ ] iPhone SE 320px: không cuộn ngang ở bất kỳ tab nào, modal đổi tài
      khoản vừa màn hình, danh sách tài khoản cuộn riêng.
- [ ] iPhone Pro Max 430px: lưới Đã làm 3 cột đọc được, toolbar không bóp chữ.
- [ ] Android màn nhỏ: tương tự SE, PWA icon maskable hiển thị đúng.
- [ ] Xoay ngang: hero gọn, modal vừa chiều cao, danh sách 2 cột.
- [ ] Tablet 768-1023px: drawer rộng hơn, danh sách 2 cột, toolbar đủ rộng.
- [ ] Bàn phím iOS mở trong modal: ô đang nhập được cuộn vào tầm nhìn.
- [ ] Vuốt ngang sang trái đóng được drawer, không chặn cuộn dọc.
- [ ] Nút menu, đổi tài khoản, đăng xuất, xóa tài khoản đều bấm được dễ
      dàng bằng ngón tay (vùng chạm 44px), cả 2 theme Sáng/Tối.
- [ ] Chữ nhỏ (tên game, mô tả, nhật ký) đọc được ở cỡ chữ lớn của iOS,
      không tràn khung khi phóng to 200%.
- [ ] Nhấn giữ tên nhiệm vụ/ID để copy được trên mobile.
