/* Waves 42 — KIỂM CHỨNG luồng nạp nhiệm vụ "chuẩn" theo repo tham chiếu
   (discord-quest-helper / discord_api.rs).
   Dùng ĐÚNG dạng dữ liệu Discord trả về để kiểm 3 việc:
     1) Phân loại tab: todo / claimable / claimed (đúng luật dự án).
     2) getTaskProgress đọc user_status.progress, và fallback
        stream_progress_seconds khi progress rỗng (giống discord_api.rs).
     3) Không dùng enrolled_at để phân loại (nó chỉ là "đã nhận quest").
   Chạy trên code ĐÃ BIÊN DỊCH trong electron/bot/src. */
const path = require('path');
const BOT = path.join(__dirname, '..', 'electron', 'bot', 'src');
const { QuestManager } = require(path.join(BOT, 'questManager.js'));
const { Quest } = require(path.join(BOT, 'quest.js'));

// Dạng quest thật: config.assets.hero/hero_video/logotype/game_tile
const mkQuest = (id, userStatus, extra = {}) => ({
  id,
  targeted_content: 0,
  preview: false,
  user_status: userStatus,
  config: {
    id,
    application: { id: '999888777666555', name: 'Game', icon: 'a_reficon' },
    messages: { quest_name: 'Quest ' + id },
    assets: { hero: 'hero_' + id, hero_video: null, logotype: 'logo_' + id, game_tile: null },
    task_config: { tasks: { WATCH_VIDEO: { target: 900, applications: [{ id: '555' }] } } },
    ...extra,
  },
});

const cases = [
  ['todo      (chưa xong)', { user_id: '1', enrolled_at: '2026-01-01T00:00:00Z', completed_at: null, claimed_at: null, progress: {} }, 'todo'],
  ['claimable (xong chưa nhận)', { user_id: '1', enrolled_at: '2026-01-01T00:00:00Z', completed_at: '2026-01-02T00:00:00Z', claimed_at: null, progress: {} }, 'claimable'],
  ['claimed   (đã nhận)', { user_id: '1', enrolled_at: '2026-01-01T00:00:00Z', completed_at: '2026-01-02T00:00:00Z', claimed_at: '2026-01-03T00:00:00Z', progress: {} }, 'claimed'],
  ['chỉ enrolled (KHÔNG tính là xong)', { user_id: '1', enrolled_at: '2026-01-01T00:00:00Z', completed_at: null, claimed_at: null, progress: {} }, 'todo'],
];

let pass = 0, fail = 0;
console.log('=== 1) PHÂN LOẠI TAB (đúng luật: completed_at / claimed_at) ===');
// Phân loại dùng ĐÚNG API thật của Quest: hasClaimedRewards() + isCompleted().
// TUYỆT ĐỐI không dùng enrolled_at (chỉ nghĩa "đã nhận quest").
function bucket(q) {
  if (q.hasClaimedRewards()) return 'claimed';
  if (q.isCompleted()) return 'claimable';
  return 'todo';
}
for (const [label, us, want] of cases) {
  const q = Quest.create(mkQuest('q', us));
  const got = bucket(q);
  const ok = got === want;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${label.padEnd(34)} -> ${got} (mong đợi ${want})`);
}

console.log('\n=== 2) ĐỌC TIẾN ĐỘ (progress + stream_progress_seconds) ===');
const withProgress = Quest.create(mkQuest('q1', { user_id: '1', enrolled_at: 'x', completed_at: null, claimed_at: null, progress: { WATCH_VIDEO: { value: 450 } } }));
const p1 = QuestManager.getTaskProgress(withProgress);
const okp1 = p1 === 450; okp1 ? pass++ : fail++;
console.log(`${okp1 ? 'OK  ' : 'FAIL'}  progress.value=450          -> ${p1} (mong đợi 450)`);

const streamOnly = Quest.create(mkQuest('q2', { user_id: '1', enrolled_at: 'x', completed_at: null, claimed_at: null, progress: {}, stream_progress_seconds: '120' }));
const p2 = QuestManager.getTaskProgress(streamOnly);
const okp2 = p2 === 120; okp2 ? pass++ : fail++;
console.log(`${okp2 ? 'OK  ' : 'FAIL'}  stream_progress_seconds=120 -> ${p2} (mong đợi 120)`);

const empty = Quest.create(mkQuest('q3', { user_id: '1', enrolled_at: 'x', completed_at: null, claimed_at: null, progress: {} }));
const p3 = QuestManager.getTaskProgress(empty);
const okp3 = p3 === 0; okp3 ? pass++ : fail++;
console.log(`${okp3 ? 'OK  ' : 'FAIL'}  không có dữ liệu             -> ${p3} (mong đợi 0)`);

console.log('\n=== 3) ENDPOINT DÙNG ĐÚNG CHUẨN ===');
const src = require('fs').readFileSync(path.join(BOT, 'client.js'), 'utf8');
const usesMe = /\/quests\/@me/.test(src);
const usesClaim = /claim-reward/.test(require('fs').readFileSync(path.join(BOT, 'questManager.js'), 'utf8'));
const usesVideo = /video-progress/.test(require('fs').readFileSync(path.join(BOT, 'questManager.js'), 'utf8'));
[['GET /quests/@me (nạp nhiệm vụ)', usesMe], ['POST /quests/{id}/claim-reward (nhận thưởng)', usesClaim], ['POST /quests/{id}/video-progress (tiến độ video)', usesVideo]].forEach(([l, ok]) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${l}`);
});

console.log(`\n=== KẾT QUẢ: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
