'use strict';
/* Waves 41 — E2E THẬT: boot app với token đã lưu, quét quest THẬT, đọc DOM.
 * Kiểm: (1) terminal có dòng; (2) 3 tab phân loại đúng todo/claimable/claimed;
 *       (3) không lỗi JS; (4) nút điều khiển ở sidebar.
 * Chạy: env -u ELECTRON_RUN_AS_NODE <electron> tools/e2e-live.js
 */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Nạp main.js thật nhưng KHÔNG show window? Đơn giản hơn: chỉ đọc renderer + gọi
// thẳng API Discord bằng module thật để đo phân loại, rồi đo DOM.
const main = require(path.join(__dirname, '..', 'electron', 'main.js'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  // main.js tự tạo cửa sổ. Chờ nó sẵn sàng rồi tìm BrowserWindow.
  await sleep(3500);
  const wins = BrowserWindow.getAllWindows();
  console.log('WINDOWS:', wins.length);
  if (!wins.length) { app.exit(2); return; }
  const win = wins[0];
  const run = (js) => win.webContents.executeJavaScript(js, true);

  const errs = [];
  win.webContents.on('console-message', (_e, level, msg) => {
    if (level >= 2 && !/Security Warning|unsafe-eval|content security|hsw\.js/i.test(msg)) errs.push(msg);
  });

  // Bơm lệnh quét như người dùng bấm nút sidebar.
  const clicked = await run(`(()=>{const b=document.getElementById('btnScan');if(!b)return 'no-btn';b.click();return 'clicked';})()`);
  console.log('SCAN CLICK:', clicked);

  // Chờ quét thật xong (tối đa 25s) — theo dõi logCount + line tổng kết.
  let done = false;
  for (let i = 0; i < 50; i++) {
    await sleep(500);
    const st = await run(`(()=>({count:document.getElementById('logCount').textContent, prog:!!document.querySelector('.u229-prog'), lines:[...document.querySelectorAll('.u229-line')].map(e=>e.textContent).slice(-3)}))()`);
    if (!st.prog && /^\d+\/\d+$/.test(st.count) && st.count.split('/')[0] === st.count.split('/')[1] && st.count !== '0/0') { done = true; }
    if (i % 6 === 0) console.log('POLL', i, JSON.stringify(st));
    if (done && st.lines.some((l) => /Đã nạp/.test(l))) break;
  }

  const final = await run(`(()=>{
    const doc=document;
    const pick=(tab)=>[...doc.querySelectorAll('#questList'+tab+' .qcard,#questList'+tab+' .qdone')].map(e=>({id:e.dataset.questId,status:e.dataset.status||''}));
    return {
      count: doc.getElementById('logCount').textContent,
      lines: [...doc.querySelectorAll('.u229-line')].map(e=>e.textContent),
      tabs: { active: doc.getElementById('countActive').textContent, new: doc.getElementById('countNew').textContent, done: doc.getElementById('countDone').textContent },
      terminal: !!doc.querySelector('#console.u229'),
      sideScan: !!doc.querySelector('.side-actions #btnScan'),
      legacy: !!doc.querySelector('.log-loader,.ll-bar,.snake-spin,#logSpin'),
      avatars: { up: doc.getElementById('upAvatar')?doc.getElementById('upAvatar').className:null, ph: doc.getElementById('phAvatar')?doc.getElementById('phAvatar').className:null },
    };
  })()`);
  console.log('FINAL:', JSON.stringify(final, null, 1));
  console.log('JS ERRORS:', errs.length, errs.slice(0, 5));
  app.exit(0);
});

setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 60000);
