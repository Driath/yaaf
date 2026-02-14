import { readFileSync, unlinkSync, watch } from "node:fs";

const AGENTS_STATE_DIR = `${process.cwd()}/ia/state/agents`;

export function clearStateFile(agentId: string): void {
	try {
		unlinkSync(`${AGENTS_STATE_DIR}/${agentId}.state`);
	} catch {
		/* ignore */
	}
}

function readAndDelete(filepath: string): string | null {
	try {
		const content = readFileSync(filepath, "utf-8").trim();
		unlinkSync(filepath);
		return content;
	} catch {
		return null;
	}
}

export function watchAgentState(
	onStatus: (agentId: string, status: string) => void,
	onKill: (agentId: string) => void,
) {
	const watcher = watch(AGENTS_STATE_DIR, (_event, filename) => {
		if (!filename) return;

		if (filename.endsWith(".state")) {
			const agentId = filename.replace(".state", "");
			const status = readAndDelete(`${AGENTS_STATE_DIR}/${filename}`);
			if (status) {
				onStatus(agentId, status);
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
