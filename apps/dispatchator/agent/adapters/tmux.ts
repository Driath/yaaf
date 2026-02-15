import { spawn, spawnSync } from "node:child_process";
import { getConfig } from "../../config";
import type { Model, SpawnOptions } from "../types";

const AGENTS_SESSION = "yaaf-agents";
const SHELL_NAMES = new Set(["bash", "zsh", "agents"]);

interface WindowEntry {
	index: number;
	name: string;
	agentId: string | null;
	paneTitle: string;
}

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

function parseAgentId(windowName: string): string | null {
	if (SHELL_NAMES.has(windowName)) return null;
	const colonIdx = windowName.indexOf(":");
	return colonIdx === -1 ? windowName : windowName.slice(0, colonIdx);
}

function listWindowEntries(): WindowEntry[] {
	const result = spawnSync("tmux", [
		"list-windows",
		"-t",
		AGENTS_SESSION,
		"-F",
		"#{window_index}\t#{window_name}\t#{pane_title}",
	]);
	if (result.status !== 0) return [];
	return result.stdout
		.toString()
		.trim()
		.split("\n")
		.filter(Boolean)
		.map((line) => {
			const [idx, name, paneTitle] = line.split("\t");
			return {
				index: Number(idx),
				name,
				agentId: parseAgentId(name),
				paneTitle: paneTitle || "",
			};
		});
}

export function getAllWindows(): string[] {
	return listWindowEntries().map((w) => w.name);
}

export function getRunningAgents(): string[] {
	return listWindowEntries()
		.filter((w) => w.agentId !== null)
		.map((w) => w.agentId as string);
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

	const existing = listWindowEntries().find((w) => w.agentId === ticketId);
	if (existing) {
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

export function setAgentWindowTitle(ticketId: string, title: string): void {
	const win = listWindowEntries().find((w) => w.agentId === ticketId);
	if (!win) return;
	spawnSync("tmux", [
		"rename-window",
		"-t",
		`${AGENTS_SESSION}:${win.index}`,
		`${ticketId}: ${title}`,
	]);
}

export function focusAgent(ticketId: string): void {
	const win = listWindowEntries().find((w) => w.agentId === ticketId);
	if (!win) return;
	spawnSync("tmux", ["select-window", "-t", `${AGENTS_SESSION}:${win.index}`]);
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
	return parseAgentId(name);
}

export function killAgent(ticketId: string): boolean {
	const win = listWindowEntries().find((w) => w.agentId === ticketId);
	if (!win) return false;
	const result = spawnSync("tmux", [
		"kill-window",
		"-t",
		`${AGENTS_SESSION}:${win.index}`,
	]);
	return result.status === 0;
}

export function getWindowTitles(): Map<string, string> {
	const titles = new Map<string, string>();
	for (const win of listWindowEntries()) {
		if (win.agentId && win.paneTitle) {
			titles.set(win.agentId, win.paneTitle);
		}
	}
	return titles;
}
