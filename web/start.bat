@echo off
setlocal
cd /d "%~dp0.."

rem ── Ưu tiên node thật nếu có trong PATH ────────────────────────────────
where node >nul 2>nul
if %errorlevel%==0 (
  node web\server.js %*
  goto :eof
)

rem ── Fallback: dùng Qoder/VS Code làm Node (ELECTRON_RUN_AS_NODE) ───────
set "AQ_NODE=%LOCALAPPDATA%\Programs\Qoder\Qoder.exe"
if not exist "%AQ_NODE%" set "AQ_NODE=%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"
if not exist "%AQ_NODE%" (
  echo Khong tim thay Node.js hoac Qoder/VS Code.
  echo Cai Node.js LTS tai https://nodejs.org roi chay lai.
  pause
  exit /b 1
)

set ELECTRON_RUN_AS_NODE=1
"%AQ_NODE%" web\server.js %*
