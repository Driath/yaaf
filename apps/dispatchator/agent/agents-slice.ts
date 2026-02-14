import type { StateCreator } from "zustand";
import { getConfig } from "../config";
import { useLogStore } from "../log/store";
import type { UiSlice } from "../store/ui-slice";
import type { WorkItemsSlice } from "../work-item/work-items-slice";
import type { AgentProcess } from "./types";

function log(source: string, action: string, detail?: string) {
	useLogStore.getState().log({ type: "event", source, action, detail });
}

export interface AgentsSlice {
	maxAgents: number;
	agents: AgentProcess[];

	attachAgent: (workItemId: string) => void;
	updateHookStatus: (workItemId: string, hookStatus: string) => void;
	updateAgentTitle: (workItemId: string, title: string) => void;
	detachAgent: (workItemId: string) => void;
}

export const createAgentsSlice: StateCreator<
	WorkItemsSlice & AgentsSlice & UiSlice,
	[["zustand/subscribeWithSelector", never]],
	[],
	AgentsSlice
> = (set, get) => ({
	maxAgents: getConfig().agents.maxConcurrent,
	agents: [],

	attachAgent: (workItemId) => {
		if (get().agents.some((a) => a.workItemId === workItemId)) return;
		const agent: AgentProcess = { workItemId, hookStatus: "?", title: "" };
		set((s) => ({ agents: [...s.agents, agent] }));
		log("Agent", "attach", workItemId);
	},

	updateHookStatus: (workItemId, hookStatus) => {
		set((s) => ({
			agents: s.agents.map((a) =>
				a.workItemId === workItemId ? { ...a, hookStatus } : a,
			),
		}));
		log("Agent", "hookStatus", `${workItemId} → ${hookStatus}`);
	},

	updateAgentTitle: (workItemId, title) => {
		set((s) => ({
			agents: s.agents.map((a) =>
				a.workItemId === workItemId ? { ...a, title } : a,
			),
		}));
	},

	detachAgent: (workItemId) => {
		if (!get().agents.some((a) => a.workItemId === workItemId)) return;
		set((s) => ({
			agents: s.agents.filter((a) => a.workItemId !== workItemId),
		}));
		log("Agent", "detach", workItemId);
	},
});
