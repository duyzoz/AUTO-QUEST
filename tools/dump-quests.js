/* Waves 32: dump TOÀN BỘ quest thật từ Discord (chỉ ĐỌC) ra JSON để phân tích.
   Chạy qua Electron để dùng được safeStorage giải mã token đã lưu. */
const { app, safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'build-release', 'ui-preview', 'real-quests.json');

app.whenReady().then(async () => {
  app.setName('AUTO-QUEST');
  const cfgPath = path.join(app.getPath('appData'), 'AUTO-QUEST', 'autoquest_config.json');
  let token = null;
  try {
    const c = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    if (c.tokenEnc && safeStorage.isEncryptionAvailable()) {
      token = safeStorage.decryptString(Buffer.from(c.tokenEnc, 'base64'));
    } else if (c.token) token = c.token;
  } catch (e) { console.log('CFG_ERR', e.message); }
  if (!token) { console.log('NO_TOKEN'); app.quit(); return; }
  console.log('TOKEN_OK len=' + token.length);

  const get = async (u) => {
    const r = await fetch('https://discord.com/api/v10' + u, { headers: { Authorization: token } });
    return { status: r.status, json: await r.json().catch(() => null) };
  };

  const q = await get('/quests/@me');
  console.log('QUESTS', q.status);
  const all = [...(q.json?.quests || []), ...(q.json?.excluded_quests || [])];
  console.log('TOTAL', all.length);

  const rows = all.map((x) => {
    const cfg = x.config || {};
    const rr = cfg.rewards_config || {};
    const rewards = Array.isArray(rr.rewards) ? rr.rewards : [];
    const orb = rewards.find((r) => (r.orb_quantity || 0) > 0);
    return {
      id: x.id,
      name: cfg.messages?.quest_name,
      task: Object.keys(cfg.task_config?.tasks || {})[0] || 'UNKNOWN',
      platforms: JSON.stringify(rr.platforms),
      hasOrb: !!orb,
      orb: orb?.orb_quantity || 0,
      rewardsCount: rewards.length,
      expired: cfg.expires_at ? new Date(cfg.expires_at) < new Date() : null,
      startsAt: cfg.starts_at,
      expiresAt: cfg.expires_at,
      completedAt: x.user_status?.completed_at || null,
      claimedAt: x.user_status?.claimed_at || null,
      enrolledAt: x.user_status?.enrolled_at || null,
      preview: x.preview === true,
      trafficRaw: x.traffic_metadata_raw ? 'PRESENT' : 'null',
      trafficSealed: x.traffic_metadata_sealed ? 'PRESENT' : 'null',
    };
  });
  fs.writeFileSync(OUT, JSON.stringify(rows, null, 1), 'utf8');
  console.log('WROTE', OUT, rows.length, 'rows');

  // Phân tích các ID trong log của bro
  const focus = ['1552735480024531076','1554689886835966094','1552381063475499109','1534314625397686472','1559699706798407791','1547647018090893312'];
  for (const id of focus) {
    const r = rows.find((x) => x.id === id);
    console.log('---', id, r ? JSON.stringify(r) : 'NOT_IN_LIST');
  }
  app.quit();
});
