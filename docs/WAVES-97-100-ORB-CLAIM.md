# Waves#97–100 — ORB claim và CAPTCHA trong client

## Kết luận rà soát

- Claim từ thẻ UI đi qua `electron/main.js`, còn Auto ORBs đi qua `src/questManager.ts`; hai đường có hàng đợi và xử lý lỗi riêng.
- Trước đây đường UI đổi `traffic_metadata_raw/sealed` không có thành `null`. Bot giữ nguyên giá trị từ quest gốc, nên payload claim không nhất quán giữa hai đường.
- Discord quyết định challenge theo account. Account không bị yêu cầu CAPTCHA có thể claim trực tiếp. Khi có challenge, hCaptcha callback có thể trả token passive `P1_` mà không mở thử thách tương tác; callback không chứng minh người dùng đã giải CAPTCHA.
- Log mới cho thấy lỗi cấu hình cụ thể: script dùng `render=explicit` nhưng app chỉ đợi sự kiện DOM `load`, rồi gọi `hcaptcha.render()` trước callback khởi tạo chính thức. hCaptcha cảnh báo rõ trường hợp này. Vì vậy kết quả passive quan sát trước đây chưa đủ để kết luận sitekey chỉ cấp challenge passive.
- Khi token passive bị gửi rồi bị Discord từ chối, logic thử lại có thể xin challenge liên tục. Lỗi `403 · 10008` cũng từng bị hiểu nhầm là đã qua CAPTCHA dù Discord chưa xác nhận claim.
- `err.captcha` có thể chỉ chứa một phần dữ liệu trong khi raw error chứa `sitekey/rqdata`; chọn riêng một object làm mất dữ liệu dựng challenge.

## Các waves đã triển khai

### Waves#97 — Đồng nhất payload và xác nhận claim

- Truyền `traffic_metadata_raw/sealed` nguyên trạng từ quest gốc qua scan → renderer → IPC; `undefined` không còn bị đổi thành `null`.
- Chỉ chuyển thẻ sang `claimed`, cập nhật thống kê phiên và đọc lại số dư sau khi Discord trả HTTP thành công.
- Giữ các phản hồi 404, 429, sai platform, CAPTCHA và lỗi khác ở trạng thái chưa nhận.

### Waves#98 — Giải CAPTCHA thủ công ngay trong app

- Khi claim API trả challenge hCaptcha, hiển thị widget ngay trong modal của app. Người dùng tự mở và giải; app không mở Discord ngoài.
- Khởi tạo SDK bằng `onload=__autoquestHcaptchaReady&render=explicit`; chỉ gọi `hcaptcha.render()` sau callback này. Sự kiện DOM `load` chỉ dùng để ghi trạng thái tải, không dùng làm tín hiệu SDK sẵn sàng.
- Chỉ gửi response sau khi hCaptcha báo challenge tương tác đã mở. Callback passive `P1_` không có challenge mở sẽ bị bỏ ngay trong client.
- Sau khi gửi, chỉ phản hồi thành công từ claim API mới xác nhận nhận Orbs. Callback của widget tự nó không được tính là thành công.

### Waves#99 — Chặn loop và tách trạng thái account

- Giữ hàng đợi theo account, khóa claim tự động sau CAPTCHA/unconfirmed response và giữ dedupe modal theo account + quest.
- CAPTCHA response không được replay sau 429/403. Người dùng có thể yêu cầu challenge mới rõ ràng trong modal.
- Gộp `err.captcha`, `rawError`, `body` và `data` để giữ lại đầy đủ metadata challenge khi các thư viện REST trả nhiều dạng lỗi.

### Waves#100 — Retry widget và chẩn đoán trung thực

- Nếu hCaptcha tải lỗi, xóa script hỏng và cho phép tải lại ở lần bấm tiếp theo.
- Nếu callback trả token passive hoặc không mở challenge tương tác, không gửi token lên claim API và ghi rõ rằng Discord chưa xác minh.
- Log request chỉ ghi trạng thái có/không của các trường metadata và CAPTCHA; không ghi giá trị challenge/token.
- Xóa IPC `shell:open-quest` cùng đường claim cũ dẫn người dùng sang Discord.

## Giới hạn kỹ thuật

Account không bị challenge vẫn claim trực tiếp; claim có CAPTCHA chỉ thành công khi Discord trả claim OK. Log passive trước đó được thu khi SDK khởi tạo sai thứ tự nên cần đánh giá lại sau khi app chạy với callback `onload` mới. Nếu sau đó challenge vẫn không mở, khi ấy mới điều tra tiếp sitekey, `rqdata`, origin và khác biệt risk giữa account; client không thể tự xác nhận kết quả thay Discord.

## Kiểm tra

- `pnpm run build:bot` biên dịch TypeScript và đồng bộ `electron/bot` thành công.
- `node --check` qua cho `electron/main.js`, `electron/preload.js` và `electron/renderer/renderer.js`.
- Không chạy test suite hoặc gọi Discord thật trong lượt sửa này.
- Sổ wave cũ đã có một mục `Waves#97` cho đóng gói phát hành; giữ dải `#97–100` theo yêu cầu trực tiếp của người dùng và ghi rõ va chạm số.
