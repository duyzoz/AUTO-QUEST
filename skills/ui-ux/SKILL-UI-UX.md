# SKILL-UI-UX — Luật UI/UX bắt buộc của AUTO-QUEST

> **ĐỌC TRƯỚC TIÊN, KHÔNG ĐƯỢC BỎ QUA.**
>
> Bất kỳ task nào chạm tới giao diện của AUTO-QUEST — `web/app/index.html`,
> `web/app/renderer.js` (phần dựng UI), `web/app/styles.css`,
> `web/app/mobile.css`, `web/app/sw.js` (phần UI cập nhật), hay bất kỳ file
> nào sinh ra nút, thẻ, tab, modal, sidebar, toolbar — thì agent **phải đọc
> hết file này trước khi viết một dòng code UI nào**, rồi trong báo cáo phải
> liệt kê: (1) những luật nào trong file này áp dụng cho task đó,
> (2) đã kiểm tra checklist ở §9 bằng cách nào, (3) ngoại lệ nào (nếu có)
> và lý do.
>
> File này là **luật duy nhất** về UI/UX của repo. Không tự bịa thêm hệ
> design system mới, không copy luật từ repo khác vào mà không đối chiếu
> với §2–§8 dưới đây. Khi luật này mâu thuẫn với một yêu cầu thẩm mỹ lẻ,
> luật này thắng. Khi luật này mâu thuẫn với bảo mật (token, CSP, code
> thưởng), bảo mật thắng — và ngoại lệ phải được ghi rõ, không im lặng.
>
> Ngôn ngữ làm việc: tiếng Việt với user, code/comment giữ nguyên phong
> cách hiện có của repo.

## 0. Phạm vi và định nghĩa

- **Component** trong AUTO-QUEST không phải React/Tailwind component, mà là
  một khối UI đã có sẵn và có tên class riêng: `.btn`, `.ghost-btn`,
  `.tab-btn`, `.nav-item`, `.qcard`, `.qdone`, `.quest-tools`, `.sidebar`,
  `.capture-card`, `.modal`, `.toast`, `.chip`, `.custom-select`, v.v.
- **Token** là biến CSS đã có trong `styles.css` (`--fg`, `--fg-muted`,
  `--line`, `--line-strong`, `--card`, `--well`, `--brand`, `--danger-soft`,
  `--radius-field`, …) và biến theme theo `[data-theme="light"]` /
  `[data-theme="dark"]`. Token là từ vựng duy nhất được phép dùng cho màu,
  nền, viền, chữ.
- **Màn hình kiểm tra bắt buộc:** 375px (mobile), 768px (tablet),
  1024px (desktop nhỏ), 1440px (desktop). Một UI chỉ "đạt" khi đạt ở cả
  4 mốc, ở cả 2 theme, và bằng cả chuột lẫn bàn phím/cảm ứng.

## 1. Tổng hợp từ 3 nguồn — và cách dịch sang repo này

### 1.1. Từ shadcn-ui/lint — linter "agent-first" cho design system

Ý cốt lõi của `shadcn-ui/lint`: **luật phải viết sao cho agent kiểm tra
được, và lỗi phải nói cho agent biết sửa bằng cái gì có sẵn**, chứ không
chỉ nói "sai rồi". TypeScript chỉ báo "không được phép", còn linter này
báo "dùng size/variant có sẵn thay vì padding tùy ý". Repo này không dùng
Tailwind/React, nên dịch 6 rule của nó sang CSS/vanilla như sau — đây là
bản dịch chính thức, không phải gợi ý:

| Rule gốc (shadcn) | Luật dịch sang AUTO-QUEST | Ví dụ sai → đúng |
|---|---|---|
| `no-restyle` — không restyle component bằng className | Không override padding, radius, màu, font-weight của một component đã có bằng style lẻ tại chỗ dùng. Muốn đổi, thêm variant/size vào chính component đó trong `styles.css`, hoặc dùng margin/gap của phần tử cha để đặt vị trí. | Sai: `.qcard { padding: 13px }` lẻ ở một chỗ. Đúng: thêm class variant cho `.qcard` hoặc đổi gap của `.quest-list`. |
| `no-raw-colors` — không màu thô | Không dùng mã màu hex/rgb trực tiếp trong code UI mới. Mọi màu phải là `var(--token)`. Màu chỉ được xuất hiện ở đúng một chỗ: định nghĩa token theo theme. | Sai: `background: #1e293b`. Đúng: `background: var(--card)`. |
| `no-arbitrary-values` — không giá trị tùy ý | Không dùng giá trị spacing/radius/font-size lẻ ngoài thang đã có (4/6/8/10/12/14/16/20/24/28/32px và các token radius/font-size hiện có). Giá trị mới phải thêm vào thang chung, không nhét lẻ. | Sai: `padding: 13px`, `gap: 7px`. Đúng: `padding: 12px`, `gap: 8px`. |
| `no-inline-styles` — không inline style | Không dùng thuộc tính `style="..."` và không set `el.style.*` cho những thứ CSS tĩnh làm được. Ngoại lệ duy nhất, phải có comment ghi lý do ngay tại chỗ (xem §5): giá trị động lấy từ dữ liệu Discord (URL banner/avatar, biến theme, ring offset) và style do hCaptcha tự chèn — những thứ không thể viết sẵn trong file CSS tĩnh. | Sai: `style="color: red"` cho trạng thái. Đúng: thêm class `.is-error` dùng token. |
| `no-unknown-classes` — không class lạ | Không bịa class mới mà không định nghĩa nó trong `styles.css`/`mobile.css`. Sau mỗi thay đổi, grep toàn bộ class dùng trong `index.html` + `renderer.js` và đối chiếu với class đã định nghĩa. Class nào không có định nghĩa là lỗi, không phải "để đó sau này". | Sai: `class="rounded-huge"`. Đúng: dùng class đã có hoặc định nghĩa nó trước khi dùng. |
| `require-static-classes` — class phải đọc được tĩnh | Không dựng tên class động từ dữ liệu Discord/user (`"qcard-" + type`, template string nối chuỗi class). Class phải nhìn thấy được bằng grep. Nếu cần biến thể theo dữ liệu, dùng map tĩnh từ giá trị → class đã liệt kê sẵn. | Sai: `` `badge-${kind}` ``. Đúng: `const BADGE = { orbs: 'badge-orbs', avatar: 'badge-avatar' }`. |
| Contracts + custom message | Mỗi component có "hợp đồng" riêng: phần nào được đổi, phần nào không. Ví dụ: `.nav-item` được đổi trạng thái active, không được đổi font-family; `.qcard` được đổi nội dung bên trong, không được đổi padding/radius/border của khung. Khi sửa, ghi hợp đồng đó vào comment ngay trên component, để lần sau agent khác không phá. Khi báo lỗi cho chính mình, viết theo mẫu: "sai ở đâu — dùng cái gì thay thế — cái đó nằm ở file nào". | |

Thêm quy tắc của shadcn vào `AGENTS.md` của repo: **sau khi sửa UI, chạy
lint/check tương đương** — ở repo này là: `npm test`, `npm run check:bundle`,
grep class chưa định nghĩa, grep màu thô, grep inline style mới — và sửa
hết lỗi trước khi báo xong.

### 1.2. Từ ui-ux-pro-max-skill — trí tuệ thiết kế, checklist giao hàng

Ý cốt lõi của `ui-ux-pro-max`: **trước khi code, sinh ra design system
đầy đủ (pattern + style + màu + typography + hiệu ứng + anti-pattern +
checklist), rồi code theo nó, rồi kiểm tra lại bằng checklist đó.**
Repo này đã có sẵn một design system (dark/light, token, component),
nên không sinh system mới — mà áp dụng quy trình của nó vào system có sẵn:

1. **Audit trước khi sửa:** tìm mọi giá trị hard-code liên quan tới phần
   sắp sửa (màu, spacing, font-size) trong stylesheet, inline style và
   class tiện ích; liệt kê chúng trước khi động vào code.
2. **Map:** dùng lại token/semantic role đã có (`background`, `surface`,
   `foreground`, `primary`, `border`, `ring`, …). Thiếu role mới được
   thêm role — không tạo hệ màu song song.
3. **Migrate từng mẻ nhỏ:** thay hard-code bằng token theo từng component,
   mỗi mẻ xong kiểm tra lại contrast, hover/focus/disabled, responsive
   và cả 2 theme rồi mới sang mẻ tiếp theo.
4. **Verify:** kiểm tra theo checklist §9, không kiểm tra bằng mắt ở
   một màn hình duy nhất rồi kết luận.

Các chuẩn cụ thể lấy từ skill này, bắt buộc:

- **Tương phản:** chữ/nút ≥ 4.5:1 ở cả 2 theme. Chữ trắng trên nền trắng
  (hoặc chữ tối trên nền tối) là lỗi chặn, không phải "trông hơi mờ".
- **Focus nhìn thấy được:** mọi phần tử tương tác phải có focus state rõ
  (ring/border), đi được bằng Tab theo thứ tự hợp lý, Esc đóng modal/
  drawer, focus trả về đúng chỗ cũ khi đóng.
- **Không dùng emoji làm icon.** Icon chỉ dùng SVG (Heroicons/Lucide
  style, stroke hiện có của repo). Emoji chỉ được dùng trong nội dung
  text/log, không dùng làm nút/icon.
- **Clickable = `cursor: pointer` + vùng chạm ≥ 44px** trên mobile
  (đã có trong `mobile.css` — không được phá bằng `min-height` nhỏ hơn).
- **Text đàn hồi (resilient text):** tiêu đề, chip, badge, tên game dài
  phải reflow được, không cắt chữ ở màn hẹp, không vỡ label khi zoom
  chữ hoặc khi user tăng khoảng cách chữ. Truncation chỉ dùng khi có
  đường xem đủ giá trị bằng bàn phím, chuột và cảm ứng.
- **Chip/badge:** tập hợp chip phải wrap hoặc dùng disclosure `+n`
  (bấm để xem thêm), không tràn hàng. Ý nghĩa của badge không được dựa
  vào màu duy nhất — phải có text/icon đi kèm.
- **Tương tác nhanh bị hủy:** animation có thể bị hủy giữa chừng, nhưng
  trạng thái ngữ nghĩa cuối cùng, focus và nội dung phải đúng.
  Timing theo platform/component, và **tôn trọng `prefers-reduced-motion`**:
  tắt hiệu ứng trang trí, nhưng giữ tín hiệu tiến trình (loader, vòng
  xoay) — không làm nó đứng yên ở 0% rồi nhảy 100%.
- **Anti-pattern cấm:** gradient tím/hồng kiểu "AI" tràn lan, màu neon
  chói, animation gắt, dark mode chỉ đổi nền mà không đổi chữ, và bất kỳ
  hiệu ứng nào làm chữ khó đọc để "cho đẹp".
- **Responsive không phải là thu nhỏ:** ở 375px, bố cục phải sắp lại
  (1 cột, toolbar gọn, drawer), không phải co cùng một bố cục desktop
  lại cho vừa màn hình.

### 1.3. Từ chrome-devtools-mcp — kiểm tra bằng trình duyệt thật, không đoán màu

Ý cốt lõi của `chrome-devtools-mcp`: **agent điều khiển và soi trình
duyệt Chrome thật** — lấy performance trace, xem console (kèm source
map), xem network, chụp screenshot, debug accessibility, cookie/session,
LCP, memory leak — thay vì đoán giao diện từ code.

Repo này chạy trong môi trường Muse, không có MCP server của Chrome
DevTools gắn sẵn, nên dịch sang công cụ tương đương có sẵn ở đây:

- **Dùng browser task của Muse** (không dùng subagent thường cho việc
  này) để: mở app, chụp screenshot, xem console, kiểm tra network,
  giả lập mobile 375px, bấm thử từng tab/nút.
- **Không bao giờ tuyên bố "giao diện đã đẹp/đã đúng" nếu chưa có
  screenshot.** Nếu browser task không tới được localhost (đã từng xảy
  ra với `127.0.0.1:4173` ở các đợt trước), thì ghi rõ là **chưa kiểm
  chứng bằng mắt**, để user test trên web sau khi deploy — không bịa
  screenshot, không nói "chắc là ổn".
- **Mỗi lần sửa UI, phải có ảnh trước/sau** ở cùng một màn hình, cùng
  một theme, để so sánh. Ảnh chỉ có giá trị khi kèm: kích thước màn
  hình, theme, tab/trạng thái đang mở.
- **Console là một phần của kiểm tra UI:** sau khi bấm qua các tab/nút
  mới sửa, console phải sạch lỗi liên quan tới thay đổi đó. Lỗi console
  cũ không liên quan phải ghi rõ là cũ, không được lờ đi rồi đổ cho
  "chắc không sao".
- **Performance là UI:** LCP, số lượng DOM node (đặc biệt lưới Đã làm
  hàng trăm thẻ), và thời gian render phải được nhìn thấy trong
  diagnostics của app hoặc trong trace — không thêm hiệu ứng nặng chỉ
  vì "trông mượt" mà không đo.
- **Accessibility debug:** dùng checklist a11y của skill đó — kiểm tra
  bằng bàn phím, đọc tên accessible của nút (không để nút chỉ có icon
  mà không có label), và kiểm tra trạng thái `aria-selected`/`aria-expanded`
  của tab/drawer/filter.
- **Không đưa token thật, code thưởng thật vào browser task, screenshot
  hay log.** Kiểm tra UI bằng mock mode / dữ liệu giả, hoặc bằng tài
  khoản test do user cung cấp theo luồng riêng — không bao giờ dùng
  tài khoản thật của user để "test cho nhanh".

## 2. Thứ bậc toolbar — luật chữa bệnh "quá nhiều nút đè lên nhau"

Đây là lỗi đã xảy ra thật ở tab Đã làm (ảnh user gửi 30/10/2026): hàng
công cụ chứa cùng lúc tìm kiếm + lọc nhiệm vụ + lọc thưởng + sắp xếp +
xuất CSV + xuất JSON + kèm code + xóa cache + từ/đến + kèm chưa rõ ngày
+ nhóm game + lọc nền tảng + lọc loại nhiệm vụ + sắp hết hạn + chỉ yêu
thích + chế độ thử — tất cả dồn trong một khối flex-wrap, nhãn và ô
nhập chồng lên nhau, không đọc được, không bấm chính xác được.

Luật, áp dụng cho mọi toolbar từ nay:

1. **Một hàng chính, tối đa 4 nhóm điều khiển.** Hàng chính chỉ chứa:
   tìm kiếm + 1 lọc chính + 1 sắp xếp + 1 hành động chính (nếu có).
   Mọi thứ khác là hàng phụ.
2. **Hàng phụ phải thu gọn được.** Toàn bộ lọc nâng cao (ngày, nền
   tảng, loại nhiệm vụ, loại thưởng, nhóm, xuất, cache, code) nằm trong
   một khối "Bộ lọc nâng cao" có thể mở/thu gọn (details/summary hoặc
   nút toggle có `aria-expanded`), mặc định thu gọn. Khi thu gọn, phải
   hiện số lượng filter đang bật (ví dụ "Bộ lọc nâng cao (2)") để user
   không quên mình đang lọc.
3. **Không bao giờ để label và input chồng nhau.** Mỗi label + input là
   một khối flex riêng, có `min-width: 0`, cho phép wrap xuống dòng
   nguyên khối — không wrap nửa label, nửa input. Ô date, select và
   checkbox phải có chiều cao và line-height thống nhất với nút
   (không để select 36px kẹp giữa nút 44px rồi lệch hàng).
4. **Không đặt 2 tính năng khác nhau chung một hàng không có ranh giới.**
   Xuất dữ liệu, xóa cache, kèm code là 3 nhóm khác nhau (xuất / dữ
   liệu / phiên) — phải tách bằng nhóm hoặc tiêu đề nhỏ, không xếp
   liền nhau như một dãy nút ngang hàng.
5. **Mobile: toolbar thành 1 cột.** Ở ≤ 560px, tìm kiếm chiếm 100% chiều
   rộng ở hàng đầu; các select/filter xếp dọc hoặc thành lưới 2 cột đều
   nhau; không để select bị bóp còn một nửa chữ.
6. **Xóa tính năng = xóa sạch.** Khi user yêu cầu xóa một tính năng
   (ví dụ: yêu thích, chế độ thử mock), phải xóa đồng thời: nút UI,
   checkbox/filter liên quan, key lưu trữ, hàm xử lý, test của nó, và
   nhắc tới nó trong docs. Không được để lại checkbox chết, filter chết
   hay biến chết — đó là cách toolbar phình ra lần nữa.

## 3. Thứ bậc z-index và lớp phủ — luật chữa bệnh "lớp vô hình đè nút"

Đây là lỗi đã xảy ra thật ở mobile (ảnh user gửi 30/10/2026): mở drawer
trên trình duyệt mobile thì bấm Cài Đặt / Thống Kê / Giới Thiệu không
chuyển trang, vẫn kẹt ở Auto Quest. Nguyên nhân gốc đã xác định trong
code: `.drawer-overlay` nằm ngoài `.shell` (shell có `z-index: 10` tạo
stacking context riêng), còn overlay có `z-index: 35` — nên khi drawer
mở, overlay phủ **lên cả sidebar**, mọi cú bấm vào nav đều rơi vào
overlay (chỉ đóng drawer), không bao giờ tới được nút nav.

Luật z-index, bắt buộc cho mọi lớp phủ từ nay:

1. **Một thang z-index duy nhất, viết thành comment ở đầu `styles.css`:**
   nền (0) < nội dung chính (10) < sidebar/drawer (40) < overlay của
   drawer (35) là **sai** — thứ tự đúng phải là: nền (0) < nội dung
   chính (10) < overlay mờ (30) < drawer/sidebar (40) < modal (100) <
   toast/pill (200) < capture/hCaptcha (300+). Overlay của một lớp
   **không bao giờ** được cao hơn chính lớp nó phục vụ. Drawer phải
   cao hơn overlay của nó, modal phải cao hơn overlay của nó.
2. **Overlay và lớp nó phục vụ phải cùng một stacking context**, hoặc
   overlay phải là anh em kề của lớp đó với z-index thấp hơn. Không
   đặt overlay ngoài một container có z-index thấp hơn rồi hi vọng
   z-index con sẽ "vượt lên" — z-index con không vượt được stacking
   context của cha.
3. **Mọi phần tử fixed/absolute phủ toàn màn hình phải khai báo rõ
   `pointer-events`.** Lớp chỉ để trang trí (`.bg-layers`, glow, banner)
   phải là `pointer-events: none`. Lớp chặn tương tác (overlay, veil)
   phải là `pointer-events: auto` **chỉ khi nó đang hiện**, và khi ẩn
   phải là `pointer-events: none` (không chỉ `opacity: 0` — opacity 0
   vẫn chặn bấm).
4. **Thứ tự sự kiện của drawer:** bấm nav → chuyển trang trước → đóng
   drawer sau. Bấm overlay → chỉ đóng drawer. Bấm nút mở drawer →
   drawer mở + overlay hiện + focus vào mục nav đầu tiên. Đóng drawer
   → focus trả về nút mở. Không được để một handler đóng drawer "ăn"
   mất sự kiện chuyển trang.
5. **Kiểm tra bằng tay thật, không bằng lý luận z-index:** sau mỗi lần
   sửa drawer/modal/overlay, phải bấm thử từng mục nav, từng tab, từng
   nút ở dưới lớp phủ đó ở 375px, và chụp ảnh trạng thái drawer mở +
   drawer đóng. Nếu không bấm được, đó là lỗi chặn — dừng lại sửa ngay,
   không đẩy lên main.

## 4. Mobile-first — luật cho trình duyệt điện thoại

1. **Thiết kế từ 375px trở lên, không từ desktop thu xuống.** Viết CSS
   mobile trước, rồi mới thêm breakpoint lớn hơn. `mobile.css` chỉ được
   dùng để bổ sung, không được dùng để vá lỗi mà `styles.css` gây ra
   ở mobile — lỗi gốc phải sửa ở `styles.css`.
2. **Không cuộn ngang.** Không phần tử nào được rộng hơn viewport.
   Kiểm tra bằng cách cuộn ngang ở 375px sau mỗi thay đổi layout.
   Nguyên nhân thường gặp: `width: 100vw` + padding, flex item không
   có `min-width: 0`, grid không có `minmax(0, 1fr)`, ảnh không có
   `max-width: 100%`.
3. **Safe-area và thanh địa chỉ mobile:** dùng `100dvh` thay cho
   `100vh` ở khung chính, cộng `env(safe-area-inset-*)` cho topbar,
   content và toast. Không để nút bị thanh home indicator che.
4. **Input không gây zoom:** input/select/textarea ở màn hẹp phải
   ≥ 16px font-size, nếu không iOS sẽ tự zoom khi focus và vỡ layout.
5. **Hover không tồn tại trên cảm ứng:** không dùng `:hover` để hiện
   thông tin quan trọng (chỉ hover mới thấy = mobile không bao giờ
   thấy). Thông tin quan trọng phải luôn hiện, hoặc có nút bấm để mở.
6. **Drawer là điều hướng duy nhất ở mobile:** ở ≤ 1023px, sidebar
   thành drawer, main không còn margin-left 256px, topbar hiện nút
   mở menu. Drawer mở thì main không cuộn được phía dưới (khóa cuộn
   nền), drawer đóng thì cuộn bình thường.

## 5. Logo, ảnh thưởng và "lớp xanh chìm phía sau"

Lỗi đã báo nhiều lần: logo và ảnh quest ở light mode có lớp xanh/dark
chìm phía sau, trông bẩn. Luật:

1. **Logo và ảnh thưởng phải nằm trên nền trong suốt hoặc token trung
   tính.** Không dùng nền gradient dark, không dùng radial glow, không
   dùng màu brand làm nền cho ảnh — ở cả 2 theme. Nền của khung ảnh
   phải là `transparent` hoặc `var(--card)`/`var(--well)`, và phải
   kiểm tra ở cả light lẫn dark.
2. **Khung bao logo là viền mảnh trung tính** (`--line-strong`), không
   phải viền brand/xanh, không có glow. Ảnh logo dùng `object-fit:
   cover` hoặc `contain` tùy tỉ lệ thật của ảnh, không kéo méo ảnh.
3. **Ảnh lỗi không được để lại khoảng xanh/trống xấu:** ảnh lỗi phải
   fallback theo chuỗi đã có (asset thật → logo game → icon app),
   không bao giờ fallback về Orb cho quest không phải Orb, và không
   bao giờ để nền gradient cũ lộ ra khi ảnh chưa tải xong.
4. **Kiểm tra logo bằng screenshot ở cả 2 theme, ở 1x (không zoom),**
   vì lớp halo chỉ lộ khi nhìn ở kích thước thật. So sánh ảnh light và
   dark cạnh nhau trước khi báo xong.

## 6. Trạng thái, phản hồi và "không mù màu"

"Mù màu" ở đây không chỉ là color blindness — mà là code UI mà không
nhìn thấy kết quả thật. Luật:

1. **Mọi trạng thái phải khác nhau bằng hơn một màu:** thành công /
   lỗi / đang chờ / bị chặn phải khác nhau bằng cả text + icon + màu.
   Không dùng chỉ màu xanh/đỏ để phân biệt — user mù màu và user xem
   ảnh đen trắng đều phải phân biệt được.
2. **Trạng thái loading phải là trạng thái thật:** spinner/skeleton
   phải gắn với tiến trình thật, không phải animation trang trí chạy
   độc lập rồi nhảy từ 0% lên 100%. Khi dữ liệu chưa về, nói rõ là
   "đang tải", không hiện danh sách trống như thể đã tải xong.
3. **Lỗi phải nói được cách sửa:** toast/log lỗi phải ghi: lỗi gì,
   ở bước nào, user bấm gì tiếp theo. Không hiện lỗi chung chung
   "Đã xảy ra lỗi" rồi dừng.
4. **Số liệu phải ghi rõ nguồn:** số Orb dự báo ghi "ước tính",
   số Orb đã nhận ghi "Discord xác nhận", số đang tải ghi "đang tải".
   Không để số ước tính và số thật trông giống nhau.

## 7. Quy trình làm việc UI/UX — từng bước, không nhảy cóc

1. **Đọc file này.** (Bắt buộc, xem đầu file.)
2. **Chụp/mô tả trạng thái hiện tại:** screenshot hoặc mô tả chính xác
   màn hình, theme, kích thước, tab đang mở trước khi sửa.
3. **Audit:** liệt kê hard-code, class, z-index, token liên quan (§1.2
   bước 1). Nếu sửa toolbar, liệt kê hết các điều khiển trong toolbar
   đó trước — không thêm nút mới khi chưa liệt kê nút cũ.
4. **Viết thay đổi nhỏ nhất có thể:** một task = một vấn đề UI. Không
   gộp sửa toolbar + sửa drawer + đổi theme vào một lần sửa rồi không
   biết cái nào gây lỗi.
5. **Kiểm tra tĩnh:** grep class chưa định nghĩa, grep màu thô, grep
   inline style mới, grep giá trị spacing lẻ, `npm test`,
   `npm run check:bundle`.
6. **Kiểm tra bằng trình duyệt thật (§1.3):** screenshot 375/768/1024/
   1440, cả 2 theme, bấm qua mọi nút/tab vừa sửa, Tab qua bằng bàn
   phím, kiểm tra console.
7. **So sánh trước/sau:** nếu ảnh sau tệ hơn ảnh trước ở bất kỳ mốc
   nào, quay lại bước 4 — không đẩy lên main với lý do "nhìn chung
   vẫn ổn".
8. **Báo cáo:** file đổi, luật nào áp dụng, ảnh trước/sau, checklist
   §9 đã tick những gì, còn gì chưa kiểm chứng và vì sao.

## 8. Ngoại lệ đã biết — không được dùng làm cớ chung

| Ngoại lệ | Lý do thật | Giới hạn |
|---|---|---|
| Inline style động từ dữ liệu Discord (URL banner/avatar, biến theme, ring offset) | Không viết sẵn được trong CSS tĩnh | Chỉ những thuộc tính đó, phải có comment ghi lý do tại chỗ; không mở rộng sang màu/spacing tĩnh. |
| Inline style do hCaptcha tự chèn | Thư viện bên ngoài, không kiểm soát được | Giữ `style-src 'unsafe-inline'` cho hCaptcha, `script-src` vẫn đóng; không tự chèn thêm inline style với lý do "giống hCaptcha". |
| `WEB_BUILD_NUMBER` là placeholder | Chưa có số build thật từ client Discord | Chỉ cảnh báo hết hạn (§175), không bịa số mới để "cho đẹp". |
| Ảnh Discord từ CDN | Dữ liệu từ Discord, không phải asset của app | Vẫn phải qua chuỗi fallback và kiểm tra content-type/size ở SW cache; không dùng ảnh lạ làm nền trang. |

Ngoại lệ ngoài bảng này phải được user duyệt riêng, và phải thêm vào
bảng này kèm lý do — không tự thêm ngoại lệ ngầm trong code.

## 9. Checklist giao hàng UI/UX — tất cả phải tick, hoặc ghi rõ chưa tick vì sao

- [ ] Đã đọc file này trước khi code, và đã liệt kê luật áp dụng.
- [ ] Không màu thô mới, không spacing lẻ mới, không class chưa định
      nghĩa, không class động từ dữ liệu, không inline style mới ngoài
      §8.
- [ ] Không restyle component có sẵn tại chỗ dùng; đổi variant thì đổi
      ở chính component đó.
- [ ] Toolbar mới sửa: hàng chính ≤ 4 nhóm, lọc nâng cao thu gọn được
      + hiện số filter đang bật, không label/input chồng nhau.
- [ ] Z-index: overlay thấp hơn lớp nó phục vụ, cùng stacking context,
      phần tử ẩn có `pointer-events: none`, bấm nav/tab dưới lớp phủ
      vẫn tới được nút.
- [ ] Mobile 375px: không cuộn ngang, nút ≥ 44px, input ≥ 16px,
      drawer mở/đóng + focus trả về đúng, safe-area đủ.
- [ ] Cả 2 theme: tương phản ≥ 4.5:1, logo/ảnh không có lớp xanh/dark
      chìm phía sau, chữ không trắng trên nền trắng.
- [ ] Bàn phím: Tab đi hết các nút mới, focus nhìn thấy được, Esc đóng
      modal/drawer, focus trả về chỗ cũ.
- [ ] Reduced motion: hiệu ứng trang trí tắt, tín hiệu tiến trình vẫn
      chạy đúng.
- [ ] Text đàn hồi: tên dài, chip, badge không vỡ ở 375px, không cắt
      mất thông tin không có đường xem đủ.
- [ ] Trạng thái phân biệt bằng text + icon + màu, không chỉ màu.
- [ ] Screenshot trước/sau ở 375/768/1024/1440, cả 2 theme, kèm console
      sạch lỗi liên quan — hoặc ghi rõ "chưa kiểm chứng bằng mắt vì
      browser không tới được localhost, chờ user test trên web".
- [ ] `npm test` đạt, `npm run check:bundle` đạt, không phá PWA offline.
- [ ] Xóa tính năng (nếu có) đã xóa sạch UI + storage + filter + test
      + docs, không còn checkbox/filter chết.

## 10. Nguồn tổng hợp

- `shadcn-ui/lint` — https://github.com/shadcn-ui/lint
  (agent-first linter: no-restyle, no-raw-colors, no-arbitrary-values,
  no-inline-styles, no-unknown-classes, require-static-classes,
  contracts, custom messages, AGENTS.md lint rule).
- `nextlevelbuilder/ui-ux-pro-max-skill` —
  https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
  (design system generation, audit-map-migrate-verify, resilient text,
  compact UI, chip +n, badge không chỉ dựa vào màu, contrast 4.5:1,
  focus, reduced motion, responsive 375/768/1024/1440, no emoji icon).
- `ChromeDevTools/chrome-devtools-mcp` —
  https://github.com/ChromeDevTools/chrome-devtools-mcp
  (live Chrome inspection: screenshot, console, network, performance,
  a11y debugging; ở repo này dịch sang browser task của Muse vì không
  có MCP server gắn sẵn).

Tổng hợp ngày 2026-10-30, cho AUTO-QUEST (vanilla JS + CSS token, không
Tailwind/React). Khi một trong 3 nguồn cập nhật luật mới, cập nhật file
này trước khi áp dụng luật mới vào code — không áp luật mới trực tiếp
vào code mà chưa ghi vào đây.
