'use strict';

/**
 * Waves 40 (C) — LỚP CDP: NÓI CHUYỆN VỚI DISCORD THẬT QUA CHROME DEVTOOLS PROTOCOL.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VÌ SAO CÓ FILE NÀY (đọc kỹ — đây là bài học lớn nhất từ repo discord-quest-helper)
 * ─────────────────────────────────────────────────────────────────────────────
 * Repo mở `discord-quest-helper` KHÔNG BAO GIỜ tự gọi endpoint claim của Discord.
 * Từ khoá "captcha" xuất hiện ĐÚNG 0 LẦN trong toàn bộ ~47.000 dòng mã của họ.
 *
 * Bí quyết: họ KHỞI ĐỘNG Discord với `--remote-debugging-port=<port>`, rồi nối vào
 * qua CDP (WebSocket) và TIÊM JavaScript vào chính cửa sổ Discord đang chạy. Nhờ đó:
 *   • Mọi request do CHÍNH DISCORD gửi (đúng phiên, đúng chữ ký, đúng X-Super-Properties
 *     sống) — không phải request giả từ app ngoài.
 *   • hCaptcha chạy NATIVE trong Chromium của Discord → token hợp lệ thật, không còn
 *     cảnh "passive token P1_/pd:0" như khi ta tự render trong Electron.
 *   • Heartbeat tiến độ game do Discord tự gửi qua RunningGameStore/FluxDispatcher.
 *
 * ĐÂY LÀ ĐIỀU TÔI HỌC ĐƯỢC VÀ ÁP DỤNG Ở ĐÂY — KHÔNG PHẢI BYPASS:
 * chúng ta vẫn để Discord tự quyết định, chỉ "giúp nó" đúng cách con người sẽ làm
 * (mở app, để nó chạy, bấm Claim trong app — captcha do người dùng giải nếu Discord đòi).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PHẠM VI CỦA MODULE NÀY
 * ─────────────────────────────────────────────────────────────────────────────
 *   1. Dò xem Discord có đang chạy với cổng debug không (HTTP GET /json — giống hệt
 *      `list_cdp_targets` của repo, cổng mặc định 9223).
 *   2. Chọn đúng TARGET Discord (target_type === 'page' && host là discord.com).
 *   3. `Runtime.evaluate` một đoạn JS tuỳ ý trong ngữ cảnh đó.
 *   4. Cung cấp sẵn vài đoạn JS hữu ích: đọc SuperProperties sống, đọc RunningGameStore,
 *      và ĐIỀU HƯỚNG SPA tới /quest-home#<id> (đúng như `navigateDiscordSpa` của họ).
 *
 * Module này KHÔNG tự ý chạy. Nó chỉ được gọi khi app cần và người dùng bật. Nếu
 * Discord không bật cổng debug → trả về {available:false, reason} rõ ràng, không
 * đoán mò, không bịa kết quả.
 */

const http = require('node:http');

/** Cổng debug mặc định — trùng `DEFAULT_CDP_PORT = 9223` của repo tham chiếu. */
const DEFAULT_CDP_PORT = 9223;

/** Danh sách cổng sẽ thử (repo dùng 9223; nhiều bản Discord/Vesktop dùng 9222). */
const CANDIDATE_PORTS = [9223, 9222, 9229];

/** Host hợp lệ của target Discord (học từ `is_discord_target`). */
const DISCORD_HOSTS = ['discord.com', 'discordapp.com'];

// ─────────────────────────────────────────────────────────────────────────────
// 1) DÒ CỔNG + LIỆT KÊ TARGET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * HTTP GET tới endpoint của DevTools. Trả JSON đã parse, hoặc null nếu không nối được.
 * Chủ đích viết bằng `node:http` thuần để không thêm dependency nào.
 */
function devtoolsGet(port, pathname = '/json', timeoutMs = 1500) {
	return new Promise((resolve) => {
		let done = false;
		const finish = (v) => {
			if (done) return;
			done = true;
			resolve(v);
		};
		let req;
		try {
			req = http.get(
				{ host: '127.0.0.1', port, path: pathname, timeout: timeoutMs },
				(res) => {
					if (res.statusCode !== 200) {
						res.resume();
						return finish(null);
					}
					let body = '';
					res.setEncoding('utf8');
					res.on('data', (c) => {
						body += c;
						// Chặn rác khổng lồ (repo cũng giới hạn 1 MiB).
						if (body.length > 4 * 1024 * 1024) {
							req.destroy();
							finish(null);
						}
					});
					res.on('end', () => {
						try {
							finish(JSON.parse(body));
						} catch {
							finish(null);
						}
					});
				},
			);
		} catch {
			return finish(null);
		}
		req.on('error', () => finish(null));
		req.on('timeout', () => {
			req.destroy();
			finish(null);
		});
	});
}

/** Target này có phải cửa sổ Discord thật không? (theo `is_discord_target`). */
function isDiscordTarget(t) {
	if (!t || t.type !== 'page') return false;
	if (!t.url || !t.webSocketDebuggerUrl) return false;
	let u;
	try {
		u = new URL(t.url);
	} catch {
		return false;
	}
	if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
	const host = u.hostname.toLowerCase();
	return DISCORD_HOSTS.some((d) => host === d || host.endsWith(`.${d}`));
}

/** Bỏ qua các cửa sổ phụ (overlay) — không phải nơi webpack store sống. */
function isAuxiliaryWindow(t) {
	const title = String((t && t.title) || '').toLowerCase();
	return title === 'discord overlay';
}

/**
 * Dò CDP. Thử lần lượt các cổng ứng viên.
 * @returns {Promise<{available:boolean, port:number|null, targets:Array, discordTargets:Array, reason?:string}>}
 */
async function probe(portOverride) {
	const ports = portOverride ? [Number(portOverride)] : CANDIDATE_PORTS;
	for (const port of ports) {
		const list = await devtoolsGet(port, '/json');
		if (!Array.isArray(list)) continue;
		const discordTargets = list.filter((t) => isDiscordTarget(t) && !isAuxiliaryWindow(t));
		return {
			available: discordTargets.length > 0,
			port,
			targets: list.map((t) => ({ type: t.type, title: t.title, url: t.url })),
			discordTargets: discordTargets.map((t) => ({ title: t.title, url: t.url, ws: t.webSocketDebuggerUrl })),
			reason:
				discordTargets.length > 0
					? undefined
					: 'Cổng debug có mở nhưng không tìm thấy cửa sổ Discord (target page @ discord.com).',
		};
	}
	return {
		available: false,
		port: null,
		targets: [],
		discordTargets: [],
		reason:
			'Không thấy cổng debug nào mở. Discord cần được chạy kèm `--remote-debugging-port=9223` ' +
			'(xem mục "Bật CDP" bên dưới).',
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) WEBSOCKET TỐI GIẢN (chỉ dùng cho CDP) — tự viết, không thêm dependency
//    Giao thức CDP: gửi {"id":n,"method":"Runtime.evaluate","params":{...}}
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('node:crypto');
const net = require('node:net');

/** Mã hoá frame WebSocket phía client (client→server PHẢI mask). */
function wsEncode(payload) {
	const data = Buffer.from(payload, 'utf8');
	const len = data.length;
	let header;
	if (len < 126) {
		header = Buffer.alloc(6);
		header[1] = 0x80 | len;
	} else if (len < 65536) {
		header = Buffer.alloc(8);
		header[1] = 0x80 | 126;
		header.writeUInt16BE(len, 2);
	} else {
		header = Buffer.alloc(14);
		header[1] = 0x80 | 127;
		header.writeBigUInt64BE(BigInt(len), 2);
	}
	header[0] = 0x81; // FIN + opcode text
	const mask = crypto.randomBytes(4);
	const maskOffset = len < 126 ? 2 : len < 65536 ? 4 : 10;
	mask.copy(header, maskOffset);
	const masked = Buffer.allocUnsafe(len);
	for (let i = 0; i < len; i++) masked[i] = data[i] ^ mask[i % 4];
	return Buffer.concat([header, masked]);
}

/** Giải mã frame WebSocket nhận được (server→client KHÔNG mask).
 *  Trả về {frames, consumed} — `consumed` là số byte đã tiêu thụ, phần dư phải
 *  giữ lại cho lần đọc sau (frame có thể bị cắt qua nhiều gói TCP). */
function wsDecode(buf) {
	const frames = [];
	let off = 0;
	while (off + 2 <= buf.length) {
		const b0 = buf[off];
		const b1 = buf[off + 1];
		const fin = (b0 & 0x80) === 0x80;
		const opcode = b0 & 0x0f;
		let len = b1 & 0x7f;
		let p = off + 2;
		if (len === 126) {
			if (p + 2 > buf.length) break;
			len = buf.readUInt16BE(p);
			p += 2;
		} else if (len === 127) {
			if (p + 8 > buf.length) break;
			len = Number(buf.readBigUInt64BE(p));
			p += 8;
		}
		const masked = (b1 & 0x80) === 0x80;
		let maskKey = null;
		if (masked) {
			if (p + 4 > buf.length) break;
			maskKey = buf.subarray(p, p + 4);
			p += 4;
		}
		// Chưa đủ payload → dừng, giữ nguyên `off` để lần sau ghép tiếp.
		if (p + len > buf.length) break;
		let payload = buf.subarray(p, p + len);
		if (masked) {
			const out = Buffer.allocUnsafe(len);
			for (let i = 0; i < len; i++) out[i] = payload[i] ^ maskKey[i % 4];
			payload = out;
		}
		off = p + len;
		frames.push({ fin, opcode, payload });
	}
	return { frames, consumed: off };
}

/** Ghép các frame nối tiếp (opcode 0x0 continuation) lại thành 1 message. */
function makeFrameReader(onText, onClose) {
	let pending = null; // {opcode, chunks:[]} cho message bị phân mảnh
	return {
		push(chunk) {
			const { frames } = wsDecode(chunk);
			for (const f of frames) {
				if (f.opcode === 0x8) {
					if (onClose) onClose();
					return;
				}
				if (f.opcode === 0x9) continue; // ping → bỏ qua (ta không dùng)
				if (f.opcode === 0x1 || f.opcode === 0x2) {
					pending = { opcode: f.opcode, chunks: [f.payload] };
				} else if (f.opcode === 0x0 && pending) {
					pending.chunks.push(f.payload);
				} else {
					continue;
				}
				if (f.fin && pending) {
					const text = Buffer.concat(pending.chunks).toString('utf8');
					pending = null;
					try {
						onText(text);
					} catch {
						/* ignore */
					}
				}
			}
		},
	};
}

/**
 * Mở kết nối WebSocket tới `wsUrl`, gọi `onMessage(text)` mỗi khi nhận JSON.
 * Trả về object có `send(obj)` và `close()`.
 */
function wsConnect(wsUrl, onMessage, onClose) {
	return new Promise((resolve, reject) => {
		const u = new URL(wsUrl);
		const key = crypto.randomBytes(16).toString('base64');
		const sock = net.connect({ host: u.hostname, port: Number(u.port || 80) }, () => {
			const req =
				`GET ${u.pathname}${u.search} HTTP/1.1\r\n` +
				`Host: ${u.host}\r\n` +
				'Upgrade: websocket\r\n' +
				'Connection: Upgrade\r\n' +
				`Sec-WebSocket-Key: ${key}\r\n` +
				'Sec-WebSocket-Version: 13\r\n\r\n';
			sock.write(req);
		});

		let handshakeDone = false;
		let carry = Buffer.alloc(0);
		let reader = null;

		const fail = (err) => {
			try {
				sock.destroy();
			} catch {
				/* ignore */
			}
			if (!handshakeDone) reject(err);
		};

		sock.on('error', fail);
		sock.on('close', () => {
			if (onClose) onClose();
		});

		sock.on('data', (chunk) => {
			carry = Buffer.concat([carry, chunk]);

			if (!handshakeDone) {
				const idx = carry.indexOf('\r\n\r\n');
				if (idx === -1) return;
				const head = carry.subarray(0, idx).toString('latin1');
				if (!/^HTTP\/1\.1 101/.test(head)) {
					return fail(new Error(`CDP upgrade thất bại: ${head.split('\r\n')[0]}`));
				}
				handshakeDone = true;
				carry = carry.subarray(idx + 4);
				reader = makeFrameReader(onMessage, () => {
					try {
						sock.end();
					} catch {
						/* ignore */
					}
				});
				const api = {
					send(obj) {
						try {
							sock.write(wsEncode(JSON.stringify(obj)));
						} catch {
							/* ignore */
						}
					},
					close() {
						try {
							sock.end();
						} catch {
							/* ignore */
						}
					},
				};
				resolve(api);
			}

			if (reader && carry.length) {
				// Tiêu thụ đúng số byte của các frame hoàn chỉnh, giữ phần dư.
				const { consumed } = wsDecode(carry);
				reader.push(carry.subarray(0, consumed));
				carry = carry.subarray(consumed);
				// Chặn buffer phình vô hạn nếu có dữ liệu rác.
				if (carry.length > 8 * 1024 * 1024) carry = Buffer.alloc(0);
			}
		});
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// 3) Runtime.evaluate — trái tim của module
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chạy một biểu thức JS trong ngữ cảnh cửa sổ Discord thật.
 *
 * @param {string} expression   JS cần chạy (nên là IIFE trả JSON string).
 * @param {object} [opts]
 * @param {number} [opts.port]      cổng debug cụ thể
 * @param {number} [opts.timeoutMs] hạn chờ (mặc định 6000)
 * @returns {Promise<{ok:boolean, value?:any, discordTarget?:string, error?:string}>}
 */
async function evaluate(expression, opts = {}) {
	const info = await probe(opts.port);
	if (!info.available) return { ok: false, error: info.reason };

	// Ưu tiên target có URL /channels/ hoặc /quest-home (cửa sổ chính).
	const sorted = info.discordTargets.slice().sort((a, b) => {
		const score = (t) => (/\/channels\//.test(t.url) ? 2 : /\/quest-home/.test(t.url) ? 1 : 0);
		return score(b) - score(a);
	});
	const target = sorted[0];

	const timeoutMs = opts.timeoutMs || 6000;
	return new Promise((resolve) => {
		let settled = false;
		let conn = null;
		let timer = null;
		const finish = (v) => {
			if (settled) return;
			settled = true;
			if (timer) clearTimeout(timer);
			try {
				if (conn) conn.close();
			} catch {
				/* ignore */
			}
			resolve(v);
		};

		timer = setTimeout(() => finish({ ok: false, error: `Hết hạn chờ CDP (${timeoutMs}ms).` }), timeoutMs);

		wsConnect(
			target.ws,
			(text) => {
				let msg;
				try {
					msg = JSON.parse(text);
				} catch {
					return;
				}
				if (msg.id !== 1) return;
				if (msg.error) return finish({ ok: false, error: msg.error.message || 'CDP trả lỗi.' });
				const r = msg.result && msg.result.result;
				if (msg.result && msg.result.exceptionDetails) {
					return finish({
						ok: false,
						error:
							(msg.result.exceptionDetails.exception &&
								msg.result.exceptionDetails.exception.description) ||
							msg.result.exceptionDetails.text ||
							'JS trong Discord ném lỗi.',
					});
				}
				if (!r) return finish({ ok: false, error: 'CDP không trả kết quả.' });
				let value = r.value;
				if (r.type === 'string' && typeof value === 'string') {
					// Cho tiện: nếu chuỗi là JSON thì parse luôn.
					try {
						value = JSON.parse(value);
					} catch {
						/* giữ nguyên string */
					}
				}
				finish({ ok: true, value, discordTarget: target.url });
			},
			() => finish({ ok: false, error: 'Kết nối CDP bị đóng.' }),
		)
			.then((api) => {
				conn = api;
				api.send({
					id: 1,
					method: 'Runtime.evaluate',
					params: {
						expression,
						returnByValue: true,
						awaitPromise: true,
						userGesture: true,
					},
				});
			})
			.catch((err) => finish({ ok: false, error: err.message || String(err) }));
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) CÁC ĐOẠN JS DÙNG SẴN (phỏng theo repo tham chiếu, đã tinh giản)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Đọc X-Super-Properties SỐNG từ chính Discord (thay vì dựng giả ở máy ta).
 * Học từ `JS_GET_SUPER_PROPERTIES`. Đây là "nguồn chân lý" — chuẩn 100% vì là của Discord.
 */
const JS_GET_SUPER_PROPERTIES = `(() => {
  try {
    if (typeof window === 'undefined' || !window.webpackChunkdiscord_app) {
      return JSON.stringify({ error: 'webpackChunkdiscord_app không tồn tại (Discord đổi cấu trúc?)' });
    }
    const wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, (r) => r]);
    webpackChunkdiscord_app.pop();
    let mod = null;
    for (const m of Object.values(wpRequire.c)) {
      try {
        const exp = m && m.exports && m.exports.default;
        if (exp && typeof exp.getSuperPropertiesBase64 === 'function' && typeof exp.getSuperProperties === 'function') {
          const b = exp.getSuperPropertiesBase64();
          if (typeof b === 'string' && b.length > 50) { mod = m; break; }
        }
      } catch (_) { continue; }
    }
    if (!mod) return JSON.stringify({ error: 'Không tìm thấy module SuperProperties' });
    const base64 = mod.exports.default.getSuperPropertiesBase64();
    const decoded = mod.exports.default.getSuperProperties();
    return JSON.stringify({ base64, decoded });
  } catch (e) {
    return JSON.stringify({ error: String((e && e.message) || e) });
  }
})()`;

/**
 * Đọc RunningGameStore — trạng thái "game đang chạy" mà Discord dùng để đếm tiến độ.
 * Học từ khối discovery trong `cdp_client.rs`. Chỉ ĐỌC, không sửa.
 */
const JS_READ_RUNNING_GAMES = `(() => {
  try {
    const chunk = window.webpackChunkdiscord_app;
    if (!chunk) return JSON.stringify({ error: 'webpackChunkdiscord_app không tồn tại' });
    const wpRequire = chunk.push([[Symbol()], {}, (r) => r]);
    chunk.pop();
    const cache = wpRequire && wpRequire.c;
    if (!cache) return JSON.stringify({ error: 'webpack require cache không tồn tại' });
    const out = { found: false, path: null, games: [] };
    for (const [id, mod] of Object.entries(cache)) {
      const exp = mod && mod.exports;
      if (!exp) continue;
      for (const key of Object.keys(exp)) {
        let store;
        try { store = exp[key]; } catch (_) { continue; }
        if (typeof (store && store.getRunningGames) !== 'function') continue;
        let games;
        try { games = store.getRunningGames(); } catch (_) { continue; }
        if (!Array.isArray(games)) continue;
        out.found = true;
        out.path = 'module[' + id + '].exports.' + key;
        out.games = games.map((g) => ({
          id: g && g.id,
          name: g && (g.name || g.title),
          pid: g && g.pid,
          distributor: g && g.distributor,
        }));
        return JSON.stringify(out);
      }
    }
    return JSON.stringify(out);
  } catch (e) {
    return JSON.stringify({ error: String((e && e.message) || e) });
  }
})()`;

/**
 * Điều hướng SPA tới trang quest của 1 nhiệm vụ — ĐÚNG như `navigateDiscordSpa` của repo.
 * Dùng router nội bộ của Discord nên KHÔNG reload trang, giữ nguyên phiên & store.
 */
function jsNavigateToQuest(questId) {
	const safeId = JSON.stringify(String(questId || ''));
	return `(() => {
  try {
    const path = '/quest-home' + (${safeId} ? ('#' + ${safeId}) : '');
    // Discord dùng history API cho router SPA.
    if (window.history && typeof window.history.pushState === 'function') {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    } else {
      window.location.hash = ${safeId};
    }
    return JSON.stringify({ ok: true, path });
  } catch (e) {
    return JSON.stringify({ ok: false, error: String((e && e.message) || e) });
  }
})()`;
}

/** Gộp: thông tin sức khoẻ của lớp CDP (dùng cho UI chẩn đoán). */
async function status(port) {
	const info = await probe(port);
	return {
		available: info.available,
		port: info.port,
		discordTargets: info.discordTargets.map((t) => t.url),
		targetCount: info.targets.length,
		reason: info.reason,
		defaultPort: DEFAULT_CDP_PORT,
	};
}

module.exports = {
	DEFAULT_CDP_PORT,
	CANDIDATE_PORTS,
	probe,
	status,
	evaluate,
	isDiscordTarget,
	JS_GET_SUPER_PROPERTIES,
	JS_READ_RUNNING_GAMES,
	jsNavigateToQuest,
	// Chỉ dùng cho kiểm chứng (tools/cdp-ws-test.js): mở đường ống WS thô để test.
	__testWsConnect: wsConnect,
	__testWsDecode: wsDecode,
};
