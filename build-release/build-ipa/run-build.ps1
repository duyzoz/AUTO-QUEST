[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$nodeDir = "C:\Users\NgDuy-PC\AppData\Local\OpenAI\Codex\runtimes\cua_node\cfb32733c877621e\bin"
$env:PATH = "$nodeDir;" + $env:PATH
$nodeBin = Join-Path $nodeDir "node.exe"
$projectDir = "C:\Users\NgDuy-PC\Desktop\AUTO-QUEST-IOS"
$easBin = Join-Path $projectDir "node_modules\eas-cli\bin\run"

Set-Location $projectDir

Clear-Host
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   AUTO-QUEST PRO (iOS Edition) - EAS CLOUD BUILD" -ForegroundColor Yellow
Write-Host "   Tương thích iOS 15.0+ | iPhone 7 Plus | TrollStore" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Kiểm tra trạng thái tài khoản Expo..." -ForegroundColor Cyan
$whoami = & $nodeBin $easBin whoami 2>&1
$isNotLoggedIn = ($LASTEXITCODE -ne 0) -or ($whoami -match "Not logged in")

if ($isNotLoggedIn) {
    Write-Host ""
    Write-Host "----------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "⚠️  BẠN CẦN ĐĂNG NHẬP TÀI KHOẢN EXPO" -ForegroundColor Yellow
    Write-Host "👉 Hãy nhập Email (hoặc Username) và Mật khẩu tài khoản Expo của bạn:" -ForegroundColor White
    Write-Host "----------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ""
    & $nodeBin $easBin login
} else {
    Write-Host "✓ Đã đăng nhập tài khoản Expo: $whoami" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/3] Bắt đầu build file .IPA trên Cloud macOS của Expo..." -ForegroundColor Yellow
Write-Host "Hệ thống đang gửi mã nguồn lên server Apple của Expo để đóng gói..." -ForegroundColor Gray
Write-Host ""

& $nodeBin $easBin build -p ios --profile preview

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "[3/3] HOÀN TẤT!" -ForegroundColor Green
Write-Host "Hãy mở link tải file .ipa về iPhone 7 Plus và cài đặt qua TrollStore!" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Read-Host "Nhấn phím Enter để đóng cửa sổ"
