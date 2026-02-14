import type { StateCreator } from "zustand";
import { getConfig } from "../config";
import { useLogStore } from "../log/store";
import type { WorkItem } from "../work-item/types";
// import {
// 	focusAgent as focusAgentPane,
// 	getActiveAgent,
// 	getRunningAgents,
// 	killAgent as killAgentPane,
// } from "./adapters/tmux";
import type { Agent } from "./types";

function log(source: string, action: string, detail?: string) {
	useLogStore.getState().log({ type: "event", source, action, detail });
}

export interface AgentsSlice {
	maxAgents: number;
	agents: Agent[];
	activeAgentId: string | null;

	addAgent: (item: WorkItem) => void;
	updateAgent: (id: string, status: string) => void;
	updateAgentTitle: (id: string, title: string) => void;
	setActiveAgent: (id: string | null) => void;
	focusAgent: (id: string) => void;
	removeAgent: (id: string) => void;
}

export const createAgentsSlice: StateCreator<
	AgentsSlice & import("../store/ui-slice").UiSlice,
	[["zustand/subscribeWithSelector", never]],
	[],
	AgentsSlice
> = (set, get) => ({
	maxAgents: getConfig().agents.maxConcurrent,
	agents: [],
	activeAgentId: null,

	addAgent: (item) => {
		if (get().agents.some((a) => a.id === item.id)) return;

		const status = "queued";

		const agent: Agent = {
			id: item.id,
			summary: item.summary,
			title: "",
			status,
			model: item.model,
			thinking: item.thinking,
			agentMode: item.agentMode,
			workflow: item.workflow,
		};
		set((s) => ({ agents: [...s.agents, agent] }));
		log("Agent", "add", `${item.id} → ${status}`);
	},

	updateAgent: (id, status) => {
		set((s) => ({
			agents: s.agents.map((a) => (a.id === id ? { ...a, status } : a)),
		}));
		log("Agent", "status", `${id} → ${status}`);
	},

	updateAgentTitle: (id, title) => {
		set((s) => ({
			agents: s.agents.map((a) => (a.id === id ? { ...a, title } : a)),
		}));
	},

	setActiveAgent: (id) => {
		set({ activeAgentId: id });
	},

	focusAgent: (id) => {
		const agent = get().agents.find((a) => a.id === id);
		if (agent && (agent.status === "working" || agent.status === "waiting")) {
			// focusAgentPane(id);
			set({ activeAgentId: id });
		}
	},

	removeAgent: (id) => {
		const agent = get().agents.find((a) => a.id === id);
		if (!agent) return;

		// if (agent.status === "working" || agent.status === "waiting") {
		// 	killAgentPane(id);
		// }

		set((s) => ({
			agents: s.agents.filter((a) => a.id !== id),
			selectedIndex: Math.min(
				s.selectedIndex,
				Math.max(0, s.agents.length - 2),
			),
		}));
		log("Agent", "remove", id);
	},
});
