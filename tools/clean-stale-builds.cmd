@echo off
REM ============================================================
REM  AUTO-QUEST - clean stale build artifacts (locked app.asar)
REM  Auto-run once after a reboot (registered in Startup folder).
REM  Safe: only removes regenerable electron-builder output.
REM ============================================================
setlocal
set ROOT=%~dp0..

REM 1) Stale build dirs now living at ROOT\build-release\exe (if any survived)
set EXE=%ROOT%\build-release\exe
if exist "%EXE%\run-2026*" (
  for /d %%D in ("%EXE%\run-2026*") do (
    echo Removing %%D
    rd /s /q "%%D"
  )
)
if exist "%EXE%\win-unpacked"        rd /s /q "%EXE%\win-unpacked"
if exist "%EXE%\win-unpacked.tmp"    rd /s /q "%EXE%\win-unpacked.tmp"
if exist "%EXE%\latest\win-unpacked"     rd /s /q "%EXE%\latest\win-unpacked"
if exist "%EXE%\latest\win-unpacked.tmp" rd /s /q "%EXE%\latest\win-unpacked.tmp"

REM 2) Leftover nested project shell from the old double-nesting
REM    (only contains locked build-release\exe junk after flattening)
set NEST=%ROOT%\AUTO-QUEST-main
if exist "%NEST%" (
  echo Removing leftover nested shell %NEST%
  rd /s /q "%NEST%"
)

echo Done.
endlocal
