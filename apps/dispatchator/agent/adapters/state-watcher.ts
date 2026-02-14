import { readdirSync, readFileSync, unlinkSync, watch } from "node:fs";

const AGENTS_STATE_DIR = `${process.cwd()}/ia/state/agents`;

function readFile(filepath: string): string | null {
	try {
		return readFileSync(filepath, "utf-8").trim();
	} catch {
		return null;
	}
}

function readAndDelete(filepath: string): string | null {
	const content = readFile(filepath);
	try {
		unlinkSync(filepath);
	} catch {
		/* ignore */
	}
	return content;
}

export interface AgentSnapshot {
	status?: string;
	title?: string;
}

export function readInitialSnapshots(): Map<string, AgentSnapshot> {
	const snapshots = new Map<string, AgentSnapshot>();
	try {
		for (const file of readdirSync(AGENTS_STATE_DIR)) {
			if (file.endsWith(".state")) {
				const agentId = file.replace(".state", "");
				const status = readFile(`${AGENTS_STATE_DIR}/${file}`);
				if (status) {
					const snap = snapshots.get(agentId) ?? {};
					snap.status = status;
					snapshots.set(agentId, snap);
				}
			} else if (file.endsWith(".title")) {
				const agentId = file.replace(".title", "");
				const title = readFile(`${AGENTS_STATE_DIR}/${file}`);
				if (title) {
					const snap = snapshots.get(agentId) ?? {};
					snap.title = title;
					snapshots.set(agentId, snap);
				}
			}
		}
	} catch {
		/* ignore */
	}
	return snapshots;
}

export function watchAgentState(
	onStatus: (agentId: string, status: string) => void,
	onKill: (agentId: string) => void,
	onTitle: (agentId: string, title: string) => void,
) {
	const watcher = watch(AGENTS_STATE_DIR, (_event, filename) => {
		if (!filename) return;

		if (filename.endsWith(".state")) {
			const agentId = filename.replace(".state", "");
			const status = readFile(`${AGENTS_STATE_DIR}/${filename}`);
			if (status) {
				onStatus(agentId, status);
			}
		} else if (filename.endsWith(".title")) {
			const agentId = filename.replace(".title", "");
			const title = readFile(`${AGENTS_STATE_DIR}/${filename}`);
			if (title) {
				onTitle(agentId, title);
			}
		} else if (filename.endsWith(".kill-agent")) {
			const agentId = filename.replace(".kill-agent", "");
			readAndDelete(`${AGENTS_STATE_DIR}/${filename}`);
			onKill(agentId);
		}
	});

	process.on("exit", () => watcher.close());
	process.on("SIGINT", () => {
		watcher.close();
		process.exit();
	});
	process.on("SIGTERM", () => {
		watcher.close();
		process.exit();
	});
}
