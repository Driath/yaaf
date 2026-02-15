import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { type MonoTypeOperatorFunction, tap } from "rxjs";

const LOG_PATH = resolve(process.cwd(), "ia/events.log");

function write(line: string) {
	appendFileSync(LOG_PATH, line);
}

export function logEvent<T>(label: string): MonoTypeOperatorFunction<T> {
	return tap((value) => {
		const ts = new Date().toISOString();
		const payload = typeof value === "string" ? value : JSON.stringify(value);
		write(`[${ts}] ${label}: ${payload}\n`);
	});
}

export function logLifecycle(event: "start" | "stop") {
	const ts = new Date().toISOString();
	const separator = event === "start" ? "\n" + "─".repeat(60) + "\n" : "";
	write(`${separator}[${ts}] app:${event}\n`);
}
