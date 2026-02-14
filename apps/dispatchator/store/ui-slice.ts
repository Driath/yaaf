import type { StateCreator } from "zustand";
import type { AgentsSlice } from "../agent/agents-slice";
import { ACTIONS } from "../agent/types";

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
		const { agents, selectedIndex, actionIndex, updateAgent, removeAgent } =
			get();
		const agent = agents[selectedIndex];
		if (!agent) return;

		const action = ACTIONS[actionIndex].id;

		if (
			action === "kill" &&
			(agent.status === "working" || agent.status === "waiting")
		) {
			updateAgent(agent.id, "queued");
			set({ showActions: false });
		} else if (action === "done") {
			removeAgent(agent.id);
			set({ showActions: false });
		}
	},
});
