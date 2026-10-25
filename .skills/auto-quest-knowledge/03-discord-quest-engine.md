# 03 — DISCORD QUEST ENGINE: Cốt lõi API & Thuật toán

> **Nguồn:** `Discord-Auto-Quests-main/` (HieuTool v2.0.0, tác giả Nguyễn Mạnh Hiếu)
> — `src/engine.ts` (618 dòng) + `farm.ts` (366 dòng) + README.
> **Vai trò:** **Toàn bộ tri thức API Discord Quest** — đây là nguồn sự thật đã dùng
> để viết `bot.ts` của AUTO-QUEST.
> ⚠️ Dùng user token tự động **có thể vi phạm ToS Discord**. Rủi ro ban tài khoản.
> Bản quyền: © 2024–2026 Nguyễn Mạnh Hiếu. Dùng cho mục đích cá nhân/học tập.

---

## 1. Kiến trúc tổng thể (2 lớp)

```
farm.ts          ← TẦNG HIỂN THỊ (UI terminal) + điều phối
  │                banner ASCII, bảng cli-table3, ticker 1s, alt-screen
  └── src/engine.ts  ← TẦNG LÕI (Discord API + logic quest)
                       Client/REST/WS, model Quest, QuestStore, executor
```

**Tách lớp rất sạch:** `engine.ts` **không biết gì** về giao diện. `farm.ts` chỉ
gọi `store.execute(q)` và vẽ trạng thái. Đây là mẫu thiết kế đáng bắt chước — cho
phép thay UI (CLI → Electron) mà không đụng lõi.

---

## 2. ⭐ 3 endpoint REST cốt lõi

Base: `https://discord.com/api/v10` (REST version `10`)

| # | Method | Endpoint | Mục đích | Body |
|---|---|---|---|---|
| 1 | `GET` | `/quests/@me` | **Lấy toàn bộ quest** + trạng thái user | — |
| 2 | `POST` | `/quests/{id}/enroll` | Đăng ký tham gia quest | `{ location: 11, is_targeted: false, metadata_raw: null }` |
| 3 | `POST` | `/quests/{id}/claim-reward` | **Nhận thưởng** (Orbs/item) | `{}` |

### Endpoint phụ theo loại nhiệm vụ
| Loại | Endpoint | Body |
|---|---|---|
| **Xem video** | `POST /quests/{id}/video-progress` | `{ timestamp: <giây> }` |
| **Xem stream** | `POST /quests/{id}/stream-progress` | `{ timestamp, elapsed }` |
| **Chơi desktop** | `POST /quests/{id}/heartbeat` | `{ application_id, terminal }` |
| **Chơi console** | `POST /quests/{id}/console-heartbeat` | `{ application_id, platform, terminal }` |
| **Chơi mobile** | `POST /quests/{id}/mobile-heartbeat` | `{ application_id, session_id: <uuid> }` |
| Tương tác xã hội | `POST /quests/{id}/social-action` | `{ action: 'follow'\|'share'\|'join', platform }` |
| Tiến trình chung | `GET /quests/{id}/progress` | — |
| **Số dư Orbs** | `GET /users/@me/virtual-currency/balance` | → `{ balance: number }` |

---

## 3. ⭐ Response `/quests/@me` — cấu trúc dữ liệu

```ts
{
  quests: QuestData[],
  excluded_quests: Partial<QuestData>[],      // ← BẪY: quest ẩn/hết hạn/khu vực khác
  quest_enrollment_blocked_until: string | null
}
```

> 🕳️ **BẪY LỚN (bài học Wave 26):** `excluded_quests` khiến danh sách **phình gấp
> đôi**. Đo thật trên AUTO-QUEST: **26 quest thật + 32 excluded = 58**. Phải lọc bỏ.
> Nếu dùng `fetchQuests(true)` của thư viện thì sẽ kéo cả đám rác này về.

### `QuestData`
```ts
{
  id: Snowflake,              // string
  config: QuestConfig,
  user_status: QuestUserStatus | null,   // null = chưa tham gia
  targeted_content: number,
  preview: boolean            // true = quest xem trước, KHÔNG làm được
}
```

### `QuestConfig`
```ts
{
  id, config_version,
  starts_at: string, expires_at: string,   // ISO date string
  features: number,
  application: { id, name, link },
  assets: { hero, hero_video, quest_bar_hero, quest_bar_hero_video, game_tile, logotype },
  colors: { primary, secondary },          // gradient
  messages: { quest_name, game_title, game_publisher },
  task_config?:   QuestTaskConfig,         // format cũ
  task_config_v2?: QuestTaskConfigV2,      // format mới — ƯU TIÊN dùng
  rewards_config: { assignment_method, rewards: QuestReward[], rewards_expire_at, platforms }
}
```

> ⚠️ **Có 2 format task:** luôn đọc `task_config_v2?.tasks ?? task_config?.tasks`
> để tương thích cả cũ lẫn mới.

### `QuestUserStatus` — ⭐ 3 cờ quyết định phân loại
```ts
{
  user_id, quest_id,
  enrolled_at: string | null,    // đã tham gia chưa
  completed_at: string | null,   // đã hoàn thành chưa
  claimed_at: string | null,     // đã nhận thưởng chưa
  claimed_tier?: number | null,
  last_stream_heartbeat_at?, stream_progress_seconds?,
  dismissed_quest_content?, progress: Record<string, QuestTaskProgress>
}
```

### `QuestTaskProgress`
```ts
{ event_name: string, value: number, updated_at: string, completed_at: string | null }
```

### `QuestReward`
```ts
{
  type: number, sku_id,
  asset?, asset_video?,
  messages: { name, name_with_article, reward_redemption_instructions_by_platform? },
  approximate_count?, redemption_link?, expires_at?,
  orb_quantity?,   // ← nếu có thì thưởng là Orbs
  quantity?
}
```

---

## 4. ⭐⭐ 3 CỜ PHÂN LOẠI — lõi nghiệp vụ (quan trọng nhất)

Đây là điểm **AUTO-QUEST từng làm sai 100%** (Wave 25). Ghi nhớ kỹ:

```ts
isExpired()   { return Date.now() > new Date(config.expires_at).getTime(); }
isCompleted() { return Boolean(userStatus?.completed_at); }
isEnrolled()  { return Boolean(userStatus?.enrolled_at); }
isClaimed()   { return Boolean(userStatus?.claimed_at); }
```

### Ánh xạ đúng → 3 tab UI
| Trạng thái | Điều kiện | Tab |
|---|---|---|
| **Chưa làm** (`todo`) | `!completed_at` | "Chưa làm" |
| **Chưa nhận** (`claimable`) | `completed_at && !claimed_at` | "Chưa nhận" |
| **Đã nhận** (`claimed`) | `completed_at && claimed_at` | "Đã làm" |

Bộ lọc của HieuTool:
```ts
pending()   = all().filter(q => q.id !== BLACKLIST_ID && !q.isCompleted() && !q.isExpired())
claimable() = all().filter(q => q.isCompleted() && !q.isClaimed())
```

> 💀 **SAI LẦM KINH ĐIỂN:** map `enrolled_at === null` (chưa tham gia) sang tab
> **"Chưa nhận"**. Kết quả: tab đó toàn quest rác/hết hạn, và tab "Chưa làm" trống.
> Logic đúng là **`claimable = completed && !claimed`** — `enrolled_at` **không**
> dùng để phân tab.

---

## 5. ⭐ Bảng `TaskType` — 18 loại nhiệm vụ

```ts
// Video & Media
WATCH_VIDEO, WATCH_VIDEO_ON_MOBILE, WATCH_STREAM
// Gaming — Desktop/PC
PLAY_ON_DESKTOP, STREAM_ON_DESKTOP
// Gaming — Console
PLAY_ON_XBOX, PLAY_ON_PLAYSTATION, PLAY_ON_NINTENDO
// Gaming — Mobile/Social
PLAY_ON_MOBILE, PLAY_ACTIVITY, PLAY_SOCIAL_GAME
// Engagement
JOIN_COMMUNITY, SHARE_CONTENT, FOLLOW_SOCIAL, COMPLETE_SURVEY
// Purchase
MAKE_PURCHASE, REDEEM_CODE
```

### ⭐ Thứ tự ưu tiên phát hiện (rất quan trọng)
Một quest có thể có nhiều task. Thứ tự `detectTaskType()` duyệt:

```
Gameplay > Streaming > Video > Social > Other
```

Cụ thể:
```
PLAY_ON_DESKTOP → PLAY_ON_XBOX → PLAY_ON_PLAYSTATION → PLAY_ON_NINTENDO
→ PLAY_ON_MOBILE → PLAY_SOCIAL_GAME → PLAY_ACTIVITY
→ STREAM_ON_DESKTOP → WATCH_STREAM → WATCH_VIDEO → WATCH_VIDEO_ON_MOBILE
→ FOLLOW_SOCIAL → SHARE_CONTENT → JOIN_COMMUNITY → COMPLETE_SURVEY
→ REDEEM_CODE → MAKE_PURCHASE
```
Trả về **task đầu tiên có mặt** (`tasks[t] != null`), không có thì `null`.

---

## 6. ⭐ Thuật toán xử lý từng loại nhiệm vụ

Tất cả đều: **enroll trước nếu chưa** → chạy vòng tiến trình → **claim reward cuối**.

### 6.1 Xem video — `executeVideoWatch` (tinh vi nhất)
```ts
const enrolledAt = new Date(userStatus.enrolled_at).getTime();
while (true) {
  // ⚠️ CHỐNG GIAN LẬN: Discord giới hạn tiến trình theo THỜI GIAN THỰC
  const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + 10;  // +10s dung sai
  const diff = maxAllowed - done;
  const next = done + 7;                        // bước nhảy 7 giây

  if (diff >= 7) {                              // chỉ gửi khi "kịp" thời gian thực
    const res = await post(`/quests/${id}/video-progress`,
                           { timestamp: Math.min(target, next + Math.random()) });
    finished = res.completed_at != null;
    done = Math.min(target, next);
  }
  if (next >= target) break;
  await sleep(1000);                            // 1 giây/nhịp
}
if (!finished) → post timestamp = target        // chốt hạ nếu chưa xong
```
> **Cơ chế then chốt:** `maxAllowed` = số giây đã trôi kể từ lúc enroll (+10s dung
> sai). Server từ chối nếu bạn "nhảy" nhanh hơn thời gian thực. Nên phải
> **sleep 1s/nhịp** và chỉ gửi khi `diff >= 7`. Bước nhảy 7s + `Math.random()` để
> tránh mẫu cố định. **Đây là lý do quest video luôn mất đúng bằng thời lượng thật.**

### 6.2 Xem stream — `executeStreamWatch`
```ts
while (done < target) {
  const elapsed = Math.floor((Date.now() - enrolledAt) / 1000);
  const next = Math.min(done + 30, target);     // bước 30s
  const res = await post(`/quests/${id}/stream-progress`, { timestamp: next, elapsed });
  done = Math.min(target, next);
  if (res.completed_at) break;
  await sleep(30_000);                          // 30 giây/nhịp
}
```

### 6.3 Chơi desktop — `executeDesktopGameplay` (heartbeat)
```ts
const appId = taskDef?.applications?.[0]?.id ?? quest.config.application.id;
while (!quest.isCompleted()) {
  const res = await post(`/quests/${quest.id}/heartbeat`,
                         { application_id: appId, terminal: false });
  quest.refreshStatus(res);                     // ← cập nhật lại trạng thái từ response
  await sleep(60_000);                          // 60 giây/heartbeat
}
// chốt: gửi terminal: true
await post(`/quests/${quest.id}/heartbeat`, { application_id: appId, terminal: true });
```
> **`application_id` lấy từ đâu:** ưu tiên `task_def.applications[0].id`, fallback
> `config.application.id`. Dùng sai id → heartbeat không tính.

### 6.4 Console — `executeConsoleGameplay`
```ts
while (!isCompleted()) {
  await post(`/quests/${id}/console-heartbeat`, {
    application_id: appId,
    platform: taskType.replace('PLAY_ON_', ''),   // 'XBOX'|'PLAYSTATION'|'NINTENDO'
    terminal: false
  }).catch(() => null);                          // ← lỗi không chết vòng lặp
  await sleep(60_000);
}
// chốt terminal: true (cũng .catch)
```

### 6.5 Mobile / Social game — `executeMobileGameplay`
```ts
while (!isCompleted()) {
  await post(`/quests/${id}/mobile-heartbeat`, {
    application_id: appId,
    session_id: randomUUID()                     // ← session mới mỗi lần
  }).catch(() => null);
  await sleep(45_000);                           // 45 giây
}
```

### 6.6 Tương tác xã hội (một lần) 
`FOLLOW_SOCIAL` / `SHARE_CONTENT` / `JOIN_COMMUNITY`:
```ts
await post(`/quests/${id}/social-action`, { action: 'follow'|'share'|'join', platform: 'social'|'community' });
```

### 6.7 Tiến trình chung (survey/code/purchase)
```ts
let attempts = 0, maxAttempts = 100;
while (!isCompleted() && attempts < maxAttempts) {
  await get(`/quests/${quest.id}/progress`).catch(() => null);
  attempts++; await sleep(10_000);               // 10s, tối đa 100 lần (~16 phút)
}
```

---

## 7. ⭐⭐ GIẢ MẠO CLIENT — bí quyết để API không chặn

Đây là phần "phép thuật" khiến request giống hệt Discord Client chính thức.

### 7.1 `USER_AGENT` (bắt buộc khớp)
```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)
discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36
```

### 7.2 `CLIENT_PROPS` → `x-super-properties` (base64 của JSON này)
```ts
{
  os: 'Windows', browser: 'Discord Client', release_channel: 'stable',
  client_version: '1.0.9215', os_version: '10.0.19045', os_arch: 'x64', app_arch: 'x64',
  system_locale: 'en-US', has_client_mods: false,
  client_launch_id: randomUUID(),          // ← ngẫu nhiên mỗi phiên
  browser_user_agent: USER_AGENT, browser_version: '37.6.0', os_sdk_version: '19045',
  client_build_number: 471091, native_build_number: 72186,
  client_event_source: null,
  launch_signature: randomUUID(),          // ← ngẫu nhiên
  client_heartbeat_session_id: randomUUID(),// ← ngẫu nhiên
  client_app_state: 'focused'
}
```
Gửi: `Buffer.from(JSON.stringify(CLIENT_PROPS)).toString('base64')`

### 7.3 ⭐ `patchedFetch` — vá từng request header
```ts
if (headers.has('Authorization'))
  headers.set('Authorization', headers.get('Authorization').replace('Bot ', ''));  // ← BỎ 'Bot '
headers.set('User-Agent', USER_AGENT);
headers.append('accept-language', 'vi');
headers.append('origin', 'https://discord.com');
headers.append('pragma', 'no-cache');
headers.append('priority', 'u=1, i');
headers.append('referer', 'https://discord.com/channels/@me');
headers.append('sec-ch-ua', '"Not)A;Brand";v="8", "Chromium";v="138"');
headers.append('sec-ch-ua-mobile', '?0');
headers.append('sec-ch-ua-platform', '"Windows"');
headers.append('sec-fetch-dest', 'empty');
headers.append('sec-fetch-mode', 'cors');
headers.append('sec-fetch-site', 'same-origin');
headers.append('x-debug-options', 'bugReporterEnabled');
headers.append('x-discord-locale', 'en-US');
headers.append('x-discord-timezone', 'Asia/Saigon');
headers.append('x-super-properties', <base64 CLIENT_PROPS>);
```
> 🔑 **Mấu chốt:** thư viện `@discordjs/rest` mặc định gửi `Authorization: Bot <token>`.
> Phải **`.replace('Bot ', '')`** để thành user token thuần. Đây là điều kiện sống còn.
> Ngoài ra phải có đủ cặp `sec-fetch-*` và `x-super-properties` — thiếu là bị chặn.

### 7.4 ⭐ Vá WebSocket IDENTIFY
```ts
WebSocketShard.prototype.send = async function (payload) {
  if (payload.op === GatewayOpcodes.Identify) {
    payload.d = {
      token, properties: { ...CLIENT_PROPS, is_fast_connect: false, gateway_connect_reasons: 'AppSkeleton' },
      capabilities: 0, presence, compress, client_state: { guild_versions: {} }
    };
  }
  return origSend.call(this, payload);
};
```
Kèm override `fetchGatewayInformation` trả `wss://gateway.discord.gg` với 1 shard
(tránh thư viện gọi REST `/gateway/bot` bằng Bot token).

> ⚠️ **Bẫy gọi `fetchGatewayInformation`:** nếu để mặc định, thư viện sẽ gọi
> `/gateway/bot` (yêu cầu Bot token) → lỗi 401. Phải tự override như trên.

---

## 8. Luồng chạy hoàn chỉnh (`farm.ts`)

```
1. new HieuTool(TOKEN)                     → dựng REST (patchedFetch) + WS manager
2. app.start()                             → ws.connect()
3. on('READY') do:
   a. getBalance()                         → số Orbs đầu (bỏ qua nếu lỗi)
   b. loadQuests()                         → GET /quests/@me → QuestStore
   c. Nếu có claimable() → grabAllRewards()  ← NHẬN TRƯỚC, không cần làm lại
   d. pending() rỗng? → in bảng tổng kết tất cả quest rồi thoát
   e. Ngược lại:
      - live = pending.map(...)            ← dựng model hiển thị
      - enterAltScreen()                   ← \x1b[?1049h\x1b[?25l (màn phụ, ẩn con trỏ)
      - setInterval 1s: đếm ngược + draw()  ← ticker UI
      - await Promise.allSettled(pending.map(q => store.execute(q)))  ← CHẠY SONG SONG
      - clearInterval, exitAltScreen()
      - getBalance() → tính gained = sau - trước
      - draw() + report()
```

### ⭐ Điểm thiết kế đáng học
| Kỹ thuật | Giá trị |
|---|---|
| **`Promise.allSettled`** | Chạy **mọi quest song song**; 1 quest lỗi không giết cả mẻ |
| **`claimable()` claim trước** | Nhận thưởng cũ trước khi làm quest mới |
| **`ticker` 1s + `\x1b[H\x1b[J`** | Vẽ lại UI terminal tại chỗ, không nhấp nháy |
| **Alt screen (`\x1b[?1049h`)** | UI tạm chiếm màn hình, thoát trả lại nguyên trạng |
| **`SIGINT` → `exitAltScreen`** | Ctrl+C luôn trả màn hình sạch |
| **`refreshStatus(res)`** | Mỗi response **cập nhật lại** user_status tại chỗ |
| **`.catch(() => null)`** | Heartbeat/console/mobile lỗi thì bỏ qua, không crash |
| **`gained = after - before`** | Đo Orbs thực nhận, không đoán |

---

## 9. ⭐ Wrapper `Quest` — API tiện dụng

```ts
class Quest {
  static from(raw: QuestData): Quest
  get id / config / userStatus / preview
  isExpired(now = new Date()) / isCompleted() / isEnrolled() / isClaimed()
  refreshStatus(status)        // cập nhật user_status tại chỗ
  detectTaskType(): TaskType | null
  getTarget(): number          // mặc định 900 nếu không có
  getProgress(): number
  getRemaining(): number       // max(0, target - progress)
  getRewardLabel(): string     // "50 Orbs" hoặc messages.name
  get name(): string           // messages.quest_name || id
}
```

### `QuestStore` (Iterable)
```ts
class QuestStore implements Iterable<Quest> {
  all() / find(id) / get count
  pending()        // chưa xong + chưa hết hạn + không nằm blacklist
  claimable()      // xong + chưa nhận
  enroll(id)       // POST enroll + refreshStatus
  grabReward(id)   // claim, lỗi → null
  grabAllRewards() // vòng qua claimable()
  execute(quest)   // điều phối theo taskType → rồi grabReward
}
```

> **Blacklist cứng:** `q.id !== '1412491570820812933'` — một quest cụ thể bị loại
> (có thể do lỗi/vô hạn). Đáng chú ý khi port.

---

## 10. Bảng tra "triệu chứng → nguyên nhân"

| Triệu chứng | Nguyên nhân | Cách xử |
|---|---|---|
| Danh sách phình gấp đôi | Không lọc `excluded_quests` | Chỉ lấy `res.quests` |
| 401 khi khởi động | Thư viện gọi `/gateway/bot` bằng Bot token | Override `fetchGatewayInformation` |
| Request bị chặn 403 | Header giả mạo thiếu | Đủ `sec-fetch-*` + `x-super-properties` |
| `Authorization` sai | Thư viện gửi `Bot <token>` | `.replace('Bot ', '')` trong patchedFetch |
| Quest video nhảy sai | Gửi tiến trình nhanh hơn thời gian thực | `maxAllowed = elapsed + 10`, sleep 1s |
| Tab "Chưa nhận" toàn rác | Dùng `enrolled_at` để phân tab | `claimable = completed && !claimed` |
| Quest hết hạn vẫn hiện | Không lọc `expired` | `!isExpired()` |
| Quest preview lọt vào | Không lọc `preview` | Bỏ `q.preview === true` |
| Heartbeat không tính | `application_id` sai | `task_def.applications[0].id ?? config.application.id` |
| UI treo khi 1 quest lỗi | Dùng `Promise.all` | Dùng `Promise.allSettled` |
| Ctrl+C để lại màn hình bẩn | Không exit alt-screen | Bắt `SIGINT` → `exitAltScreen()` |

---

## 11. Liên hệ với AUTO-QUEST (bản Electron)

AUTO-QUEST port `engine.ts` → `electron/bot/bot.ts` với các thay đổi:
- **Bỏ UI terminal** → phát event ra renderer (`quest:item`, `quest:inventory`,
  `quest:claim`, `scan:start/complete`, `log`) thay vì vẽ bảng.
- **Stream từng quest** (`quest:item`) thay vì gom 1 cục — thẻ hiện dần, UX tốt hơn.
- **Thêm `seenIds: Set`** để dedupe (engine gốc không có).
- **Gom log claim** thành 1 dòng tổng kết/phiên thay vì sổ từng dòng (tránh spam).
- **Ánh xạ `status = todo | claimable | claimed`** đúng theo §4.
- Giữ nguyên: `patchedFetch`, `CLIENT_PROPS`, WebSocket patch, thuật toán video
  `maxAllowed`, `Promise.allSettled`, các endpoint.

> **Kết luận:** mọi giá trị của repo này nằm ở **§2–§7** (endpoint + cờ phân loại +
> header giả mạo + thuật toán chống gian lận). Đó là thứ **không thể tự đoán ra** —
> phải trích từ code chạy được.

---

## 12. Bản đồ file nguồn

```
Discord-Auto-Quests-main/
├── farm.ts           # 366 dòng — UI terminal + điều phối
├── src/engine.ts     # 618 dòng — LÕI: API + Quest + QuestStore   ⭐
├── .env              # TOKEN=... (KHÔNG commit)
├── package.json      # @discordjs/core|rest|ws, discord-api-types, undici, chalk, cli-table3
├── tsconfig.json     # target es2016, commonjs, strict
├── index.html        # 68KB — trang giới thiệu
└── LICENSE           # Proprietary — © Nguyễn Mạnh Hiếu
```
Chạy: `npm install` → tạo `.env` với `TOKEN=` → `npm run go`
(`tsx --env-file=.env farm.ts`). Node ≥ 18.
