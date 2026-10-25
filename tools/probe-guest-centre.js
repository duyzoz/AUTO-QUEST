/* Waves 46 — PROBE cho TRẠNG THÁI KHÁCH.
   Waves 45 tôi hiểu nhầm một câu cũ của bro mà đổi layout khách sang CỘT DỌC
   CĂN GIỮA. Bro đã nói rõ: "chỉnh ngay profiles ở giữa về NHƯ CŨ … ĐÉO AI BẮT
   MÀY ĐỂ CHÍNH GIỮA". Wave 46 đã XOÁ khối override căn giữa.

   Probe này giờ khẳng định ĐÚNG hành vi mong muốn MỚI:
   1) `.up-row` khách phải là HÀNG NGANG (row) — y như tài khoản đã đăng nhập,
      avatar bên trái, chữ bên phải. KHÔNG căn giữa.
   2) `.up-logout` vẫn BỊ ẨN khi là khách (khách không có gì để đăng xuất).
   3) `.profile-hero[data-state="guest"] .ph-body` cũng phải HÀNG NGANG.
   4) Avatar mặc định (SVG) phải hiện ở cả 2 chỗ.
   5) Đã ĐĂNG NHẬP thì layout y hệt khách (cùng hàng ngang) + hiện nút đăng xuất. */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, '__gc-api.js'), `(function(){const h={};window.__h=h;
  const f=()=>Promise.resolve({ok:true,state:'idle',config:{}});
  window.autoquest=new Proxy({},{get(_t,k){
    if(k==='onLog')return x=>{h.log=x;};
    if(k==='onEvent')return x=>{h.event=x;};
    if(k==='onState')return x=>{h.state=x;};
    return f;}});})();`, 'utf8');
const tmp = path.join(ROOT, '__gc.html');
fs.writeFileSync(tmp, html.replace('<script src="renderer.js"></script>', '<script src="__gc-api.js"></script>\n<script src="renderer.js"></script>'), 'utf8');

const MEASURE = `(function(){
  const R = el => el ? el.getBoundingClientRect() : null;
  const mid = r => r ? +(r.left + r.width/2).toFixed(1) : null;
  const row = document.getElementById('upRow');
  const av  = document.getElementById('upAvatarwrap');
  const txt = row ? row.querySelector('.up-text') : null;
  const out = document.getElementById('btnLogout');
  const hero= document.getElementById('heroProfile');
  const body= hero ? hero.querySelector('.ph-body') : null;
  const phav= document.getElementById('phAvatarwrap');
  const rr=R(row), ar=R(av), tr=R(txt), hr=R(hero), br=R(body), pr=R(phav);
  const cs = row ? getComputedStyle(row) : null;
  const isGuest = document.getElementById('dprofile').dataset.state === 'guest';
  const logoutVisible = out ? getComputedStyle(out).display !== 'none' : null;
  return JSON.stringify({
    state: document.getElementById('dprofile').dataset.state,
    heroState: hero ? hero.dataset.state : null,
    // 1) sidebar: flex-direction + độ lệch tâm
    rowFlexDir: cs ? cs.flexDirection : null,
    rowAlignItems: cs ? cs.alignItems : null,
    rowMid: mid(rr), avatarMid: mid(ar), textMid: mid(tr),
    avatarOffsetPx: (rr&&ar) ? +Math.abs(mid(ar)-mid(rr)).toFixed(1) : null,
    textOffsetPx: (rr&&tr) ? +Math.abs(mid(tr)-mid(rr)).toFixed(1) : null,
    // 2) nút đăng xuất
    logoutDisplay: out ? getComputedStyle(out).display : null,
    logoutVisible: logoutVisible,
    // 3) hero
    heroBodyFlexDir: body ? getComputedStyle(body).flexDirection : null,
    heroMid: mid(hr), heroAvatarMid: mid(pr),
    heroAvatarOffsetPx: (hr&&pr) ? +Math.abs(mid(pr)-mid(hr)).toFixed(1) : null,
    // 4) avatar mặc định đã hiện chưa
    sidebarAvatarHasSvg: !!(av && av.querySelector('svg')),
    heroAvatarHasSvg: !!(phav && phav.querySelector('svg')),
    // tên hiển thị
    upName: document.getElementById('upName').textContent,
    phDisplay: document.getElementById('phDisplay').textContent,
  });
})()`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1400, height: 950, show: false, webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false } });
  await win.loadFile(tmp);
  await new Promise(r => setTimeout(r, 1200));

  // ---- A) TRẠNG THÁI KHÁCH (mặc định khi chưa có token) ----
  const guest = JSON.parse(await win.webContents.executeJavaScript(MEASURE, true));
  console.log('--- KHÁCH (chưa đăng nhập) ---');
  console.log(`  sidebar: state=${guest.state} flex-direction=${guest.rowFlexDir} align=${guest.rowAlignItems}`);
  console.log(`  tâm thẻ=${guest.rowMid} · tâm avatar=${guest.avatarMid} · LỆCH=${guest.avatarOffsetPx}px`);
  console.log(`  tâm chữ=${guest.textMid} · LỆCH=${guest.textOffsetPx}px`);
  console.log(`  nút đăng xuất: display=${guest.logoutDisplay}`);
  console.log(`  hero: state=${guest.heroState} flex-direction=${guest.heroBodyFlexDir}`);
  console.log(`  tâm hero=${guest.heroMid} · tâm avatar hero=${guest.heroAvatarMid} · LỆCH=${guest.heroAvatarOffsetPx}px`);
  console.log(`  avatar mặc định: sidebar=${guest.sidebarAvatarHasSvg} hero=${guest.heroAvatarHasSvg}`);
  console.log(`  tên: "${guest.upName}" / "${guest.phDisplay}"`);

  // ---- B) ĐÃ ĐĂNG NHẬP → luật khách KHÔNG được đè ----
  await win.webContents.executeJavaScript(`(function(){
    document.getElementById('dprofile').dataset.state='logged-in';
    document.getElementById('heroProfile').dataset.state='user';
    return 'ok';})()`, true);
  await new Promise(r => setTimeout(r, 500));
  const user = JSON.parse(await win.webContents.executeJavaScript(MEASURE, true));
  console.log('\n--- ĐÃ ĐĂNG NHẬP (kiểm tra không bị luật khách đè) ---');
  console.log(`  sidebar flex-direction=${user.rowFlexDir} (phải là row)`);
  console.log(`  nút đăng xuất: ${user.logoutDisplay} (phải là flex)`);
  console.log(`  hero flex-direction=${user.heroBodyFlexDir} (phải là row)`);

  const CENTRE_TOL = 4; // px — cho phép sai số sub-pixel
  const fails = [];
  if (guest.state !== 'guest') fails.push(`trạng thái khách sai: ${guest.state}`);
  // Waves 46: khách phải HÀNG NGANG như cũ — KHÔNG căn giữa.
  if (guest.rowFlexDir !== 'row') fails.push(`thẻ khách phải là HÀNG NGANG (đang là ${guest.rowFlexDir}) — bro yêu cầu trả về NHƯ CŨ`);
  if (guest.logoutVisible) fails.push('nút đăng xuất VẪN HIỆN khi là khách');
  if (guest.heroBodyFlexDir !== 'row') fails.push(`hero khách phải là HÀNG NGANG (đang là ${guest.heroBodyFlexDir})`);
  // Avatar phải nằm BÊN TRÁI khối chữ (dấu hiệu hàng ngang thật, không phải căn giữa).
  if (guest.avatarMid !== null && guest.rowMid !== null && guest.avatarMid >= guest.rowMid) {
    fails.push(`avatar khách không nằm bên trái (tâm avatar ${guest.avatarMid} ≥ tâm thẻ ${guest.rowMid})`);
  }
  if (!guest.sidebarAvatarHasSvg) fails.push('avatar mặc định sidebar không phải SVG');
  if (!guest.heroAvatarHasSvg) fails.push('avatar mặc định hero không phải SVG');
  if (user.rowFlexDir !== 'row') fails.push(`đã đăng nhập mà thẻ không hàng ngang (${user.rowFlexDir})`);
  if (user.logoutDisplay === 'none') fails.push('đã đăng nhập mà nút đăng xuất bị ẩn');
  if (user.heroBodyFlexDir !== 'row') fails.push(`đã đăng nhập mà hero không hàng ngang (${user.heroBodyFlexDir})`);

  const ok = fails.length === 0;
  console.log('\n=== WAVE 46 GUEST LAYOUT (HÀNG NGANG NHƯ CŨ):', ok ? 'PASS ✅' : 'FAIL ❌', '===');
  if (!ok) fails.forEach(f => console.log('   ✘ ' + f));
  for (const f of ['__gc.html', '__gc-api.js']) { try { fs.unlinkSync(path.join(ROOT, f)); } catch (e) {} }
  app.exit(ok ? 0 : 1);
});
