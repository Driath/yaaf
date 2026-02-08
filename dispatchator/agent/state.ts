import { readdirSync, unlinkSync, watch } from "node:fs";

const AGENTS_STATE_DIR = `${process.cwd()}/ia/state/agents`;

export function getWaitingAgents(): Set<string> {
	try {
		const files = readdirSync(AGENTS_STATE_DIR);
		return new Set(
			files
				.filter((f) => f.endsWith(".waiting"))
				.map((f) => f.replace(".waiting", "")),
		);
	} catch {
		return new Set();
	}
}

export function clearDoneFile(agentId: string): void {
	try {
		unlinkSync(`${AGENTS_STATE_DIR}/${agentId}.done`);
	} catch {
		/* ignore */
	}
}

export function clearKillFile(filename: string): void {
	try {
		unlinkSync(`${AGENTS_STATE_DIR}/${filename}`);
	} catch {
		/* ignore */
	}
}

export function watchAgentState(
	onWaiting: () => void,
	onDone: (agentId: string) => void,
	onKill: (agentId: string) => void,
) {
	const watcher = watch(AGENTS_STATE_DIR, (_event, filename) => {
		if (filename?.endsWith(".waiting")) {
			onWaiting();
		} else if (filename?.endsWith(".done")) {
			const agentId = filename.replace(".done", "");
			clearDoneFile(agentId);
			onDone(agentId);
		} else if (filename?.endsWith(".kill-agent")) {
			const agentId = filename.replace(".kill-agent", "");
			clearKillFile(filename);
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
