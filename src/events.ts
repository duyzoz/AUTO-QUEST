export type QuestEventType =
	| 'status'
	| 'login'
	| 'quests'
	| 'quest:inventory'
	| 'quest:item'
	| 'scan:start'
	| 'quest:scan-progress'
	| 'scan:complete'
	| 'quest:start'
	| 'quest:progress'
	| 'quest:done'
	| 'quest:claim'
	| 'quest:captcha'
	| 'quest:skip'
	| 'quest:error'
	| 'quest:redeem'
	| 'orb:summary'
	| 'orbs:balance'
	| 'cycle:wait'
	| 'finish'
	| 'fatal';

const MARKER = '\u0001AQEVENT\u0001';

export function report(
	type: QuestEventType,
	data: Record<string, unknown> = {},
): void {
	try {
		// Mỗi event luôn kèm id để renderer dedupe (tránh cộng Orbs ảo khi quét lại).
		const payload = {
			id: `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
			type,
			data,
		};
		process.stdout.write(MARKER + JSON.stringify(payload) + '\n');
	} catch {
		/* ignore */
	}
}

export function isEventLine(line: string): boolean {
	return line.startsWith(MARKER);
}

export function parseEventLine(line: string): {
	id: string;
	type: QuestEventType;
	data: Record<string, unknown>;
} | null {
	try {
		return JSON.parse(line.slice(MARKER.length));
	} catch {
		return null;
	}
}
