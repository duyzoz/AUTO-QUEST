[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

param(
    [string]$IpaPath = "AUTO-QUEST-PRO-TrollStore.ipa"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$tokenFile = Join-Path $rootDir "push github(token).txt"

if (-not (Test-Path $tokenFile)) {
    Write-Host "[X] Khong tim thay file push github(token).txt tai: $tokenFile" -ForegroundColor Red
    exit 1
}

$token = (Get-Content $tokenFile).Trim()

if (-not (Test-Path $IpaPath)) {
    # Check common output locations
    $candidates = @(
        $IpaPath,
        (Join-Path $rootDir $IpaPath),
        (Join-Path $rootDir "build-output\$IpaPath"),
        (Join-Path $rootDir "mobile\$IpaPath")
    )
    $found = $null
    foreach ($c in $candidates) {
        if (Test-Path $c) {
            $found = $c
            break
        }
    }
    if ($found) {
        $IpaPath = $found
    } else {
        Write-Host "[X] Khong tim thay file .ipa tai: $IpaPath" -ForegroundColor Red
        Write-Host "Vui long truyen duong dan file .ipa hoac dat file vao thu muc du an." -ForegroundColor Yellow
        exit 1
    }
}

$fileName = [System.IO.Path]::GetFileName($IpaPath)
$fileBytes = [System.IO.File]::ReadAllBytes($IpaPath)
$fileSizeMB = [math]::Round($fileBytes.Length / 1MB, 2)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  UPLOAD FILE .IPA LEN GITHUB RELEASES" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "File: $fileName ($fileSizeMB MB)" -ForegroundColor White
Write-Host "Target: duyzoz/AUTO-QUEST -> Release v1.0.0" -ForegroundColor White
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
    "Accept"        = "application/vnd.github.v3+json"
}

# 1. Get release info
Write-Host "[1/3] Kiem tra Release v1.0.0 tren GitHub..." -ForegroundColor Cyan
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/duyzoz/AUTO-QUEST/releases/tags/v1.0.0" -Headers $headers -Method Get
} catch {
    Write-Host "[X] Loi lay thong tin release: $_" -ForegroundColor Red
    exit 1
}

# 2. Check if asset already exists and delete if needed (replace)
Write-Host "[2/3] Kiem tra asset cu..." -ForegroundColor Cyan
foreach ($asset in $release.assets) {
    if ($asset.name -eq $fileName) {
        Write-Host "  -> Phat hien asset cu (ID: $($asset.id)), dang xoa de upload ban moi..." -ForegroundColor Yellow
        Invoke-RestMethod -Uri "https://api.github.com/repos/duyzoz/AUTO-QUEST/releases/assets/$($asset.id)" -Headers $headers -Method Delete
        Start-Sleep -Seconds 1
    }
}

# 3. Upload new asset
Write-Host "[3/3] Dang upload $fileName ($fileSizeMB MB) len GitHub Release..." -ForegroundColor Cyan
$uploadUrl = "https://uploads.github.com/repos/duyzoz/AUTO-QUEST/releases/$($release.id)/assets?name=$fileName"

$uploadHeaders = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/octet-stream"
}

try {
    $response = Invoke-RestMethod -Uri $uploadUrl -Headers $uploadHeaders -Method Post -Body $fileBytes
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "[✓] UPLOAD THANH CONG!" -ForegroundColor Green
    Write-Host "Link download: $($response.browser_download_url)" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
} catch {
    Write-Host "[X] Loi khi upload: $_" -ForegroundColor Red
    exit 1
}
