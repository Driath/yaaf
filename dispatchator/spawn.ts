// Spawn agents in a dedicated tmux session (yaaf-agents)
// The orchestrator runs in a separate Warp window without tmux

import { spawn, spawnSync } from "node:child_process";
import { getConfig, resolveClaudePath } from "./config";

const AGENTS_SESSION = "yaaf-agents";

// Check if agents session exists
function hasAgentsSession(): boolean {
	const result = spawnSync("tmux", ["has-session", "-t", AGENTS_SESSION], {
		stdio: "ignore",
	});
	return result.status === 0;
}

// Check if an agent window already exists
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

// Get all running agent windows
export function getRunningAgents(): string[] {
	const result = spawnSync("tmux", [
		"list-windows",
		"-t",
		AGENTS_SESSION,
		"-F",
		"#{window_name}",
	]);
	if (result.status !== 0) return [];
	return result.stdout
		.toString()
		.trim()
		.split("\n")
		.filter((w) => w && w !== "bash");
}

export type AgentMode = "default" | "plan";

export type Model = "small" | "medium" | "strong";

// Map functional model names to provider-specific names
const MODEL_MAP: Record<Model, string> = {
	small: "haiku",
	medium: "sonnet",
	strong: "opus",
};

export interface SpawnOptions {
	model?: Model;
	thinking?: boolean;
	agentMode?: AgentMode;
	workflow?: string;
}

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
	const cmd = `cd ${cwd} && exec ${claudePath} --model ${model} ${thinkingFlag}${modeFlag}"${prompt}"`;
	console.log(
		`[spawn] ${ticketId}: workflow=${workflow}, thinking=${thinking}, cmd=${cmd}`,
	);

	// Wait for agents session (user needs to run bun start:agents)
	if (!hasAgentsSession()) {
		return Promise.resolve(null); // Will retry on next sync
	}

	// Skip if agent window already exists
	if (hasAgentWindow(ticketId)) {
		return Promise.resolve(ticketId);
	}

	return new Promise((resolve, reject) => {
		// Create a new window for this agent
		const proc = spawn("tmux", [
			"new-window",
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

// Switch to a specific agent window
export function focusAgent(ticketId: string): void {
	spawnSync("tmux", ["select-window", "-t", `${AGENTS_SESSION}:${ticketId}`]);
}

// Get the currently active agent window
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

// Kill an agent window
export function killAgent(ticketId: string): boolean {
	const result = spawnSync("tmux", [
		"kill-window",
		"-t",
		`${AGENTS_SESSION}:${ticketId}`,
	]);
	return result.status === 0;
}

// Get the currently focused agent window
export function getFocusedAgent(): string | null {
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

// Get window titles for all agents
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
		const [name, title] = line.split(":");
		if (name && title && name !== "zsh" && name !== "bash") {
			titles.set(name, title);
		}
	}
	return titles;
}
