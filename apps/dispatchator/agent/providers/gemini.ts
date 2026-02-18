import { spawnSync } from "node:child_process";
import type { AgentProvider, BuildCommandInput } from "./types";

export const geminiProvider: AgentProvider = {
	name: "gemini",
	modelMap: {
		small: "gemini-2.5-flash",
		medium: "gemini-2.5-pro",
		strong: "gemini-2.5-pro",
	},
	resolvePath(configured) {
		if (configured !== "auto") return configured;
		const result = spawnSync("which", ["gemini"]);
		if (result.status === 0) return result.stdout.toString().trim();
		throw new Error(
			"Could not find gemini CLI. Set agents.providerPaths.gemini in dispatchator.config.ts",
		);
	},
	buildCommand(path, input) {
		const model = this.modelMap[input.model];
		const prompt = `Read and execute .gemini/skills/workflow:${input.workflow}/SKILL.md for work item ${input.ticketId}`;
		const approvalFlag = "--approval-mode yolo ";
		const includeDirs = input.projectDir
			? `--include-directories ${input.projectDir} `
			: "";
		return `cd ${input.cwd} && YAAF_AGENT_ID=${input.ticketId} exec ${path} --model ${model} ${approvalFlag}${includeDirs}-i "${prompt}"`;
	},
};
