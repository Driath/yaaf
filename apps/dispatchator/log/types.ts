export interface LogEntry {
	type: "source" | "event";
	source: string;
	action?: string;
	detail?: string;
	timestamp?: string;
}
