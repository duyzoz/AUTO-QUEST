export type QuestEventType =
	| 'status'
	| 'login'
	| 'quests'
	| 'quest:start'
	| 'quest:progress'
	| 'quest:done'
	| 'quest:skip'
	| 'quest:error'
	| 'orb:summary'
	| 'cycle:wait'
	| 'finish'
	| 'fatal';

const MARKER = '\u0001AQEVENT\u0001';

export function report(
	type: QuestEventType,
	data: Record<string, unknown> = {},
): void {
	try {
		process.stdout.write(MARKER + JSON.stringify({ type, data }) + '\n');
	} catch {
		/* ignore */
	}
}

export function isEventLine(line: string): boolean {
	return line.startsWith(MARKER);
}

export function parseEventLine(line: string): {
	type: QuestEventType;
	data: Record<string, unknown>;
} | null {
	try {
		return JSON.parse(line.slice(MARKER.length));
	} catch {
		return null;
	}
}
