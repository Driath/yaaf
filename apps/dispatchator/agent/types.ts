export type Model = "small" | "medium" | "strong";
export type AgentMode = "default" | "plan";

export interface AgentProcess {
	workItemId: string;
	hookStatus: string;
	title: string;
}

export type AgentAction = "kill";
export const AGENT_ACTIONS: { id: AgentAction; icon: string }[] = [
	{ id: "kill", icon: "A:✘" },
];

export interface SpawnOptions {
	model?: Model;
	thinking?: boolean;
	agentMode?: AgentMode;
	workflow?: string;
	project?: string;
}
