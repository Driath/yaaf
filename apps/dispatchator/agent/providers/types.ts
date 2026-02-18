import type { AgentMode, Model } from "../types";

export type Provider = "claude" | "gemini";

export interface BuildCommandInput {
	cwd: string;
	ticketId: string;
	model: Model;
	thinking: boolean;
	agentMode: AgentMode;
	workflow: string;
	projectDir?: string;
}

export interface AgentProvider {
	name: Provider;
	modelMap: Record<Model, string>;
	resolvePath(configured: "auto" | string): string;
	buildCommand(path: string, input: BuildCommandInput): string;
}
