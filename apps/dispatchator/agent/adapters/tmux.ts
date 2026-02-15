import { spawn, spawnSync } from "node:child_process";
import { getConfig } from "../../config";
import type { Model, SpawnOptions } from "../types";

const AGENTS_SESSION = "yaaf-agents";

function resolveClaudePath(path: "auto" | string): string {
	if (path !== "auto") return path;
	const result = spawnSync("which", ["claude"]);
	if (result.status === 0) return result.stdout.toString().trim();
	throw new Error(
		"Could not find claude CLI. Set agents.claudePath in dispatchator.config.ts",
	);
}

function hasAgentsSession(): boolean {
	const result = spawnSync("tmux", ["has-session", "-t", AGENTS_SESSION], {
		stdio: "ignore",
	});
	return result.status === 0;
}

function hasAgentWindow(ticketId: string): boolean {
	const result = spawnSync("tmux", [
		"list-windows",
		"-t",
		AGENTS_SESSION,
		"-F",
		"#{window_name}",
	]);
	if (result.status !== 0) return false;
	const windows = result.stdout.toString().split("\n");
	return windows.includes(ticketId);
}

export function getAllWindows(): string[] {
	const result = spawnSync("tmux", [
		"list-windows",
		"-t",
		AGENTS_SESSION,
		"-F",
		"#{window_name}",
	]);
	if (result.status !== 0) return [];
	return result.stdout.toString().trim().split("\n").filter(Boolean);
}

export function getRunningAgents(): string[] {
	return getAllWindows().filter((w) => w !== "bash" && w !== "zsh");
}

const MODEL_MAP: Record<Model, string> = {
	small: "haiku",
	medium: "sonnet",
	strong: "opus",
};

export async function spawnAgent(
	ticketId: string,
	_summary: string,
	options: SpawnOptions = {},
): Promise<string | null> {
	const config = getConfig();
	const claudePath = resolveClaudePath(config.agents.claudePath);
	const cwd = process.cwd();
	const model = MODEL_MAP[options.model || config.agents.defaultModel];
	const thinking = options.thinking || false;
	const agentMode = options.agentMode || "default";
	const workflow = options.workflow || config.agents.defaultWorkflow;
	const prompt = `/workflow:${workflow} ${ticketId}`;
	const thinkingFlag = thinking
		? "--settings '{\"alwaysThinkingEnabled\":true}' "
		: "";
	const modeFlag =
		agentMode !== "default" ? `--permission-mode ${agentMode} ` : "";
	const cmd = `cd ${cwd} && YAAF_AGENT_ID=${ticketId} exec ${claudePath} --model ${model} ${thinkingFlag}${modeFlag}"${prompt}"`;
	console.log(
		`[spawn] ${ticketId}: workflow=${workflow}, thinking=${thinking}, cmd=${cmd}`,
	);

	if (!hasAgentsSession()) {
		return Promise.resolve(null);
	}

	if (hasAgentWindow(ticketId)) {
		return Promise.resolve(ticketId);
	}

	return new Promise((resolve, reject) => {
		const proc = spawn("tmux", [
			"new-window",
			"-d",
			"-t",
			AGENTS_SESSION,
			"-n",
			ticketId,
			cmd,
		]);

		proc.on("close", (code) => {
			if (code === 0) {
				resolve(ticketId);
			} else {
				reject(new Error(`tmux new-window exited with code ${code}`));
			}
		});
		proc.on("error", reject);
	});
}

export function focusAgent(ticketId: string): void {
	spawnSync("tmux", ["select-window", "-t", `${AGENTS_SESSION}:${ticketId}`]);
}

export function getActiveAgent(): string | null {
	const result = spawnSync("tmux", [
		"display-message",
		"-t",
		AGENTS_SESSION,
		"-p",
		"#{window_name}",
	]);
	if (result.status !== 0) return null;
	const name = result.stdout.toString().trim();
	return name && name !== "bash" ? name : null;
}

export function killAgent(ticketId: string): boolean {
	const result = spawnSync("tmux", [
		"kill-window",
		"-t",
		`${AGENTS_SESSION}:${ticketId}`,
	]);
	return result.status === 0;
}

export function getWindowTitles(): Map<string, string> {
	const result = spawnSync("tmux", [
		"list-windows",
		"-t",
		AGENTS_SESSION,
		"-F",
		"#{window_name}:#{pane_title}",
	]);
	if (result.status !== 0) return new Map();
	const titles = new Map<string, string>();
	for (const line of result.stdout.toString().trim().split("\n")) {
		const sep = line.indexOf(":");
		if (sep === -1) continue;
		const name = line.slice(0, sep);
		const title = line.slice(sep + 1);
		if (name && title && name !== "zsh" && name !== "bash") {
			titles.set(name, title);
		}
	}
	return titles;
}
