import type { Provider } from "../agent/providers/types";

export type Model = "small" | "medium" | "strong";
export type AgentMode = "default" | "plan";

export interface WorkItem {
	id: string;
	summary: string;
	model: Model;
	thinking: boolean;
	agentMode: AgentMode;
	workflow: string;
	provider: Provider;
	project?: string;
	status: string;
	parentId?: string;
	commentCount: number;
}
