"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.report = report;
exports.isEventLine = isEventLine;
exports.parseEventLine = parseEventLine;
const MARKER = '\u0001AQEVENT\u0001';
function report(type, data = {}) {
    try {
        process.stdout.write(MARKER + JSON.stringify({ type, data }) + '\n');
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
