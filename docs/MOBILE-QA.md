# Hướng dẫn kiểm tra giao diện mobile

Tài liệu này dành cho người kiểm tra app trên điện thoại thật sau mỗi
bản deploy. Nó không chứa lịch sử thay đổi — lịch sử nằm trong `.brain/`.

## Ma trận thiết bị cần kiểm tra

| Thiết bị / trình duyệt | Điểm cần nhìn |
|---|---|
| iPhone 7, Safari iOS 15 | Màu viền/nền không bị mất (fallback cho trình duyệt cũ), drawer, bottom sheet tài khoản, bàn phím không che ô nhập |
| iPhone SE, màn 320px | Không cuộn ngang, nút không tràn, modal đổi tài khoản vừa màn hình |
| iPhone Pro Max, màn 430px | Lưới Đã làm 3 cột, toolbar không bóp chữ |
| Android màn nhỏ (360px) | Tương tự SE, cộng PWA icon maskable |
| Điện thoại xoay ngang | Hero gọn, modal vừa chiều cao, danh sách 2 cột |
| Tablet 768-1023px | Drawer rộng hơn, danh sách 2 cột, toolbar đủ rộng |
| Cả 2 theme Sáng / Tối | Chữ nhỏ vẫn đọc được, logo không có lớp màu lạ phía sau |

## Quy trình kiểm tra nhanh (mỗi thiết bị)

1. Mở app, bấm nút menu: drawer mở, bấm từng mục điều hướng, drawer
   đóng sau khi chuyển trang, focus quay về nút menu.
2. Bấm nút tài khoản trên thanh topbar (mobile): bottom sheet mở, hiện
   đúng tên/ID/số dư, bấm Đổi tài khoản và Đăng xuất đều đi đúng luồng cũ.
3. Mở modal Đổi tài khoản: ô token một hàng riêng, nút đủ lớn, danh
   sách tài khoản cuộn riêng trong modal, không đẩy modal tràn màn hình.
4. Kéo danh sách nhiệm vụ: tên dài không tràn khung, thẻ Đã làm không
   chồng lên nhau, cuộn không bị giật vì ảnh (ảnh tải lười).
5. Mở bàn phím ở một ô nhập trong modal: ô nhập được cuộn vào tầm nhìn,
   không bị bàn phím che.
6. Tắt mạng rồi mở lại app từ cache: thấy trang offline có nút Thử lại.

## Những giới hạn đã biết

- Ảnh chụp màn hình thật chỉ có giá trị khi ghi rõ thiết bị, trình
  duyệt, theme và tab đang mở. Kiểm tra tĩnh không thay thế được bước này.
- Trình duyệt cũ không hỗ trợ một số hiệu ứng màu hiện đại: app cố tình
  hiển thị màu dự phòng đơn giản hơn thay vì vỡ layout.
