import type { StateCreator } from "zustand";
import { killAgent as killAgentPane } from "../agent/adapters/tmux";
import type { AgentsSlice } from "../agent/agents-slice";
import { ACTIONS, type AgentStatus } from "../agent/types";

const MAX_LOGS = 100;

export interface UiSlice {
	selectedIndex: number;
	showActions: boolean;
	actionIndex: number;

	selectNext: () => void;
	selectPrev: () => void;
	focusSelected: () => void;
	toggleActions: () => void;
	nextAction: () => void;
	prevAction: () => void;
	executeAction: () => void;
	getActions: () => typeof ACTIONS;
}

export const createUiSlice: StateCreator<
	AgentsSlice & UiSlice,
	[["zustand/subscribeWithSelector", never]],
	[],
	UiSlice
> = (set, get) => ({
	selectedIndex: 0,
	showActions: false,
	actionIndex: 0,

	selectNext: () => {
		const { agents, selectedIndex } = get();
		if (agents.length === 0) return;
		set({ selectedIndex: (selectedIndex + 1) % agents.length });
	},

	selectPrev: () => {
		const { agents, selectedIndex } = get();
		if (agents.length === 0) return;
		set({
			selectedIndex: (selectedIndex - 1 + agents.length) % agents.length,
		});
	},

	focusSelected: () => {
		const { agents, selectedIndex, focusAgent } = get();
		const agent = agents[selectedIndex];
		if (agent && (agent.status === "working" || agent.status === "waiting")) {
			focusAgent(agent.id);
		}
	},

	toggleActions: () => {
		set((s) => ({ showActions: !s.showActions, actionIndex: 0 }));
	},

	nextAction: () => {
		set((s) => ({ actionIndex: (s.actionIndex + 1) % ACTIONS.length }));
	},

	prevAction: () => {
		set((s) => ({
			actionIndex: (s.actionIndex - 1 + ACTIONS.length) % ACTIONS.length,
		}));
	},

	getActions: () => ACTIONS,

	executeAction: () => {
		const { agents, selectedIndex, actionIndex } = get();
		const agent = agents[selectedIndex];
		if (!agent) return;

		const action = ACTIONS[actionIndex].id;

		if (
			action === "kill" &&
			(agent.status === "working" || agent.status === "waiting")
		) {
			killAgentPane(agent.id);
			set((s) => ({
				agents: s.agents.map((a) =>
					a.id === agent.id ? { ...a, status: "queued" as AgentStatus } : a,
				),
				logs: [...s.logs, `💀 ${agent.id}: killed, will restart`].slice(
					-MAX_LOGS,
				),
				showActions: false,
			}));
		} else if (action === "done") {
			if (agent.status === "working" || agent.status === "waiting") {
				killAgentPane(agent.id);
			}
			set((s) => ({
				agents: s.agents.filter((a) => a.id !== agent.id),
				logs: [...s.logs, `✅ ${agent.id}: done`].slice(-MAX_LOGS),
				showActions: false,
				selectedIndex: Math.min(s.selectedIndex, s.agents.length - 2),
			}));
		}
	},
});
