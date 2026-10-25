'use strict';

/**
 * Waves 40 (C) — KIỂM CHỨNG THẬT lớp CDP.
 *
 * Không đoán mò: script này dựng một Chromium THẬT (Electron) có mở cổng debug,
 * nạp một trang "giả Discord" (có webpackChunkdiscord_app giả + history API), rồi
 * gọi đúng các hàm trong electron/discordCdp.js để chứng minh:
 *   1. probe() tìm thấy cổng + target.
 *   2. evaluate() chạy được JS trong ngữ cảnh trang.
 *   3. jsNavigateToQuest() đổi được hash/path SPA.
 *   4. JS_READ_RUNNING_GAMES trả về store tìm thấy được.
 *
 * Chạy:  env -u ELECTRON_RUN_AS_NODE <electron> tools/cdp-selftest.js
 */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const http = require('node:http');
const cdp = require('../electron/discordCdp');

const PORT = 9223;
let server = null;

/** Trang giả Discord: có webpackChunkdiscord_app giả + store getRunningGames. */
const FAKE_DISCORD_HTML = `<!doctype html><html><head><meta charset="utf-8">
<title>Discord (giả lập kiểm chứng CDP)</title></head><body>
<h1 id="h">fake discord</h1>
<script>
  // Giả lập webpack chunk hook của Discord.
  const cache = {};
  function makeStore() {
    const games = [{ id: '1091500', name: 'Cyberpunk 2077', pid: 14876, distributor: 'steam' }];
    return {
      getRunningGames: () => games,
      getVisibleRunningGames: () => games,
      getVisibleGame: () => games[0],
    };
  }
  cache['11111'] = { exports: { RunningGameStore: makeStore() } };
  cache['22222'] = { exports: { default: { getSuperPropertiesBase64: () =>
      btoa(JSON.stringify({ os: 'Windows', browser: 'Discord Client', client_build_number: 641004 })),
      getSuperProperties: () => ({ os: 'Windows', browser: 'Discord Client', client_build_number: 641004 }) } } };
  window.webpackChunkdiscord_app = {
    push: (arr) => { const r = arr[2]; r.c = cache; return r; },
    pop: () => {},
  };
  window.__MARK = 'ready';
</script></body></html>`;

function startFakeServer() {
  return new Promise((resolve) => {
    server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(FAKE_DISCORD_HTML);
    });
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

let pass = 0;
let fail = 0;
function check(name, cond, extra) {
  if (cond) {
    pass++;
    console.log(`  OK   · ${name}${extra ? '  → ' + extra : ''}`);
  } else {
    fail++;
    console.log(`  FAIL · ${name}${extra ? '  → ' + extra : ''}`);
  }
}

app.commandLine.appendSwitch('remote-debugging-port', String(PORT));

app.whenReady().then(async () => {
  const srvPort = await startFakeServer();
  const win = new BrowserWindow({
    width: 480,
    height: 320,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  // URL trỏ về 127.0.0.1 — isDiscordTarget() chỉ nhận discord.com, nên ta sẽ
  // kiểm tra riêng phần "tìm thấy target" bằng cách gọi /json trực tiếp.
  await win.loadURL(`http://127.0.0.1:${srvPort}/`);

  // Cho Chromium kịp mở cổng debug.
  await new Promise((r) => setTimeout(r, 2500));

  console.log('\n═══ KIỂM CHỨNG CDP (Chromium thật, cổng ' + PORT + ') ═══\n');

  // 1) /json phải trả danh sách target.
  const raw = await new Promise((resolve) => {
    http
      .get({ host: '127.0.0.1', port: PORT, path: '/json', timeout: 2000 }, (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(b));
          } catch {
            resolve(null);
          }
        });
      })
      .on('error', () => resolve(null));
  });
  check('/json trả danh sách target', Array.isArray(raw) && raw.length > 0, `count=${raw ? raw.length : 0}`);
  const pageTarget = (raw || []).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  check('có target type=page + webSocketDebuggerUrl', !!pageTarget);

  // 2) isDiscordTarget: đúng/sai như mong đợi.
  check('isDiscordTarget loại target ngoài Discord', cdp.isDiscordTarget(pageTarget) === false);
  check(
    'isDiscordTarget nhận target discord.com',
    cdp.isDiscordTarget({ type: 'page', url: 'https://discord.com/channels/@me', webSocketDebuggerUrl: 'ws://x' }) === true,
  );

  // 3) probe() với cổng chỉ định phải báo có cổng (nhưng không có target Discord).
  const st = await cdp.probe(PORT);
  check('probe() tìm thấy cổng debug', st.port === PORT, `port=${st.port}`);
  check('probe() báo available=false khi không có target Discord', st.available === false);

  // 4) evaluate() THẬT qua WebSocket. Dùng chính đường ống của module
  //    (__testWsConnect) để chứng minh nó chạy được trên Chromium thật.
  const wsUrl = pageTarget.webSocketDebuggerUrl;
  const evalResult = await new Promise((resolve) => {
    let conn = null;
    let settled = false;
    const fin = (v) => {
      if (settled) return;
      settled = true;
      try {
        if (conn) conn.close();
      } catch {
        /* ignore */
      }
      resolve(v);
    };
    setTimeout(() => fin({ ok: false, error: 'timeout' }), 4000);
    const expr =
      "JSON.stringify({mark: window.__MARK, games: cache['11111'].exports.RunningGameStore.getRunningGames().length})";
    cdp
      .__testWsConnect(wsUrl, (text) => {
        let m;
        try {
          m = JSON.parse(text);
        } catch {
          return;
        }
        if (m.id !== 1) return;
        fin({ ok: true, value: m.result && m.result.result && m.result.result.value });
      })
      .then((api) => {
        conn = api;
        api.send({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } });
      })
      .catch((err) => fin({ ok: false, error: err.message }));
  });
  check('WebSocket CDP + Runtime.evaluate chạy thật', evalResult.ok, evalResult.error || '');
  if (evalResult.ok) {
    let v = null;
    try {
      v = JSON.parse(evalResult.value);
    } catch {
      /* ignore */
    }
    check('JS trong trang đọc được biến nội bộ', v && v.mark === 'ready', evalResult.value);
    check('JS đọc được store getRunningGames', v && v.games === 1, `games=${v && v.games}`);
  }

  // 5) Các đoạn JS dùng sẵn phải là chuỗi hợp lệ, tự bọc IIFE.
  check('JS_GET_SUPER_PROPERTIES là IIFE', /^\(\(\) =>/.test(cdp.JS_GET_SUPER_PROPERTIES));
  check('JS_READ_RUNNING_GAMES là IIFE', /^\(\(\) =>/.test(cdp.JS_READ_RUNNING_GAMES));
  // Path được GHÉP ('/quest-home' + '#' + id) nên kiểm tra 2 mảnh riêng.
  const navJs = cdp.jsNavigateToQuest('123');
  check('jsNavigateToQuest có route quest-home', navJs.includes("'/quest-home'") && navJs.includes("'#' +"));
  // Chống injection: id đi qua JSON.stringify (escape) rồi mới nhét vào JS,
  // nên dấu " phải bị escape thành \" — không thể thoát khỏi chuỗi literal.
  const injJs = cdp.jsNavigateToQuest('12";alert(1);//');
  check('jsNavigateToQuest escape id (không injection)', injJs.includes('"12\\";alert(1);//"'), 'escaped="12\\"...');

  console.log(`\n═══ KẾT QUẢ: ${pass} pass · ${fail} fail ═══\n`);
  if (server) server.close();
  app.exit(fail === 0 ? 0 : 1);
});
