/* Audit tương phản chế độ Sáng: đo màu THẬT trong DOM + tính tỷ lệ WCAG.
   Mục tiêu: KHÔNG phần tử nào bị "chìm màu" (chữ vs nền < 4.5:1 với chữ thường).
   Waves 28b: đo sau khi transition màu settle (transitionend + 2 rAF + 1.6s). */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');

function buildHtml() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const list = [
    { id: '1', name: 'Watch 15 min of video', description: 'Xem 15 phút video bất kỳ', status: 'todo', progress: 0, orbs: 15, kind: 'video', expiresAt: null },
    { id: '2', name: 'Play a game', description: 'Chơi 1 game 10 phút', status: 'claimable', progress: 100, orbs: 30, kind: 'game', expiresAt: null },
    { id: '3', name: 'Avatar decoration', description: 'Nhận trang trí avatar', status: 'claimed', progress: 100, orbs: 50, kind: 'item', expiresAt: null },
    { id: '4', name: 'Stream 5 min', description: 'Phát trực tiếp', status: 'todo', progress: 40, orbs: 20, kind: 'stream', expiresAt: null },
  ];
  fs.writeFileSync(path.join(ROOT, 'harness-data.js'), 'window.__LIST = ' + JSON.stringify(list) + ';\n', 'utf8');
  fs.writeFileSync(path.join(ROOT, 'harness-api.js'), `(function(){
    const handlers = { log:null, event:null, state:null };
    window.__h = handlers;
    const asyncFn = () => Promise.resolve({ ok:true, state:'idle', config:{} });
    window.autoquest = new Proxy({}, { get(_t,k){
      if(k==='onLog') return fn=>{handlers.log=fn;};
      if(k==='onEvent') return fn=>{handlers.event=fn;};
      if(k==='onState') return fn=>{handlers.state=fn;};
      return asyncFn;
    }});
  })();`, 'utf8');
  return html.replace('<script src="renderer.js"></script>',
    `<script src="harness-api.js"></script>\n<script src="harness-data.js"></script>\n<script src="renderer.js"></script>`);
}

// WCAG relative luminance + contrast ratio
const AUDIT = `(async function(){
  function parse(c){
    const m = c.match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
    const p = m[1].split(',').map(s=>parseFloat(s.trim()));
    return { r:p[0], g:p[1], b:p[2], a: p.length>3 ? p[3] : 1 };
  }
  function over(fg, bg){
    return { r: fg.r*fg.a + bg.r*(1-fg.a), g: fg.g*fg.a + bg.g*(1-fg.a), b: fg.b*fg.a + bg.b*(1-fg.a) };
  }
  function lum(c){
    const f = v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    return 0.2126*f(c.r) + 0.7152*f(c.g) + 0.0722*f(c.b);
  }
  function ratio(a,b){ const la=lum(a), lb=lum(b); const hi=Math.max(la,lb), lo=Math.min(la,lb); return (hi+0.05)/(lo+0.05); }
  function solidBg(el){
    let e = el;
    while(e && e !== document.documentElement){
      const c = parse(getComputedStyle(e).backgroundColor);
      if(c && c.a >= 0.999) return c;
      e = e.parentElement;
    }
    const rootBg = parse(getComputedStyle(document.body).backgroundColor);
    return (rootBg && rootBg.a >= 0.999) ? rootBg : { r:255,g:255,b:255,a:1 };
  }
  // Chờ transition màu kết thúc thật sự: 2 rAF + 1.6s (transition .nav-item = 0.15s)
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise(r => setTimeout(r, 1600));

  // Tên class THẬT trong index.html (không bịa). Bao gồm cả trang Cài đặt (ẩn sau .page).
  const sels = [
    ['nav-item', '.nav-item'],
    ['nav-item.active', '.nav-item.active'],
    ['nav-label', '.nav-label'],
    ['brand-name', '.brand-name'],
    ['sb-label', '.sb-label'],
    ['sb-value', '.sb-value'],
    ['sb-sub', '.sb-sub'],
    ['up-name', '.up-name'],
    ['up-sub', '.up-sub'],
    ['up-tag', '.up-tag'],
    ['topbar-btn', '.topbar-btn'],
    ['card-title', '.card-title'],
    ['hint', '.hint'],
    ['tab-btn', '.tab-btn'],
    ['tab-count', '.tab-count'],
    ['chip', '.chip'],
    ['ghost-btn', '.ghost-btn'],
    ['btn-outline', '.btn-outline'],
    ['field label', '.field > label'],
    ['field input', '.field input'],
    ['custom-select', '.custom-select'],
    ['step-item', '.step-item'],
    ['step-num', '.step-num'],
    ['qstate', '.qstate'],
    ['qstate-text', '.qstate-text'],
    ['quest-head h3', '.quest-head h3'],
    ['sec-text', '.sec-text'],
    ['guide-header', '.guide-header'],
    ['loop-title', '.loop-title'],
    ['u229-line', '.u229-line'],
    ['u229-line sys', '.u229-line.t-sys'],
    ['u229-line ok', '.u229-line.t-ok'],
    ['u229-line warn', '.u229-line.t-warn'],
    ['u229-line err', '.u229-line.t-err'],
    ['u229-line orb', '.u229-line.t-orb'],
    ['u229-ico ok', '.u229-line.t-ok .u229-ico'],
    ['u229-ico err', '.u229-line.t-err .u229-ico'],
    ['u229-tag', '.u229-tag'],
    // Waves 45 — khung đăng nhập Discord + khối token ứng dụng.
    // Waves 46: .dlogin-brand-text / .perm-chip đã bỏ cùng chức năng Mời bot.
    ['bot-label', '.bot-label'],
    ['bot-hint', '.bot-hint'],
    // Waves 46: các mẫu .oauth-*/.apptok-* đã bỏ cùng chức năng Mời bot vào server.
    ['u229-prog-count', '.u229-prog-count'],
    ['u229-prog-label', '.u229-prog-label'],
    ['log-title', '.log-title'],
    ['log-count', '.log-count'],
    ['selected-info', '.selected-info'],
    ['about-list li', '.about-list li'],
    ['modal-desc', '.modal-desc'],
    ['ph-display', '.ph-display'],
    ['ph-username', '.ph-username'],
    ['ph-np-clan', '.ph-np-clan'],
    ['dp-username', '.dp-username'],
  ];
  // Mở luôn trang Cài đặt + ngăn kéo hồ sơ để đo cả phần tử ẩn (display:none → offsetParent null
  // nhưng getComputedStyle vẫn trả về màu; ta chỉ cần màu nên không cần hiển thị).
  const out = [];
  for(const [name, sel] of sels){
    const el = document.querySelector(sel);
    if(!el){ out.push({ name, missing:true }); continue; }
    const cs = getComputedStyle(el);
    const fg0 = parse(cs.color); if(!fg0){ out.push({name, missing:'nocolor'}); continue; }
    const bg = solidBg(el);
    const fg = fg0.a >= 0.999 ? fg0 : over(fg0, bg);
    const r = ratio(fg, bg);
    out.push({ name, fg: cs.color, bg: 'rgb('+Math.round(bg.r)+','+Math.round(bg.g)+','+Math.round(bg.b)+')', ratio: Math.round(r*100)/100 });
  }
  return out;
})()`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1500, height: 950, show: false,
    webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false } });
  win.webContents.on('console-message', (_e, lvl, msg) => console.log('[renderer]', lvl, msg));
  const tmp = path.join(ROOT, '__contrast.html');
  fs.writeFileSync(tmp, buildHtml(), 'utf8');
  await win.loadFile(tmp);
  await new Promise((r) => setTimeout(r, 1200));

  // Bật chế độ Sáng ĐÚNG như người dùng bấm: thông qua applyTheme (nút #themeLight)
  await win.webContents.executeJavaScript(`(function(){
    const btn = document.getElementById('themeLight');
    if (btn) { btn.click(); }
    document.documentElement.dataset.theme = 'light';
    void document.body.offsetHeight; // Waves 46: ÉP REFLOW — không có bước này thì
    return document.documentElement.dataset.theme; // token sáng chưa kịp áp, đo ra rác.
  })()`, true);
  // Waves 46: chờ 2 frame + 1 nhịp ngắn cho CSS var kịp tính lại TRƯỚC khi đo.
  await new Promise((r) => setTimeout(r, 500));
  // Nạp quest + log mẫu (mô phỏng lúc app chạy).
  await win.webContents.executeJavaScript(`(function(){
    const ev = window.__h && window.__h.event;
    const logs = window.__h && window.__h.log;
    if(ev){ ev({type:'quest:inventory', data:{quests: window.__LIST}}); }
    if(ev){ ev({type:'scan:start', data:{total:4}}); }
    if(ev){ ev({type:'quest:scan-progress', data:{done:2, total:4}}); }
    if(logs){ logs('Sẵn sàng — bấm Quét nhiệm vụ', 'system'); logs('Đã nhận 15 Orb', 'orb'); logs('[LỖI] token hết hạn', 'stderr'); }
    if (typeof appendLog === 'function') {
      appendLog('Nạp nhiệm vụ thành công', 'stdout');   // t-ok
      appendLog('Đã nhận thưởng quest mẫu', 'stdout'); // t-ok
      appendLog('Orbs hiện có 4200', 'stdout');        // t-orb
      appendLog('Lỗi mạng tạm thời', 'stderr');        // t-err
      appendLog('Cảnh báo: phiên captcha hết hạn', 'warn'); // t-warn
    }
    // Mở khối hướng dẫn (Waves 46: chỉ còn pane Console — không còn tab Cách 2).
    const g = document.getElementById('btnGuideToggle');
    if (g && g.getAttribute('aria-expanded') !== 'true') g.click();
    return 'ok';
  })()`, true);
  // Waves 46: chờ thêm cho log/nội dung ổn định rồi mới đo.
  await new Promise((r) => setTimeout(r, 700));

  const res = await win.webContents.executeJavaScript(
    `(async () => JSON.stringify(await (${AUDIT})))()`, true);
  const rows = JSON.parse(res);
  console.log('=== LIGHT THEME CONTRAST AUDIT (Waves 28b) ===');
  let bad = 0, missing = 0;
  for (const r of rows) {
    if (r.missing) { console.log(`  ??  ${r.name} (không có trong DOM)`); missing++; continue; }
    const flag = r.ratio >= 4.5 ? 'OK  ' : (r.ratio >= 3 ? 'WARN' : 'FAIL');
    if (r.ratio < 4.5) bad++;
    console.log(`  ${flag} ${String(r.ratio).padStart(5)}:1  ${r.name}  fg=${r.fg} bg=${r.bg}`);
  }
  console.log(bad === 0 ? `ALL >= 4.5:1 — KHÔNG chìm màu (${rows.length - missing} mẫu)` : `${bad} mục dưới 4.5:1`);

  const outDir = path.join(__dirname, '..', 'build-release', 'ui-preview');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'theme-light.png'), (await win.webContents.capturePage()).toPNG());
  // Waves 44: dọn CẢ 3 tệp harness — trước đây chỉ xoá .html nên để rác lại
  // trong electron/renderer/ (harness-api.js / harness-data.js).
  for (const f of [tmp, path.join(ROOT,'harness-api.js'), path.join(ROOT,'harness-data.js')]) {
    try { fs.unlinkSync(f); } catch (e) {}
  }
  app.quit();
});
