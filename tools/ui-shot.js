/* Harness: nạp index.html với api giả + dữ liệu nhiệm vụ mẫu, chụp ảnh để kiểm layout. */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const OUT = path.join(__dirname, '..', 'build-release', 'ui-preview');

function buildTestHtml(list) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  // Dữ liệu để ở file .js riêng (CSP chặn inline script, và tránh nhét JSON khổng lồ
  // vào executeJavaScript gây lỗi parse).
  fs.writeFileSync(path.join(ROOT, 'harness-data.js'), 'window.__LIST = ' + JSON.stringify(list) + ';\n', 'utf8');
  // CSP chặn inline script → phải dùng file .js cùng thư mục ('self')
  const stubFile = path.join(ROOT, 'harness-api.js');
  fs.writeFileSync(
    stubFile,
    `(function(){
    const handlers = { log: null, event: null, state: null };
    window.__h = handlers; console.log('HARNESS API READY');
    const asyncFn = () => Promise.resolve({ ok: true, state: 'idle', config: {} });
    window.autoquest = new Proxy({}, {
      get(_t, k) {
        if (k === 'onLog') return (fn) => { handlers.log = fn; };
        if (k === 'onEvent') return (fn) => { handlers.event = fn; };
        if (k === 'onState') return (fn) => { handlers.state = fn; };
        if (k === 'authCheck') return () => Promise.resolve({ ok: false });
        if (k === 'saveLog') return () => Promise.resolve({ ok: true });
        if (k === 'start') return (cfg) => { window.__lastStart = cfg; return Promise.resolve({ ok: true }); };
        if (k === 'openUrl' || k === 'openDataFolder' || k === 'writeClipboard') return () => Promise.resolve();
        return asyncFn;
      }
    });
  })();`,
    'utf8',
  );
  return html.replace(
    '<script src="renderer.js"></script>',
    `<script src="harness-api.js"></script>\n<script src="harness-data.js"></script>\n<script src="renderer.js"></script>`,
  );
}

const SAMPLE = (i) => {
  const games = ['EA SPORTS FC™ 27', 'Risk of Rain 2', 'Where Winds Meet', 'Valorant Aces', 'Deadzone 2'];
  const pubs = ['Electronic Arts', '2K Games', 'NetEase', 'Riot Games', 'Gaijin'];
  const g = i % games.length;
  const done = i >= 9;
  return {
    id: 'q' + i,
    name: games[g],
    task: 'PLAY_ON_DESKTOP',
    taskLabel: 'Chơi trên PC',
    application: pubs[g],
    secondsNeeded: 900,
    secondsDone: done ? 900 : Math.round(900 * ((i * 17) % 100) / 100),
    orbs: 700 + i * 50,
    status: done ? 'claimed' : i < 2 ? 'claimable' : 'todo',
    automatable: i !== 5,
    hero: '',
    gameTile: '',
    logotype: '',
    publisher: pubs[g],
    gameTitle: games[g],
    expiresAt: '2026-10-25T12:00:00+00:00',
    colorPrimary: ['#5865f2', '#2d7d46', '#8b5cf6', '#c0392b', '#1f6f8b'][g],
    colorSecondary: ['#1b1e3a', '#12331f', '#2a1f4a', '#3a1414', '#0e2a33'][g],
    rewardKind: i === 4 ? 'item' : 'orbs',
    rewardTitle: i === 4 ? 'Nhận an Acolyte Survivor Avatar Decoration' : `Nhận ${700 + i * 50} Orbs`,
    rewardAsset: '',
    rewardName: i === 4 ? 'an Acolyte Survivor Avatar Decoration' : `${700 + i * 50} Discord Orbs`,
  };
};

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = path.join(ROOT, '.harness.html');

  // Waves 23: ưu tiên dữ liệu THẬT (tools/dump-quests.js) để thấy ảnh banner/logo thật
  const realFile = path.join(OUT, 'real-quests.json');
  let list = null;
  if (fs.existsSync(realFile)) {
    try {
      list = JSON.parse(fs.readFileSync(realFile, 'utf8'));
      console.log('dùng dữ liệu THẬT:', list.length, 'nhiệm vụ');
    } catch (e) {
      console.log('real data lỗi:', e.message);
    }
  }
  if (!Array.isArray(list) || !list.length) {
    list = Array.from({ length: 12 }, (_, i) => SAMPLE(i));
    console.log('dùng dữ liệu mẫu');
  }
  fs.writeFileSync(tmp, buildTestHtml(list), 'utf8');

  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: true,
    backgroundColor: '#05060b',
    webPreferences: { contextIsolation: false, nodeIntegration: false, backgroundThrottling: false },
  });

  win.webContents.on('console-message', (_e, lvl, msg) => console.log('[renderer]', lvl, msg));
  win.showInactive();
  await win.loadFile(tmp);

  // Đợi renderer gắn handler rồi bơm dữ liệu
  await new Promise((r) => setTimeout(r, 700));

  // Waves 24: ảnh TRƯỚC khi quét — phải là trạng thái RỖNG, không xoay vòng
  fs.writeFileSync(path.join(OUT, 'boot.png'), (await win.webContents.capturePage()).toPNG());
  const bootState = await win.webContents.executeJavaScript(`(function(){
    const st = document.getElementById('stateActive');
    const spin = st.querySelector('.snake-spin');
    return {
      isEmpty: st.classList.contains('is-empty'),
      noSpinner: !spin,
      text: st.querySelector('.qstate-text').textContent.trim(),
      cards: document.querySelectorAll('.qcard, .qdone').length,
      logCount: document.getElementById('logCount').textContent,
      u229Lines: document.querySelectorAll('.u229-line').length,
      terminal: !!document.querySelector('#console.u229'),
      dots: document.querySelectorAll('.log-dot').length,
      sideScan: !!document.querySelector('.side-actions #btnScan'),
      actionsUnderGrid: !!document.querySelector('.quests-card .quest-actions #btnScan'),
    };
  })()`, true);
  console.log('BOOTSTATE:', JSON.stringify(bootState));

  // Waves 25: mô phỏng máy bật "giảm chuyển động" (Windows: Show animations = Off)
  // — đây là điều kiện làm thanh nạp ĐỨNG IM ở bản trước. Phải đo trong điều kiện này.
  try {
    win.webContents.debugger.attach('1.3');
    await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
      media: '',
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    console.log('EMULATED reduced-motion: ON');
  } catch (e) {
    console.log('emulate fail:', e.message);
  }

  const ok = await win.webContents.executeJavaScript(`
    (function(){
      if (!window.__h || !window.__h.event) return 'no-handler';
      if (!window.__LIST) return 'no-list';
      window.__h.event({ type: 'scan:start', data: { total: window.__LIST.length } });
      setTimeout(()=>{ window.__h.event({ type: 'quest:scan-progress', data: { done: Math.round(window.__LIST.length * 0.45), total: window.__LIST.length } }); }, 120);
      return 'started';
    })()
  `, true).catch((e) => 'err:' + e.message);

  console.log('inject:', ok);
  await new Promise((r) => setTimeout(r, 400));

  // Waves 41: ĐO CHUYỂN ĐỘNG — dòng tiến trình terminal phải đổi số/thanh theo
  // thời gian, kể cả khi hệ điều hành bật "giảm chuyển động".
  const sampleBar = () => win.webContents.executeJavaScript(
    "(()=>{const i=document.querySelector('.u229-prog-bar');return i?i.textContent:null;})()", true);
  const w1 = await sampleBar();
  await new Promise((r) => setTimeout(r, 260));
  const w2 = await sampleBar();
  await new Promise((r) => setTimeout(r, 260));
  const w3 = await sampleBar();
  const animState = await win.webContents.executeJavaScript(`(function(){
    const prog = document.querySelector('.u229-prog');
    const bar = prog ? prog.querySelector('.u229-prog-bar') : null;
    const cs = bar ? getComputedStyle(bar) : null;
    const typing = document.querySelector('.u229-line.is-typing');
    return {
      progExists: !!prog,
      barText: bar ? bar.textContent : null,
      barColor: cs ? cs.color : null,
      typingCaret: typing ? getComputedStyle(typing, '::after').content : null,
      reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      noLegacyLoader: !document.querySelector('.log-loader, .ll-bar, .snake-spin'),
    };
  })()`, true);
  console.log('MOTION:', JSON.stringify({ w1, w2, w3, moved: w1 !== w2 || w2 !== w3, ...animState }));
  fs.writeFileSync(path.join(OUT,'scanning.png'), (await win.webContents.capturePage()).toPNG());
  const logRect = await win.webContents.executeJavaScript("(()=>{const b=document.getElementById('consoleCard').getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),width:Math.round(b.width),height:Math.round(b.height)};})()", true);
  if (logRect) {
    fs.writeFileSync(path.join(OUT,'log-zoom.png'), (await win.webContents.capturePage({x:logRect.x-4,y:logRect.y-4,width:logRect.width+8,height:logRect.height+8})).toPNG());
  }
  const loadState = await win.webContents.executeJavaScript("(()=>({progText:document.querySelector('.u229-prog-label')?document.querySelector('.u229-prog-label').textContent:null, progPct:document.querySelector('.u229-prog-pct')?document.querySelector('.u229-prog-pct').textContent:null, progCount:document.querySelector('.u229-prog-count')?document.querySelector('.u229-prog-count').textContent:null, stateActiveHidden:document.getElementById('stateActive').hidden, isEmpty:document.getElementById('stateActive').classList.contains('is-empty'), logCount:document.getElementById('logCount').textContent, cards:document.querySelectorAll('.qcard').length}))()", true);
  console.log('LOADSTATE:', JSON.stringify(loadState));
  // Waves 27: bot stream từng quest (quest:item) → UI gom vào RAM, KHÔNG render.
  // Chỉ khi quest:inventory tới mới đổ ra hết + hiệu ứng trôi vào.
  const inv = await win.webContents.executeJavaScript(`(function(){
    const list = window.__LIST;
    list.forEach((q, i) => {
      setTimeout(() => window.__h.event({ type: 'quest:item', data: q }), i * 30);
    });
    setTimeout(() => window.__h.event({ type: 'quest:inventory', data: { quests: list } }), list.length * 30 + 120);
    setTimeout(() => window.__h.event({ type: 'scan:complete', data: {} }), list.length * 30 + 400);
    return {sent:list.length};
  })()`, true);
  // Đo giữa chừng: lúc đang stream, thẻ PHẢI CHƯA xuất hiện (buffer RAM).
  await new Promise((r) => setTimeout(r, Math.round(list.length * 30 * 0.6)));
  const midBuffer = await win.webContents.executeJavaScript(
    "(()=>({cardsMidStream:document.querySelectorAll('.qcard').length}))()", true);
  console.log('MIDSTREAM:', JSON.stringify(midBuffer));
  await new Promise((r) => setTimeout(r, Math.round(list.length * 30 * 0.6) + 700));
  const afterInv = await win.webContents.executeJavaScript(`(function(){
    return {
      cards: document.querySelectorAll('.qcard').length,
      done: document.querySelectorAll('.qdone').length,
      newList: document.querySelectorAll('#questListNew .qcard').length,
      itemCards: document.querySelectorAll('[data-reward-kind="item"]').length,
      qin: document.querySelectorAll('.qcard.qin, .qdone.qin').length,
    };
  })()`, true);
  console.log('AFTER INVENTORY:', JSON.stringify(afterInv));

  /* ── Waves 40 (B/C) — KIỂM CHỨNG THẬT logic mới, KHÔNG đổi UI ──
     Thẻ đầu tiên là 'claimable'. Ép main giả trả `captchaRequired` (KHÔNG kèm key)
     → nhánh mở modal; rồi ép trả captchaRequired CÓ captchaKey → nhánh "dừng vòng
     lặp" phải đổi nút thành act=open, nhãn "Mở Discord để nhận", và bấm vào phải
     gọi openQuest (KHÔNG gọi lại claim). Markup/class nút giữ nguyên.            */
  const wave40 = await win.webContents.executeJavaScript(`(async function(){
    const out = {};
    const t = document.getElementById('token'); if (t) t.value = 'x.y.z';
    // Cần thẻ ở trạng thái 'claimable' (nút mới bấm được). Bơm riêng 1 quest như vậy.
    const q = Object.assign({}, window.__LIST[0], {
      id: 'w40-claimable', status: 'claimable', flag: '', running: false,
      secondsDone: window.__LIST[0].secondsNeeded, orbs: 700,
    });
    window.__h.event({ type: 'quest:item', data: q });
    window.__h.event({ type: 'quest:inventory', data: { quests: [q] } });
    await new Promise(r => setTimeout(r, 300));

    const card = [...document.querySelectorAll('#questListNew .qcard')].find(c => c.dataset.questId === 'w40-claimable');
    if (!card) return { err: 'không tạo được thẻ claimable (tab Chưa nhận)' };
    const btn = card.querySelector('.qcard-act');
    out.tag = btn.tagName;
    out.cls = btn.className;
    out.actBefore = btn.dataset.act;
    out.disabledBefore = btn.disabled;

    let openCalled = null;
    let claimCalls = 0;
    let lastClaimPayload = null;
    const origClaim = window.autoquest.claimQuest;
    window.autoquest.openQuest = (id) => { openCalled = id; return Promise.resolve({ ok: true, via: 'app' }); };
    // Lần gọi claim trả "đã có captchaKey rồi vẫn bị đòi" → kích hoạt nhánh claimOpenDiscord.
    window.autoquest.claimQuest = (payload) => {
      claimCalls++;
      lastClaimPayload = payload && payload.captchaKey ? 'has-key' : 'no-key';
      return Promise.resolve({ captchaRequired: true, captcha: {} , _forceKey: true});
    };

    btn.click();
    await new Promise(r => setTimeout(r, 400));
    out.claimCalls = claimCalls;
    out.actAfter = btn.dataset.act;
    out.labelAfter = btn.querySelector('span') ? btn.querySelector('span').textContent : btn.textContent;
    out.clsAfter = btn.className;
    out.disabledAfter = btn.disabled;

    // Bấm nút sau lỗi → phải gọi openQuest (không tăng claimCalls).
    const callsBefore = claimCalls;
    btn.click();
    await new Promise(r => setTimeout(r, 250));
    out.openCalled = openCalled;
    out.claimCallsUnchanged = claimCalls === callsBefore;
    window.autoquest.claimQuest = origClaim;
    return out;
  })()`, true);
  console.log('W40-LOGIC:', JSON.stringify(wave40));
  const fadeState = await win.webContents.executeJavaScript("(()=>{const l=document.querySelector('.u229-prog');return {exists:!!l, label:l?l.querySelector('.u229-prog-label').textContent:null, pct:l?l.querySelector('.u229-prog-pct').textContent:null};})()", true);
  console.log('FADESTATE:', JSON.stringify(fadeState));
  const scanShot = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUT,'scanning.png'), scanShot.toPNG());
  await new Promise((r) => setTimeout(r, 1200));
  const afterState = await win.webContents.executeJavaScript("(()=>({progGone:!document.querySelector('.u229-prog'), logCount:document.getElementById('logCount').textContent, u229Lines:[...document.querySelectorAll('.u229-line')].map(e=>e.textContent)}))()", true);
  console.log('AFTERSTATE:', JSON.stringify(afterState));

  // Waves 27b: đo viền cầu vồng — ::before PHẢI khớp box của #heroProfile
  const aura = await win.webContents.executeJavaScript(`(function(){
    const hero = document.getElementById('heroProfile');
    if (!hero) return {ok:false, reason:'no-hero'};
    hero.hidden = false;
    const cs = getComputedStyle(hero, '::before');
    const hb = hero.getBoundingClientRect();
    const pos = getComputedStyle(hero).position;
    return {
      heroPos: pos,
      heroBox: {x:Math.round(hb.x),y:Math.round(hb.y),w:Math.round(hb.width),h:Math.round(hb.height)},
      beforeContent: cs.content,
      beforeInset: cs.inset,
      beforeAnim: cs.animationName,
      beforeBg: cs.backgroundImage.slice(0, 40),
    };
  })()`, true);
  console.log('AURA:', JSON.stringify(aura));

  // Waves 28: đo viền lấy màu theo palette nameplate + chế độ Sáng/Tối
  const themeCheck = await win.webContents.executeJavaScript(`(function(){
    const hero = document.getElementById('heroProfile');
    hero.hidden = false;
    // Giả lập nameplate palette 'crimson' (đỏ) qua API nội bộ
    let auraRed = null;
    try {
      if (window.__h && window.__h.setNameplate) {
        window.__h.setNameplate({ asset: 'nameplates/nameplates/crimson/', palette: 'crimson' });
      }
    } catch(e) {}
    // Đo trực tiếp: đặt --np đỏ rồi đọc background của ::before
    hero.style.setProperty('--np', '#f23f43');
    hero.classList.add('has-aura');
    const cs = getComputedStyle(hero, '::before');
    auraRed = cs.backgroundImage.slice(0, 60);
    const roots = document.documentElement;
    // bật theme sáng
    roots.dataset.theme = 'light';
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const fgColor = getComputedStyle(document.body).color;
    roots.dataset.theme = 'dark';
    return { auraRedHasColor: /rgb|oklab/.test(auraRed), auraRed, lightBodyBg: bodyBg, lightFg: fgColor };
  })()`, true);
  console.log('THEME:', JSON.stringify(themeCheck));

  // Chụp riêng khung profile để xác nhận viền cầu vồng bám đúng card
  const hb = aura.heroBox;
  if (hb && hb.w > 0) {
    const hz = await win.webContents.capturePage({x:Math.max(0,hb.x-6),y:Math.max(0,hb.y-6),width:hb.w+12,height:hb.h+12});
    fs.writeFileSync(path.join(OUT, 'hero-aura.png'), hz.toPNG());
  }

  // Waves 28: chụp TOÀN APP ở chế độ SÁNG để xác nhận không chìm màu
  await win.webContents.executeJavaScript(`document.getElementById('themeLight').click()`, true);
  await new Promise((r) => setTimeout(r, 700));
  fs.writeFileSync(path.join(OUT, 'theme-light.png'), (await win.webContents.capturePage()).toPNG());
  // và chế độ TỐI để so sánh cạnh nhau
  await win.webContents.executeJavaScript(`document.getElementById('themeDark').click()`, true);
  await new Promise((r) => setTimeout(r, 700));
  fs.writeFileSync(path.join(OUT, 'theme-dark.png'), (await win.webContents.capturePage()).toPNG());

  // Đo layout thực tế
  const metrics = await win.webContents.executeJavaScript(`
    (function(){
      const r = (sel) => { const e=document.querySelector(sel); if(!e) return null; const b=e.getBoundingClientRect(); return {y:Math.round(b.y),h:Math.round(b.height)}; };
      const grid = document.getElementById('questListActive');
      const cards = [...grid.querySelectorAll('.qcard')];
      const c = cards[2] || cards[0];
      const g = (q) => { const e = c && c.querySelector(q); return e ? Math.round(e.getBoundingClientRect().height) : null; };
      return {
        vh: window.innerHeight,
        shell: r('.shell'), content: r('.content'), page: r('#pageQuest'),
        hero: r('#heroProfile'), stats: r('.stats-row'), qcard: r('.quests-card'),
        statsKids: [...document.querySelectorAll('.stats-row > *')].map(e=>({id:e.id||e.className,h:Math.round(e.getBoundingClientRect().height)})),
        list: r('#questListActive'), actions: r('.quest-actions'),
        nCards: cards.length,
        ring: (()=>{const q=(s)=>{const rg=document.querySelector(s);return rg?{off:getComputedStyle(rg).strokeDashoffset}:null;};return {active:q('.qcard .qring-fg'),newOne:q('#questListNew .qcard .qring-fg'),pct:document.querySelector('.qcard .qcard-pct').textContent,newPct:document.querySelector('#questListNew .qcard .qcard-pct').textContent};})(),
        gridScrollH: grid.scrollHeight, gridClientH: grid.clientHeight,
        firstRow: cards.slice(0,3).map(x=>Math.round(x.getBoundingClientRect().height)),
        parts: c ? {card:Math.round(c.getBoundingClientRect().height),banner:g('.qcard-banner'),body:g('.qcard-body'),pub:g('.qcard-pub'),main:g('.qcard-main'),info:g('.qcard-info'),kicker:g('.qcard-kicker'),title:g('.qcard-title'),desc:g('.qcard-desc'),reward:g('.qcard-reward'), overflow: c.scrollHeight - Math.round(c.getBoundingClientRect().height)} : null
      };
    })()
  `, true);
  console.log('metrics:', JSON.stringify(metrics, null, 1));

  const img = await win.webContents.capturePage();
  const rect = await win.webContents.executeJavaScript("(()=>{const c=document.querySelector('.qcard');if(!c) return null;const b=c.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),width:Math.round(b.width),height:Math.round(b.height)};})()", true);
  if (rect) {
    const zoom = await win.webContents.capturePage({x:rect.x-4,y:rect.y-4,width:rect.width+8,height:rect.height+8});
    fs.writeFileSync(path.join(OUT,'card-zoom.png'), zoom.toPNG());
  }
  fs.writeFileSync(path.join(OUT, 'quests.png'), img.toPNG());

  // Tab Đã làm
  await win.webContents.executeJavaScript(`document.getElementById('tabDone').click();`, true);
  await new Promise((r) => setTimeout(r, 400));
  const img2 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUT, 'done.png'), img2.toPNG());

  await win.webContents.executeJavaScript(`document.getElementById('tabNew').click();`, true);
  await new Promise((r) => setTimeout(r, 300));
  const img3 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUT, 'new.png'), img3.toPNG());

  // Waves 24: mô phỏng ĐANG CHẠY một nhiệm vụ → vòng % phải chạy + nhãn "Đang chạy"
  await win.webContents.executeJavaScript(`document.getElementById('tabActive').click();`, true);
  await new Promise((r) => setTimeout(r, 250));
  const runState = await win.webContents.executeJavaScript(`(function(){
    const card = document.querySelector('#questListActive .qcard');
    if (!card) return 'no-card';
    const id = card.dataset.questId;
    window.__h.event({ type: 'quest:start', data: { id, name: 'test', secondsNeeded: 900, secondsDone: 0 } });
    window.__h.event({ type: 'quest:progress', data: { id, secondsDone: 450, secondsNeeded: 900 } });
    return 'fired';
  })()`, true);
  await new Promise((r) => setTimeout(r, 700));
  const ringState = await win.webContents.executeJavaScript(`(function(){
    const card = document.querySelector('#questListActive .qcard');
    const rg = card.querySelector('.qring-fg');
    return {
      label: card.querySelector('.qcard-state').textContent,
      off: getComputedStyle(rg).strokeDashoffset,
      pct: card.querySelector('.qcard-pct').textContent,
      dataStatus: card.dataset.status,
      stillInActiveTab: !!document.querySelector('#questListActive .qcard'),
    };
  })()`, true);
  console.log('RUNSTATE:', runState, JSON.stringify(ringState));

  // Waves 24: bấm Auto ORBs thật trong UI → phải gửi mode 'run' + đúng danh sách đã tích
  const clickState = await win.webContents.executeJavaScript(`(function(){
    window.__h.event({ type: 'scan:complete', data: { total: 20 } });
    const t = document.getElementById('token'); if (t) t.value = 'aaa.bbb.ccc';
    const card = document.querySelector('#questListActive .qcard');
    const box = card && card.querySelector('input[type=checkbox]');
    if (!box) return 'no-checkbox';
    if (box.disabled) return 'checkbox-disabled';
    box.click();
    const btn = document.getElementById('btnStart');
    const label = btn.textContent.trim();
    const disabled = btn.disabled;
    btn.click();
    return { label, disabled, sent: window.__lastStart ? { mode: window.__lastStart.mode, n: (window.__lastStart.selectedQuests || []).length } : null };
  })()`, true);
  console.log('CLICKSTATE:', JSON.stringify(clickState));
  await new Promise((r) => setTimeout(r, 500));
  const sentState = await win.webContents.executeJavaScript(
    "(()=>{const s=window.__lastStart;return s?{mode:s.mode,n:(s.selectedQuests||[]).length}:null;})()",
    true,
  );
  console.log('SENTSTATE:', JSON.stringify(sentState));
  const runRect = await win.webContents.executeJavaScript("(()=>{const c=document.querySelector('#questListActive .qcard');if(!c)return null;const b=c.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),width:Math.round(b.width),height:Math.round(b.height)};})()", true);
  if (runRect) {
    fs.writeFileSync(path.join(OUT,'running-zoom.png'), (await win.webContents.capturePage({x:runRect.x-4,y:runRect.y-4,width:runRect.width+8,height:runRect.height+8})).toPNG());
  }
  const rect2 = await win.webContents.executeJavaScript("(()=>{const c=document.querySelector('#questListNew .qcard');if(!c) return null;const b=c.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),width:Math.round(b.width),height:Math.round(b.height)};})()", true);
  if (rect2) {
    const z2 = await win.webContents.capturePage({x:rect2.x-4,y:rect2.y-4,width:rect2.width+8,height:rect2.height+8});
    fs.writeFileSync(path.join(OUT,'new-zoom.png'), z2.toPNG());
  }

  /* ── Waves 40 (B) — kiểm tra markup nút "Mở Discord để nhận" sau cùng ──
     Chèn 1 thẻ đã đánh dấu claimOpenDiscord để xác nhận nhãn + khuôn nút. */
  const openMarkup = await win.webContents.executeJavaScript(`(function(){
    const card = document.querySelector('#questListNew .qcard');
    if (!card) return { err: 'không còn thẻ' };
    return { act: card.querySelector('.qcard-act').dataset.act, isButton: card.querySelector('.qcard-act').tagName };
  })()`, true);
  console.log('W40-MARKUP:', JSON.stringify(openMarkup));

  try {
    fs.unlinkSync(tmp);
    fs.unlinkSync(path.join(ROOT, 'harness-api.js'));
    fs.unlinkSync(path.join(ROOT, 'harness-data.js'));
  } catch {}
  app.quit();
});
