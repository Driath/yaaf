import { create } from "zustand";
import type { LogEntry } from "./types";

const MAX_LOGS = 100;

interface LogStore {
	logs: LogEntry[];
	log: (entry: LogEntry) => void;
}

export const useLogStore = create<LogStore>((set) => ({
	logs: [],
	log: (entry) =>
		set((s) => ({
			logs: [
				...s.logs,
				{
					...entry,
					timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
				},
			].slice(-MAX_LOGS),
		})),
}));
