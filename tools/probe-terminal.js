'use strict';
/* Waves 41 — KIỂM CHỨNG THẬT terminal #229:
 *   1) dòng tiến trình ĐỔI khi % đổi (không đứng im) — cả khi reduced-motion ON;
 *   2) dòng nhật ký TỰ GÕ (text dài dần) rồi dừng ở đủ chữ;
 *   3) reduced-motion → hiện NGUYÊN dòng ngay (không gõ) — đúng luật skill;
 *   4) KHÔNG còn loader nổi/snake; nút điều khiển nằm ở sidebar, không ở dưới lưới.
 * Chạy: env -u ELECTRON_RUN_AS_NODE <electron> tools/probe-terminal.js
 */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const R = path.join(__dirname, '..', 'electron', 'renderer');

function page(extra) {
  let html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(R, 'harness-api.js'), `(function(){
    const h={log:null,event:null,state:null}; window.__h=h;
    window.autoquest=new Proxy({},{get(_t,k){
      if(k==='onLog')return f=>{h.log=f;};
      if(k==='onEvent')return f=>{h.event=f;};
      if(k==='onState')return f=>{h.state=f;};
      if(k==='authCheck')return()=>Promise.resolve({ok:false});
      return ()=>Promise.resolve({ok:true});
    }});
  })();\n`);
  return html.replace(
    '<script src="renderer.js"></script>',
    `<script src="harness-api.js"></script>\n${extra || ''}\n<script src="renderer.js"></script>`,
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  fs.writeFileSync(path.join(R, '.probe-terminal.html'), page(), 'utf8');
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: { contextIsolation: false, nodeIntegration: false, backgroundThrottling: false },
  });
  win.webContents.on('console-message', (_e, l, m) => console.log('[renderer]', l, m));
  await win.loadFile(path.join(R, '.probe-terminal.html'));
  await sleep(600);

  const run = (js) => win.webContents.executeJavaScript(js, true);

  // ---- 1) Tiến trình đổi theo % (reduced-motion ON để test điều kiện khó nhất) ----
  try {
    win.webContents.debugger.attach('1.3');
    await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
      media: '',
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
  } catch {}
  const reduceOn = await run("window.matchMedia('(prefers-reduced-motion: reduce)').matches");

  await run("window.__h.event({type:'scan:start',data:{total:40}}); 'ok'");
  await sleep(120);
  const snap = async () =>
    run("(()=>{const p=document.querySelector('.u229-prog');if(!p)return null;return {bar:p.querySelector('.u229-prog-bar').textContent,pct:p.querySelector('.u229-prog-pct').textContent,cnt:p.querySelector('.u229-prog-count').textContent};})()");
  const s0 = await snap();
  await run("window.__h.event({type:'quest:scan-progress',data:{done:10,total:40}}); 'ok'");
  await sleep(60);
  const s1 = await snap();
  await run("window.__h.event({type:'quest:scan-progress',data:{done:30,total:40}}); 'ok'");
  await sleep(60);
  const s2 = await snap();
  await run("window.__h.event({type:'quest:scan-progress',data:{done:40,total:40}}); 'ok'");
  await sleep(60);
  const s3 = await snap();
  console.log('PROG-MOVES:', JSON.stringify({ reduceOn, s0, s1, s2, s3,
    moved: new Set([s0 && s0.bar, s1 && s1.bar, s2 && s2.bar, s3 && s3.bar]).size > 1,
    pctSeq: [s0 && s0.pct, s1 && s1.pct, s2 && s2.pct, s3 && s3.pct],
    cntSeq: [s0 && s0.cnt, s1 && s1.cnt, s2 && s2.cnt, s3 && s3.cnt] }));

  // ---- 2/3) self-typing: ở reduced-motion phải hiện NGUYÊN dòng ngay ----
  const typeLen = async () => run("(()=>{const l=[...document.querySelectorAll('.u229-line')].pop();return l?l.querySelector('.u229-body').textContent.length:null;})()");
  await run("window.__h.log('Dòng kiểm thử gõ tự động dài dài để đo chiều dài tăng dần nha bro'); 'ok'");
  const l1 = await typeLen();
  await sleep(150);
  const l2 = await typeLen();
  console.log('TYPE-REDUCE:', JSON.stringify({ l1, l2, instantWhenReduced: reduceOn ? l1 === l2 && l2 > 0 : 'n/a' }));

  // ---- tắt reduced-motion → phải GÕ dần (dài tăng theo thời gian) ----
  try {
    await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
      media: '', features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });
  } catch {}
  const reduceOff = await run("window.matchMedia('(prefers-reduced-motion: reduce)').matches");
  await run("window.__h.log('Dong go dan tu tu de thay chieu dai tang len theo thoi gian nao'); 'ok'");
  const t1 = await typeLen();
  await sleep(120);
  const t2 = await typeLen();
  await sleep(400);
  const t3 = await typeLen();
  console.log('TYPE-ANIMATE:', JSON.stringify({ reduceOff, t1, t2, t3,
    grew: t3 > t1, finalSettled: t3 === t2 || t3 >= 60 }));

  // ---- 4) không còn loader nổi / snake; nút ở sidebar ----
  const layout = await run(`(()=>{
    const g=(s)=>document.querySelector(s);
    return {
      legacyLoader: !!g('.log-loader, .ll-bar, .snake-spin, #logSpin'),
      consoleIsTerminal: !!g('#console.u229'),
      sideActions: !!g('.side-actions'),
      sideButtons: ['btnScan','btnStart','btnStop'].map(id=>{const b=document.getElementById(id);return b?{id,closestSide:!!b.closest('.side-actions'),closestGrid:!!b.closest('.quests-card')}:null;}),
      consoleCardTop: Math.round(g('#consoleCard').getBoundingClientRect().top),
      sideActionsTop: Math.round(g('.side-actions').getBoundingClientRect().top),
    };
  })()`);
  console.log('LAYOUT:', JSON.stringify(layout));

  // ---- chụp ảnh khung nhật ký để xem bằng mắt ----
  const rect = await run("(()=>{const b=document.getElementById('consoleCard').getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),width:Math.round(b.width),height:Math.round(b.height)};})()");
  const out = path.join(__dirname, '..', 'build-release', 'ui-preview');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'terminal-log.png'), (await win.webContents.capturePage(rect)).toPNG());
  fs.writeFileSync(path.join(out, 'terminal-full.png'), (await win.webContents.capturePage()).toPNG());
  console.log('SHOTS: terminal-log.png, terminal-full.png');
  app.exit(0);
});
