#!/usr/bin/env bash
# Waves 37: chạy trọn vòng captcha — lấy phiên tươi → giải trong trang probe →
# gửi NGAY lập tức cho Discord. In kết quả từng biến thể.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
QID="${1:-1547647018090893312}"
VARIANT="${2:-keyOnly}"
HEADERS="${3:-1}"
MODE="${4:-execute}"

kill_electron() { taskkill //F //IM electron.exe >/dev/null 2>&1 || true; }

echo "[e2e] (1/3) Lấy phiên captcha tươi cho quest $QID…"
kill_electron; sleep 1
env -u ELECTRON_RUN_AS_NODE AQ_CAPTCHA_PROBE_ID="$QID" AQ_CAPTCHA_PROBE_WAIT=1200 \
	npm run dev > .tmp/e2e-step1.log 2>&1 &
PID1=$!
for i in $(seq 1 30); do
	sleep 1
	if grep -q 'AQ_CAPTCHA_QS' .tmp/e2e-step1.log 2>/dev/null; then break; fi
done
kill_electron
QS=$(grep -o 'AQ_CAPTCHA_QS .*' .tmp/e2e-step1.log | head -1 | sed 's/^AQ_CAPTCHA_QS //')
if [ -z "$QS" ]; then echo "[e2e] LỖI: không lấy được phiên captcha"; exit 1; fi
SID=$(grep -o '"captcha_session_id":"[^"]*"' .tmp/e2e-step1.log | head -1 | sed 's/.*:"//;s/"//')
echo "[e2e]     sitekey/rqdata OK · sessionId=$SID"

echo "[e2e] (2/3) Dựng hCaptcha (mode=$MODE) + gửi Discord (variant=$VARIANT, headers=$HEADERS)…"
sleep 1
env -u ELECTRON_RUN_AS_NODE \
	AQ_PROBE="$QS&questId=$QID&variant=$VARIANT&mode=$MODE&headers=$HEADERS&sessionId=$SID" \
	AQ_PROBE_DUMP=17000 \
	npm run dev > .tmp/e2e-step2.log 2>&1 &
PID2=$!
sleep 25
kill_electron

echo "[e2e] (3/3) KẾT QUẢ:"
grep -o 'AQ_SUBMIT\[[^]]*\].*' .tmp/e2e-step2.log | head -3 || echo "(không thấy AQ_SUBMIT)"
grep -o '"ok":\(true\|false\),"status":[0-9]*' .tmp/e2e-step2.log | head -3
