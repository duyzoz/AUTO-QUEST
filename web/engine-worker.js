'use strict';

/* Worker chạy engine quest. Tách khỏi trang để:
   · vòng poll video/heartbeat không làm treo UI (setTimeout ở tab chính bị bóp),
   · "Dừng" = terminate worker (tương đương taskkill bên Electron). */

importScripts('identity.js', 'engine-bundle.js');

let running = false;

self.onmessage = function (event) {
	const msg = event.data || {};
	// Wave#131: nhịp tim — trả lời cả khi engine đang chạy.
	if (msg.type === 'ping') {
		self.postMessage({ type: 'pong', id: msg.id, at: Date.now() });
		return;
	}
	if (msg.type !== 'start') return;
	if (running) {
		self.postMessage({ type: 'event', event: { type: 'fatal', data: { message: 'Engine đang chạy.' } } });
		return;
	}
	running = true;
	try {
		self.AQEngineBundle.run(msg.config || {}, {
			emit: function (type, data) {
				self.postMessage({ type: 'event', event: { type: type, data: data } });
			},
			log: function (stream, line) {
				self.postMessage({ type: 'log', stream: stream, line: line });
			},
			exit: function (code) {
				self.postMessage({ type: 'exit', code: Number(code) || 0 });
				setTimeout(function () { self.close(); }, 30);
			},
		});
	} catch (err) {
		self.postMessage({
			type: 'event',
			event: { type: 'fatal', data: { message: (err && err.message) || String(err) } },
		});
		self.postMessage({ type: 'exit', code: 1 });
	}
};
