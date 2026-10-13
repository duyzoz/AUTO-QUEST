const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('==============================================');
console.log('🔨 [1/3] Biên dịch TypeScript cho bot core...');
console.log('==============================================');
execSync('npx tsc -p tsconfig.build.json', { stdio: 'inherit' });

const tempOut = path.join(os.tmpdir(), 'autoquest-build');
console.log('\n==============================================');
console.log(`📦 [2/3] Đóng gói Portable EXE qua thư mục tạm: ${tempOut}...`);
console.log('==============================================');
execSync(`npx electron-builder --win portable --config.directories.output="${tempOut.replace(/\\/g, '/')}"`, {
	stdio: 'inherit'
});

const builtExe = path.join(tempOut, 'AUTO-QUEST.exe');
const targetRootExe = path.join(__dirname, '..', 'AUTO-QUEST.exe');
const releaseDir = path.join(__dirname, '..', 'release');
if (!fs.existsSync(releaseDir)) {
	fs.mkdirSync(releaseDir, { recursive: true });
}
const releaseExe = path.join(releaseDir, 'AUTO-QUEST.exe');

console.log('\n==============================================');
console.log(`🚀 [3/3] Xuất file AUTO-QUEST.exe...`);
console.log('==============================================');

if (fs.existsSync(builtExe)) {
	fs.copyFileSync(builtExe, targetRootExe);
	fs.copyFileSync(builtExe, releaseExe);
	console.log('\n🎉 THÀNH CÔNG! File thực thi sẵn sàng tại:');
	console.log('👉 ' + targetRootExe);
} else {
	console.error('Không tìm thấy file EXE vừa build tại: ' + builtExe);
	process.exit(1);
}
