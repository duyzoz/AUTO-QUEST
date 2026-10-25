; ============================================================================
;  Auto Quest — NSIS installer customization  (NSIS include)
;  Project: ZoZ Development / AUTO-QUEST
;  Electron-builder auto-includes this file in BOTH the installer and the
;  uninstaller, so every macro below is guarded with `!ifndef BUILD_UNINSTALLER`.
; ============================================================================

!include "LogicLib.nsh"
!include "WinVer.nsh"
!include "x64.nsh"

; ---------------------------------------------------------------------------
; Branding / colours (BGR on 32-bit-capable builds, RGB ints otherwise)
; ---------------------------------------------------------------------------
!define MUI_BGCOLOR "0B0E18"
!define MUI_TEXTCOLOR "F3F5FA"

; ---------------------------------------------------------------------------
; Custom installer pages — welcome -> license -> directory -> install
; (electron-builder already adds welcome/license/dir pages when the matching
;  nsis.* options are on; we only add the polish pages below.)
; ---------------------------------------------------------------------------
!macro preInit
  ; Default install dir -> %LOCALAPPDATA%\Programs\Auto Quest (per-user install,
  ; so no UAC prompt on a normal machine).
  SetRegView 64
  WriteRegExpandStr HKCU "Software\Auto Quest\Installer" "InstallLocation" "$INSTDIR"
!macroend

!macro customInit
  ; Refuse to run on pre-Windows-10 — Electron 38 needs Win10+.
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_ICONSTOP|MB_OK "Auto Quest yêu cầu Windows 10 trở lên (64-bit).$\r$\n$\r$\nVui lòng nâng cấp Windows rồi chạy lại bộ cài."
    Abort
  ${EndIf}
  ; Refuse 32-bit Windows.
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP|MB_OK "Auto Quest chỉ hỗ trợ Windows 64-bit.$\r$\n$\r$\nHệ thống của bạn là 32-bit."
    Abort
  ${EndIf}
!macroend

; ---------------------------------------------------------------------------
; Kill a running Auto Quest so files are not locked during install/uninstall.
; ---------------------------------------------------------------------------
!macro customCheckAppRunning
  nsExec::Exec 'taskkill /F /IM "Auto Quest.exe" /T'
  Pop $0
  Sleep 400
!macroend

; ---------------------------------------------------------------------------
; Write uninstall info + a friendly welcome in the registry (Add/Remove view)
; ---------------------------------------------------------------------------
!macro customInstall
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" \
    "DisplayName" "Auto Quest"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" \
    "Publisher" "ZoZ Development (NgDuy)"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" \
    "URLInfoAbout" "https://github.com/duyzoz/AUTO-QUEST"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" \
    "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" \
    "NoModify" "1"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" \
    "NoRepair" "1"
!macroend

!macro customUnInstall
  ; Token/config lives in %APPDATA%\AUTO-QUEST and is intentionally KEPT on
  ; uninstall so a reinstall restores the session. (nsis.deleteAppDataOnUninstall=false)
  DeleteRegKey HKCU "Software\Auto Quest\Installer"
!macroend
