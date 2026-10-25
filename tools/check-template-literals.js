/* Guard: chặn lỗi BACKTICK TRONG TEMPLATE LITERAL (đã cắn 4 lần trong dự án).

   Vì sao cần: các probe nhồi một đoạn JS lớn vào hằng `const MEASURE = \`...\``.
   Nếu BÊN TRONG đoạn đó có thêm một dấu ` (kể cả trong CHÚ THÍCH) thì chuỗi
   template kết thúc sớm → hệ quả:
     - số backtick LẺ  → `node --check` báo SyntaxError (dễ thấy);
     - số backtick CHẴN → `node --check` VẪN PASS vì chuỗi đóng/mở lại ăn khớp,
       nhưng lệnh bị ghép sai, và tiến trình Electron chết im lặng với SIGTERM,
       KHÔNG in gì — dễ tưởng app hỏng. Đây là bẫy nguy hiểm nhất.

   PHƯƠNG PHÁP (không đoán, dựa trên cú pháp): với mỗi template literal gắn với
   khai báo (`NAME = \``), ta tìm dấu đóng bằng bộ đếm hiểu escape và nội suy
   `${...}`. Một backtick ở độ sâu nội suy 0 CHỈ là dấu đóng hợp lệ nếu ngay sau
   nó là cú pháp kết thúc câu lệnh (`;`, `)`, `,`, xuống dòng, hết file). Nếu
   không, đó là backtick TRẦN nằm trong chú thích/chuỗi bên trong → báo lỗi.

   Cách chạy:  node tools/check-template-literals.js [file...]
   Không tham số → quét mọi tools/*.js.
   Thoát mã 1 nếu phát hiện. */
const fs = require('fs');
const path = require('path');

/** Sau dấu đóng template literal, cú pháp phải là một trong các ký tự này. */
function tailLooksValid(src, endIdx) {
	let k = endIdx + 1;
	while (k < src.length && (src[k] === ' ' || src[k] === '\t')) k++;
	if (k >= src.length) return true;
	const c = src[k];
	return c === ';' || c === ')' || c === ',' || c === '\n' || c === '\r';
}

/** Trích mọi template literal gắn với khai báo; tôn trọng `\`` và `${...}`. */
function scanStrict(src) {
	const problems = [];
	const re = /\b([A-Za-z_$][\w$]*)\s*=\s*`/g;
	let m;
	while ((m = re.exec(src)) !== null) {
		const name = m[1];
		let i = m.index + m[0].length;
		let depth = 0;
		let end = -1;
		const stray = [];
		while (i < src.length) {
			const ch = src[i];
			if (ch === '\\') {
				i += 2;
				continue;
			}
			if (ch === '$' && src[i + 1] === '{') {
				depth++;
				i += 2;
				continue;
			}
			if (ch === '}' && depth > 0) {
				depth--;
				i++;
				continue;
			}
			if (ch === '`') {
				if (depth === 0) {
					if (tailLooksValid(src, i)) {
						end = i;
						break;
					}
					// Backtick nằm trong chú thích/chuỗi của đoạn JS ⇒ đóng sớm.
					stray.push(i);
					i++;
					continue;
				}
				i++;
				continue;
			}
			i++;
		}
		if (end !== -1 && stray.length > 0) {
			const line = src.slice(0, stray[0]).split('\n').length;
			problems.push({ name, line, count: stray.length });
		}
	}
	return problems;
}

const args = process.argv.slice(2);
const files = args.length
	? args
	: fs
			.readdirSync(path.join(__dirname))
			.filter((f) => f.endsWith('.js'))
			.map((f) => path.join(__dirname, f));

let bad = 0;
for (const f of files) {
	let src;
	try {
		src = fs.readFileSync(f, 'utf8');
	} catch {
		continue;
	}
	for (const p of scanStrict(src)) {
		bad++;
		console.log(
			`FAIL ${path.basename(f)}:${p.line}  template "${p.name}" bị đóng sớm bởi backtick trần (${p.count} chỗ)`,
		);
	}
}
if (bad) {
	console.log(
		`\n>>> TEMPLATE LITERAL GUARD: ${bad} chỗ có backtick trần — SẼ gây SyntaxError hoặc chết im lặng (SIGTERM).`,
	);
	process.exit(1);
}
console.log(`>>> TEMPLATE LITERAL GUARD: sạch (${files.length} file đã quét).`);
