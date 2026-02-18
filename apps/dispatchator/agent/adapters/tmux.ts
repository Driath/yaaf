import { spawn, spawnSync } from "node:child_process";
import { readlinkSync } from "node:fs";
import { join } from "node:path";
import { getConfig } from "../../config";
import { getProvider } from "../providers";
import type { SpawnOptions } from "../types";
import { clearAgentState } from "./state-watcher";

function resolveProjectDir(cwd: string, project?: string): string | undefined {
	if (!project) return undefined;
	try {
		return readlinkSync(join(cwd, "projects", project));
	} catch {
		return undefined;
	}
}

const AGENTS_SESSION = "yaaf-agents";
const AGENT_TAG = "@agent-id";

export interface WindowEntry {
	index: number;
	name: string;
	agentId: string | null;
	paneTitle: string;
}

function hasAgentsSession(): boolean {
	const result = spawnSync("tmux", ["has-session", "-t", AGENTS_SESSION], {
		stdio: "ignore",
	});
	return result.status === 0;
}

function readWindowTag(sessionWindow: string): string | null {
	const result = spawnSync("tmux", [
		"show-option",
		"-wqv",
		"-t",
		sessionWindow,
		AGENT_TAG,
	]);
	if (result.status !== 0) return null;
	const val = result.stdout.toString().trim();
	return val || null;
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
			const index = Number(idx);
			const agentId = readWindowTag(`${AGENTS_SESSION}:${index}`);
			return { index, name, agentId, paneTitle: paneTitle || "" };
		});
}

export function getWindowEntries(): WindowEntry[] {
	return listWindowEntries();
}

export async function spawnAgent(
	ticketId: string,
	_summary: string,
	options: SpawnOptions = {},
): Promise<string | null> {
	const config = getConfig();
	const providerName = options.provider || config.agents.defaultProvider;
	const provider = getProvider(providerName);
	const cwd = process.cwd();
	const providerPath = provider.resolvePath(
		config.agents.providerPaths[providerName] || "auto",
	);
	const cmd = provider.buildCommand(providerPath, {
		cwd,
		ticketId,
		model: options.model || config.agents.defaultModel,
		thinking: options.thinking || false,
		agentMode: options.agentMode || "default",
		workflow: options.workflow || config.agents.defaultWorkflow,
		projectDir: resolveProjectDir(cwd, options.project),
	});
	console.log(`[spawn] ${ticketId}: provider=${providerName}, cmd=${cmd}`);

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
				tagWindow(ticketId);
				resolve(ticketId);
			} else {
				reject(new Error(`tmux new-window exited with code ${code}`));
			}
		});
		proc.on("error", reject);
	});
}

function tagWindow(ticketId: string): void {
	const win = listWindowEntries().find((w) => w.name === ticketId);
	if (!win) return;
	spawnSync("tmux", [
		"set-option",
		"-w",
		"-t",
		`${AGENTS_SESSION}:${win.index}`,
		AGENT_TAG,
		ticketId,
	]);
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
		"#{window_index}",
	]);
	if (result.status !== 0) return null;
	const index = Number(result.stdout.toString().trim());
	return readWindowTag(`${AGENTS_SESSION}:${index}`);
}

export function killAgent(ticketId: string): boolean {
	const win = listWindowEntries().find((w) => w.agentId === ticketId);
	if (!win) return false;
	clearAgentState(ticketId);
	return killWindow(win.index);
}

export function killWindow(windowIndex: number): boolean {
	const target = `${AGENTS_SESSION}:${windowIndex}`;
	const result = spawnSync("tmux", ["kill-window", "-t", target], {
		env: { ...process.env, TMUX: "" },
	});
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
