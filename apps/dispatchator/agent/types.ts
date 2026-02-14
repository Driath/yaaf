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

export interface Store {
	maxAgents: number;
	agents: Agent[];
	logs: string[];
	selectedIndex: number;
	activeAgentId: string | null;
	showActions: boolean;
	actionIndex: number;

	addAgent: (
		id: string,
		summary: string,
		model?: Model,
		thinking?: boolean,
		agentMode?: AgentMode,
		workflow?: string,
	) => void;
	updateAgent: (id: string, status: AgentStatus) => void;
	focusAgent: (id: string) => void;
	log: (message: string) => void;
	selectNext: () => void;
	selectPrev: () => void;
	focusSelected: () => void;
	syncAgentsState: () => void;
	removeAgent: (id: string) => void;
	toggleActions: () => void;
	nextAction: () => void;
	prevAction: () => void;
	executeAction: () => void;
	getActions: () => typeof ACTIONS;
}
