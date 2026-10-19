"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.report = report;
exports.isEventLine = isEventLine;
exports.parseEventLine = parseEventLine;
const MARKER = '\u0001AQEVENT\u0001';
function report(type, data = {}) {
    try {
        // Mỗi event luôn kèm id để renderer dedupe (tránh cộng Orbs ảo khi quét lại).
        const payload = {
            id: `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
            type,
            data,
        };
        process.stdout.write(MARKER + JSON.stringify(payload) + '\n');
    }
    catch {
        /* ignore */
    }
}
function isEventLine(line) {
    return line.startsWith(MARKER);
}
function parseEventLine(line) {
    try {
        return JSON.parse(line.slice(MARKER.length));
    }
    catch {
        return null;
    }
}
