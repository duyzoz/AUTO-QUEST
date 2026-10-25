/**
 * Waves 36 — `npm run dev` an toàn.
 *
 * Vì sao cần: Electron có `requestSingleInstanceLock()`. Nếu cửa sổ app còn sót
 * (đóng không sạch, hoặc agent/test để lại) thì `npm run dev` KHÔNG mở bản mới —
 * nó chỉ focus cửa sổ CŨ đang chạy CODE CŨ. Hệ quả cực khó chịu: sửa code xong,
 * chạy lại vẫn thấy lỗi y như cũ, tưởng fix không ăn.
 *
 * Script này diệt sạch tiến trình electron còn sót TRƯỚC khi mở bản mới, và in ra
 * số tiến trình đã dọn. Chỉ nhắm electron.exe của app (không đụng app khác: lọc
 * theo đường dẫn node_modules/electron).
 */
'use strict';

const { execSync, spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const root = path.join(__dirname, '..');
const isWin = process.platform === 'win32';

function killStaleElectron() {
	if (!isWin) {
		// macOS/Linux: chỉ hạ tiến trình electron khớp thư mục dự án.
		try {
			const out = execSync('ps -eo pid,args', { encoding: 'utf8' });
			let killed = 0;
			for (const line of out.split('\n')) {
				if (line.includes(root) && /electron/i.test(line)) {
					const pid = line.trim().split(/\s+/)[0];
					try {
						process.kill(Number(pid), 'SIGKILL');
						killed++;
					} catch {
						/* ignore */
					}
				}
			}
			return killed;
		} catch {
			return 0;
		}
	}

	// Windows: đọc danh sách qua wmic/powershell để LỌC theo đường dẫn, tránh
	// diệt electron của ứng dụng khác đang chạy trên máy.
	let killed = 0;
	try {
		const ps =
			"Get-CimInstance Win32_Process -Filter \"Name='electron.exe'\" | " +
			"Where-Object { $_.ExecutablePath -like '*AUTO-QUEST*' -or $_.CommandLine -like '*AUTO-QUEST*' } | " +
			'ForEach-Object { $_.ProcessId }';
		const out = execSync(`powershell -NoProfile -Command "${ps}"`, {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		});
		const pids = out
			.split(/\s+/)
			.map((s) => s.trim())
			.filter((s) => /^\d+$/.test(s));
		for (const pid of pids) {
			try {
				execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
				killed++;
			} catch {
				/* ignore */
			}
		}
	} catch {
		// Không lọc được thì bỏ qua — thà chạy còn hơn không chạy.
	}
	return killed;
}

// 1) Dọn tiến trình còn sót
const killed = killStaleElectron();
if (killed > 0) {
	console.log(`[dev] Đã dọn ${killed} tiến trình app còn sót (tránh mở nhầm bản CŨ).`);
}

// 2) In dấu vân tay mã nguồn để biết CHẮC bản đang chạy là bản mới nhất
const stamp = (rel) => {
	try {
		const st = fs.statSync(path.join(root, rel));
		return `${rel}@${st.mtimeMs.toFixed(0)}`;
	} catch {
		return `${rel}@missing`;
	}
};
console.log(
	`[dev] Build stamp: ${stamp('electron/main.js')} | ${stamp('electron/renderer/renderer.js')}`,
);

// 3) Chạy electron với env đã gỡ ELECTRON_RUN_AS_NODE (biến này rò trong shell
//    agent làm electron chạy như Node thuần → thoát im lặng, không mở cửa sổ).
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

// Waves 37: khi thử probe trên origin discord.com thật, cần trỏ discord.com về
// 127.0.0.1 (nơi HTTPS server giả lập chạy) và bỏ qua lỗi cert tự ký. CHỈ áp dụng
// khi bật AQ_PROBE_DISCORD — bản chạy thường KHÔNG đụng tới.
const electronArgs = ['.'];
if (process.env.AQ_PROBE_DISCORD) {
	electronArgs.push('--ignore-certificate-errors', '--host-resolver-rules=MAP discord.com 127.0.0.1');
	console.log('[dev] Probe mode: trỏ discord.com → 127.0.0.1 (chỉ để đo hCaptcha).');
}

const electronBin = require('electron');
const child = spawn(electronBin, electronArgs, {
	cwd: root,
	env,
	stdio: 'inherit',
	windowsHide: false,
});
child.on('exit', (code) => process.exit(code == null ? 0 : code));
