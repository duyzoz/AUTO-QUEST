"use strict";
/**
 * Waves 20: Bảng metadata nhiệm vụ Discord.
 *
 * Tham chiếu logic từ Discord-Auto-Quests (engine.ts) nhưng mở rộng:
 * - Phủ ĐỦ 20 event_name (source gốc chỉ 17) — gồm cả PLAY_ON_DESKTOP_V2 và ACHIEVEMENT_IN_*.
 * - Ưu tiên theo thứ tự: Gameplay > Streaming > Video > Social > Passive.
 *   Lý do: một quest có thể khai nhiều task, phải chọn task "nặng" nhất để chạy đúng.
 * - Mỗi task map sang `kind` — quyết định ENDPOINT sẽ gọi:
 *     video    → POST /quests/{id}/video-progress
 *     desktop  → POST /quests/{id}/heartbeat        (application_id)
 *     console  → POST /quests/{id}/console-heartbeat (application_id + platform)
 *     mobile   → POST /quests/{id}/mobile-heartbeat  (application_id + session_id)
 *     stream   → POST /quests/{id}/stream-progress   (timestamp + elapsed)
 *     activity → POST /quests/{id}/heartbeat         (stream_key) hoặc OAuth flow
 *     social   → POST /quests/{id}/social-action     (action + platform)
 *     passive  → GET  /quests/{id}/progress          (poll tới khi xong)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_META = exports.TASK_PRIORITY = void 0;
exports.taskLabelOf = taskLabelOf;
exports.taskKindOf = taskKindOf;
exports.isAutomatableKind = isAutomatableKind;
exports.pickTaskName = pickTaskName;
/**
 * Thứ tự ưu tiên khi một quest khai nhiều task.
 * Task đứng trước được chọn để cày.
 */
exports.TASK_PRIORITY = [
    // Gameplay — nhóm phổ biến nhất
    'PLAY_ON_DESKTOP',
    'PLAY_ON_DESKTOP_V2',
    'PLAY_ON_XBOX',
    'PLAY_ON_PLAYSTATION',
    'PLAY_ON_NINTENDO',
    'PLAY_ON_MOBILE',
    'PLAY_SOCIAL_GAME',
    'PLAY_ACTIVITY',
    'ACHIEVEMENT_IN_ACTIVITY',
    'ACHIEVEMENT_IN_GAME',
    // Streaming
    'STREAM_ON_DESKTOP',
    'WATCH_STREAM',
    // Video
    'WATCH_VIDEO',
    'WATCH_VIDEO_ON_MOBILE',
    // Social
    'FOLLOW_SOCIAL',
    'SHARE_CONTENT',
    'JOIN_COMMUNITY',
    'COMPLETE_SURVEY',
    // Passive (không tự cày được — chỉ theo dõi)
    'REDEEM_CODE',
    'MAKE_PURCHASE',
];
exports.TASK_META = {
    WATCH_VIDEO: { label: 'Xem video', kind: 'video' },
    WATCH_VIDEO_ON_MOBILE: { label: 'Xem video (mobile)', kind: 'video' },
    WATCH_STREAM: { label: 'Xem stream', kind: 'stream' },
    PLAY_ON_DESKTOP: { label: 'Chơi game trên PC', kind: 'desktop' },
    PLAY_ON_DESKTOP_V2: { label: 'Chơi game trên PC', kind: 'desktop' },
    STREAM_ON_DESKTOP: { label: 'Stream trên PC', kind: 'desktop' },
    PLAY_ON_XBOX: { label: 'Chơi trên Xbox', kind: 'console' },
    PLAY_ON_PLAYSTATION: { label: 'Chơi trên PlayStation', kind: 'console' },
    PLAY_ON_NINTENDO: { label: 'Chơi trên Nintendo', kind: 'console' },
    PLAY_ON_MOBILE: { label: 'Chơi trên mobile', kind: 'mobile' },
    PLAY_SOCIAL_GAME: { label: 'Chơi game social', kind: 'mobile' },
    PLAY_ACTIVITY: { label: 'Hoạt động voice/activity', kind: 'activity' },
    ACHIEVEMENT_IN_ACTIVITY: { label: 'Thành tựu trong activity', kind: 'activity' },
    ACHIEVEMENT_IN_GAME: { label: 'Thành tựu trong game', kind: 'activity' },
    FOLLOW_SOCIAL: { label: 'Theo dõi mạng xã hội', kind: 'social' },
    SHARE_CONTENT: { label: 'Chia sẻ nội dung', kind: 'social' },
    JOIN_COMMUNITY: { label: 'Tham gia cộng đồng', kind: 'social' },
    COMPLETE_SURVEY: { label: 'Hoàn thành khảo sát', kind: 'passive' },
    REDEEM_CODE: { label: 'Nhập mã quà', kind: 'passive' },
    MAKE_PURCHASE: { label: 'Mua hàng trong game', kind: 'passive' },
};
/** Lấy nhãn tiếng Việt của loại nhiệm vụ. */
function taskLabelOf(taskName) {
    if (!taskName)
        return 'Không xác định';
    return exports.TASK_META[taskName]?.label ?? taskName;
}
/** Lấy nhóm (kind) của loại nhiệm vụ — quyết định endpoint sẽ gọi. */
function taskKindOf(taskName) {
    if (!taskName)
        return 'unknown';
    return exports.TASK_META[taskName]?.kind ?? 'unknown';
}
/** Kind có tự cày được bằng API không (passive = chỉ theo dõi, unknown = bó tay). */
function isAutomatableKind(kind) {
    return kind !== 'passive' && kind !== 'unknown';
}
/**
 * Chọn event_name của quest theo thứ tự ưu tiên.
 * `tasks` là object gộp từ task_config_v2.tasks (fallback task_config.tasks).
 */
function pickTaskName(tasks) {
    if (!tasks)
        return null;
    for (const name of exports.TASK_PRIORITY) {
        if (tasks[name] != null)
            return name;
    }
    // Quest lạ: vẫn lấy key đầu tiên để không bỏ sót hoàn toàn.
    const firstKey = Object.keys(tasks)[0];
    return firstKey ?? null;
}
