'use strict';
/* Waves 40 (B) — KIỂM CHỨNG THẬT nhánh "Mở Discord để nhận" (UI giữ nguyên).
 *
 * Chạy: env -u ELECTRON_RUN_AS_NODE <electron> tools/probe-open.js
 *
 * Vì sao dùng nhánh 403/10008: đó là nhánh DUY NHẤT đặt `claimOpenDiscord` mà
 * KHÔNG cần `captchaMeta` (nhánh captcha thứ hai cần token đã gửi). Nhờ vậy ta
 * lái được renderer vào đúng trạng thái mới mà không phải dựng hCaptcha thật.
 *
 * Đo: act/label/class của nút trước-sau, và openQuest có được gọi khi bấm.
 */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const R = 'C:/Users/Admin/Desktop/AUTO-QUEST-main/electron/renderer';

app.whenReady().then(async () => {
  const list = [
    {
      id: 'w1',
      name: 'TestGame',
      task: 'PLAY_ON_DESKTOP',
      taskLabel: 'Chơi',
      application: 'EA',
      secondsNeeded: 900,
      secondsDone: 900,
      orbs: 700,
      status: 'claimable',
      automatable: true,
      publisher: 'EA',
      gameTitle: 'TestGame',
      expiresAt: '2026-10-25T12:00:00+00:00',
      colorPrimary: '#5865f2',
      colorSecondary: '#1b1e3a',
      rewardKind: 'orbs',
      rewardTitle: 'Nhận 700 Orbs',
    },
  ];
  let html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(R, 'harness-data.js'), 'window.__LIST=' + JSON.stringify(list) + ';\n');
  fs.writeFileSync(
    path.join(R, 'harness-api.js'),
    `(function(){
      const h={log:null,event:null,state:null};
      window.__h=h; window.__CALLS=[];
      window.autoquest=new Proxy({},{get(_t,k){
        if(k==='onLog')return f=>{h.log=f;};
        if(k==='onEvent')return f=>{h.event=f;};
        if(k==='onState')return f=>{h.state=f;};
        // Discord trả 403 · 10008 (đã ăn captcha_key nhưng không trao thưởng).
        if(k==='claimQuest')return p=>{
          window.__CALLS.push({call:'claim'});
          return Promise.resolve({ ok:false, status:403, code:10008, message:'Unknown Message' });
        };
        if(k==='openQuest')return id=>{window.__CALLS.push({call:'open',id});return Promise.resolve({ok:true,via:'app'});};
        if(k==='authCheck')return()=>Promise.resolve({ok:false});
        if(k==='getConfig')return()=>Promise.resolve({});
        if(k==='captchaTrace'||k==='saveLog')return()=>Promise.resolve();
        return ()=>Promise.resolve({ok:true});
      }});
    })();`,
  );
  html = html.replace(
    '<script src="renderer.js"></script>',
    '<script src="harness-api.js"></script>\n<script src="harness-data.js"></script>\n<script src="renderer.js"></script>',
  );
  const tmp = path.join(R, '.probe.html');
  fs.writeFileSync(tmp, html);

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: { contextIsolation: false, nodeIntegration: false },
  });
  await win.loadFile(tmp);
  await new Promise((r) => setTimeout(r, 700));

  const out = await win.webContents.executeJavaScript(
    `(async()=>{
      const info = {};
      window.__h.event({type:'quest:item',data:window.__LIST[0]});
      window.__h.event({type:'quest:inventory',data:{quests:window.__LIST}});
      await new Promise(r=>setTimeout(r,350));
      document.getElementById('token').value='a.b.c';
      const card=document.querySelector('#questListNew .qcard');
      if(!card) return {err:'no card'};
      const btn=card.querySelector('.qcard-act');
      info.tag=btn.tagName; info.clsBefore=btn.className; info.actBefore=btn.dataset.act;

      // Bấm NHẬN -> main giả trả 403/10008 -> nhánh mới phải bật cờ.
      btn.click();
      await new Promise(r=>setTimeout(r,450));
      info.actAfter=btn.dataset.act;
      info.labelAfter=btn.querySelector('span')?btn.querySelector('span').textContent:btn.textContent;
      info.clsAfter=btn.className;
      info.tagAfter=btn.tagName;
      info.disabledAfter=btn.disabled;
      info.titleAfter=btn.title;
      info.callsStep1=window.__CALLS.slice();

      // Bấm LẦN NỮA: phải gọi openQuest, KHÔNG gọi claim nữa.
      const before=window.__CALLS.length;
      btn.click();
      await new Promise(r=>setTimeout(r,300));
      info.callsStep2=window.__CALLS.slice();
      info.openWasCalled=window.__CALLS.some(c=>c.call==='open'&&c.id==='w1');
      info.claimCallsTotal=window.__CALLS.filter(c=>c.call==='claim').length;
      return info;
    })()`,
    true,
  );
  console.log('PROBE-OPEN:', JSON.stringify(out));
  try {
    fs.unlinkSync(tmp);
    fs.unlinkSync(path.join(R, 'harness-api.js'));
    fs.unlinkSync(path.join(R, 'harness-data.js'));
  } catch {
    /* ignore */
  }
  app.exit(0);
});
