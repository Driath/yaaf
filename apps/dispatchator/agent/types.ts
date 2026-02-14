export type AgentStatus = "queued" | "working" | "waiting" | "idle";

export type Model = "small" | "medium" | "strong";
export type AgentMode = "default" | "plan";

export interface Agent {
	id: string;
	summary: string;
	title: string;
	status: AgentStatus;
	model: Model;
	thinking: boolean;
	agentMode: AgentMode;
	workflow: string;
}

export type Action = "kill" | "done";
export const ACTIONS: { id: Action; icon: string }[] = [
	{ id: "kill", icon: "✘" },
	{ id: "done", icon: "✔" },
];

export interface SpawnOptions {
	model?: Model;
	thinking?: boolean;
	agentMode?: AgentMode;
	workflow?: string;
}
