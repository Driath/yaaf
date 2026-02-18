import { spawnSync } from "node:child_process";
import type { AgentProvider, BuildCommandInput } from "./types";

export const claudeProvider: AgentProvider = {
	name: "claude",
	modelMap: {
		small: "haiku",
		medium: "sonnet",
		strong: "opus",
	},
	resolvePath(configured) {
		if (configured !== "auto") return configured;
		const result = spawnSync("which", ["claude"]);
		if (result.status === 0) return result.stdout.toString().trim();
		throw new Error(
			"Could not find claude CLI. Set agents.providerPaths.claude in dispatchator.config.ts",
		);
	},
	buildCommand(path, input) {
		const model = this.modelMap[input.model];
		const prompt = `/workflow:${input.workflow} ${input.ticketId}`;
		const thinkingFlag = input.thinking
			? "--settings '{\"alwaysThinkingEnabled\":true}' "
			: "";
		const modeFlag =
			input.agentMode !== "default"
				? `--permission-mode ${input.agentMode} `
				: "";
		const addDirsFlag = input.projectDir
			? `--add-dir ${input.projectDir} `
			: "";
		return `cd ${input.cwd} && YAAF_AGENT_ID=${input.ticketId} exec ${path} --model ${model} ${thinkingFlag}${modeFlag}${addDirsFlag}-- "${prompt}"`;
	},
};
