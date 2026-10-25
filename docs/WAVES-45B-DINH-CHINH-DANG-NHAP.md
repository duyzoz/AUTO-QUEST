# Waves 45b — ĐÍNH CHÍNH ĐĂNG NHẬP (authorize ≠ đăng nhập tài khoản)

> Bro hỏi đúng: *"nhưng cái này cũng chỉ là mời được bot vào server chứ không thực sự
> đăng nhập được account discord vào??"* — **ĐÚNG. Bro nói chính xác.**

---

## 1. Vấn đề bro chỉ ra

Wave 45 tôi dựng một khung tên là **"Đăng nhập bằng Discord"** và cho nó mở:

```
https://discord.com/oauth2/authorize?client_id=...&permissions=...&scope=bot
```

**Đây là link MỜI BOT vào server — không phải đăng nhập tài khoản.**

Tên gọi cũ gây hiểu nhầm hoàn toàn. Bro bắt đúng lỗi này.

---

## 2. Vì sao OAuth2 KHÔNG THỂ đăng nhập tài khoản (sự thật kỹ thuật)

Tôi tra tài liệu OAuth2 chính thức của Discord. Kết quả:

| Điều bro muốn | Thực tế |
|---|---|
| `scope=bot` → đăng nhập account | ❌ Chỉ **thêm bot vào server**. Không liên quan tài khoản bro. |
| `scope=identify` → đăng nhập account | ❌ Trả **Bearer access token**, KHÔNG phải token tài khoản. Chỉ đọc được `/users/@me` cơ bản. |
| Scope nào cho quest? | ❌ **Không tồn tại.** Danh sách scope của Discord không có scope nào liên quan nhiệm vụ. |
| Implicit grant lấy user token? | ❌ Discord **khuyến cáo không dùng**, và vẫn không cho token tài khoản client. |
| Password grant? | ❌ Discord **không hỗ trợ** grant này. |

**Kết luận:** không có đường OAuth2 nào để đăng nhập tài khoản Discord vào app bên thứ ba.
`/quests/@me` là endpoint **không tài liệu hoá** và **chỉ chấp nhận token tài khoản client thật**
(lấy từ chính phiên Discord đang đăng nhập).

---

## 3. Đã sửa gì

### 3.1. Bỏ hết câu nói sai sự thật

| Trước | Sau |
|---|---|
| Tab: `Cách 2 · Đăng nhập bằng Bot` | `Cách 2 · Mời bot vào server` |
| Tiêu đề: `Đăng nhập bằng Discord` | `Mời bot vào server` |
| Phụ đề: `Mời bot vào server · cấp quyền đọc hồ sơ` | `OAuth2 scope=bot · không phải đăng nhập tài khoản` |
| Nút: `MỞ TRANG MỜI BOT (authorize)` | `MỞ TRANG MỜI BOT (scope=bot)` |
| Nút: `Đăng nhập hồ sơ (scope identify)` | `Xem hồ sơ công khai (scope identify)` |
| Tab 1: `Cách 1 · Console` | `Cách 1 · Đăng nhập tài khoản (Console)` |
| Sidebar: `Bấm để đăng nhập Discord` | `Bấm để dán token tài khoản` |
| Bước 4 hướng dẫn: *"mời bot vào server và đăng nhập Auto Quest"* | *"mời bot vào server — không phải đăng nhập tài khoản của bro"* |
| Thông báo identify: `Đã mở trang đăng nhập hồ sơ Discord` | `...KHÔNG trả token đăng nhập tài khoản — chỉ hiển thị hồ sơ` |

### 3.2. Thêm cảnh báo nói thẳng ngay trong UI

Khối `#oauthTruth` hiện ở đầu Cách 2:

> **Nói thẳng: khung dưới chỉ MỜI BOT vào server — KHÔNG đăng nhập tài khoản Discord của bro.**
> Discord không có scope OAuth2 nào trả về token tài khoản người dùng, cũng không có scope nào
> cho nhiệm vụ (quest). Bot chỉ đọc được tên/ảnh đại diện và có mặt trong server.
> Muốn **đăng nhập thật** để cày Orb → dùng ô **Token Discord** phía trên (Cách 1).

### 3.3. Thêm ĐƯỜNG ĐĂNG NHẬP THẬT (điều bro thực sự cần)

Nút mới trong Cách 1: **`NẠP TOKEN TÀI KHOẢN TỪ FILE .TXT`**

- Bro để token tài khoản trong 1 file `.txt` → bấm nút → chọn file.
- App đọc, kiểm tra định dạng, đưa vào đúng chỗ, lưu config.
- **Token không bao giờ hiện ra chat, nhật ký, hay UI.**

Đây **chính là đăng nhập thật** — token thuộc về bro nên app mới gọi được
`/quests/@me` và `claim-reward`.

---

## 4. Đo được (không đoán)

Probe mới `tools/probe-wave45b-login.js` — **32 pass / 0 fail**:

```
=== 1) UI KHÔNG ĐƯỢC NÓI SAI (authorize ≠ đăng nhập) ===
  ✅ Không còn câu "Đăng nhập bằng Discord" (sai sự thật)
  ✅ Không còn tab "Đăng nhập bằng Bot"
  ✅ Tab Cách 1 nói rõ là ĐĂNG NHẬP TÀI KHOẢN
  ✅ Tab Cách 2 nói rõ là MỜI BOT
  ✅ Nút 1 ghi rõ scope=bot
  ✅ Nút 2 đổi thành "Xem hồ sơ công khai"
  ✅ Có cảnh báo "KHÔNG đăng nhập tài khoản Discord"
  ✅ Cảnh báo có nói Discord không có scope cho token người dùng
  ✅ Sidebar hết ghi "Bấm để đăng nhập"

=== 2) URL THẬT ===
  ✅ scope=bot → client_id + permissions=347200 + scope=bot
  ✅ scope=identify → response_type=code + scope=identify

=== 3) TOKEN TÀI KHOẢN ===
  ✅ Chưa nạp → pendingStatus.pending = false
  ✅ pendingStatus KHÔNG chứa trường token
  ✅ take khi rỗng → ok = false
  ✅ Token chuẩn (3 phần) → hợp lệ
  ✅ Chuỗi rác ngắn → bị từ chối
  ✅ Dạng "token = xxx" trong .txt → vẫn nhận
  ✅ Token giả KHÔNG có trong DOM
  ✅ Token giả KHÔNG có trong các note

=== 4) ĐƯỜNG ĐĂNG NHẬP THẬT CÓ TRONG UI ===
  ✅ Nút NẠP TOKEN TÀI KHOẢN TỪ FILE .TXT
  ✅ Ô nhập token tài khoản
  ✅ Nút Lưu token

=== 5) PRELOAD ===
  ✅ userTokenImportTxt / userTokenTake / userTokenDiscard / userTokenPendingStatus / oauthBuildUrl

=== 6) LỖI JS ===
  ✅ Không có lỗi JS mới
```

URL thật đo được:

```
scope=bot      : https://discord.com/oauth2/authorize?client_id=123456789012345678&permissions=347200&scope=bot
scope=identify : https://discord.com/oauth2/authorize?client_id=123456789012345678&response_type=code&scope=identify&redirect_uri=...
```

---

## 5. Toàn bộ suite vẫn xanh

| Kiểm tra | Kết quả |
|---|---|
| `validate-ui` | **333/333** (thêm 14 marker Wave 45b) |
| `probe-wave45b-login` | **32 pass / 0 fail** |
| `probe-wave45-oauth` | PASS |
| `probe-wave44` | PASS |
| `probe-log-color` | PASS |
| `probe-guest-centre` | PASS |
| `probe-done-tile` | PASS |
| `probe-wave42` | PASS |
| `csp-verify` | 0 vi phạm |
| `contrast-audit` | 60/60 ≥ 4.5:1 |
| `theme-audit` | 0 mục chìm (dark + light) |
| `quest-classify-test` | 10 pass / 0 fail |
| `claim-seq-test` | sạch |
| `tsc --noEmit` | exit 0 |
| `node --check` × 3 | OK |
| App khởi động thật | không lỗi JS |
| Rác tạm | 0 |

---

## 6. Cách dùng đường ĐĂNG NHẬP THẬT

1. Mở Discord (Web hoặc app) → **F12** → tab **Console**.
2. Gõ `allow pasting` → Enter (nếu Discord chặn dán).
3. Bấm **COPY LỆNH LẤY TOKEN (TỰ ĐỘNG)** trong app → dán vào Console → Enter.
4. **Hai lựa chọn:**
   - **Dán trực tiếp** vào ô *Token Discord* → bấm **Lưu**.
   - **Hoặc** để token trong file `.txt` → bấm **NẠP TOKEN TÀI KHOẢN TỪ FILE .TXT**.
5. Bấm **Quét nhiệm vụ** — giờ app chạy dưới danh nghĩa tài khoản của bro.

> **Cách 2 (mời bot) KHÔNG đăng nhập được gì cả.** Nó chỉ để bot có mặt trong server.
> Nếu bro chỉ cần cày Orb thì **không cần dùng Cách 2**.

---

## 7. Nói thẳng phần còn lại

- **Cày Orb bắt buộc dùng token tài khoản.** Không có đường nào khác.
- **Bot không nhận nhiệm vụ thay bro được** — Discord không cho.
- Dùng token tài khoản là **tự chịu trách nhiệm** theo điều khoản Discord
  (self-bot có thể bị khoá tài khoản). App không giấu điều này.
