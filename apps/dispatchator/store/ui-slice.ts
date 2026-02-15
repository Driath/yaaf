import type { StateCreator } from "zustand";
import { killAgent } from "../agent/adapters/tmux";
import type { AgentsSlice } from "../agent/agents-slice";
import { AGENT_ACTIONS } from "../agent/types";
import type { WorkItemsSlice } from "../work-item/work-items-slice";

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
	getActions: () => typeof AGENT_ACTIONS;
}

export const createUiSlice: StateCreator<
	WorkItemsSlice & AgentsSlice & UiSlice,
	[["zustand/subscribeWithSelector", never]],
	[],
	UiSlice
> = (set, get) => ({
	selectedIndex: 0,
	showActions: false,
	actionIndex: 0,

	selectNext: () => {
		const { workItems, selectedIndex } = get();
		if (workItems.length === 0) return;
		set({ selectedIndex: (selectedIndex + 1) % workItems.length });
	},

	selectPrev: () => {
		const { workItems, selectedIndex } = get();
		if (workItems.length === 0) return;
		set({
			selectedIndex: (selectedIndex - 1 + workItems.length) % workItems.length,
		});
	},

	focusSelected: () => {
		const { workItems, selectedIndex, focusWorkItem } = get();
		const item = workItems[selectedIndex];
		if (item) focusWorkItem(item.id);
	},

	toggleActions: () => {
		const { workItems, selectedIndex, agents, showActions } = get();
		if (showActions) {
			set({ showActions: false, actionIndex: 0 });
			return;
		}
		const item = workItems[selectedIndex];
		if (!item) return;
		const hasAgent = agents.some((a) => a.workItemId === item.id);
		if (hasAgent) set({ showActions: true, actionIndex: 0 });
	},

	nextAction: () => {
		set((s) => ({ actionIndex: (s.actionIndex + 1) % AGENT_ACTIONS.length }));
	},

	prevAction: () => {
		set((s) => ({
			actionIndex:
				(s.actionIndex - 1 + AGENT_ACTIONS.length) % AGENT_ACTIONS.length,
		}));
	},

	getActions: () => AGENT_ACTIONS,

	executeAction: () => {
		const { workItems, selectedIndex, actionIndex } = get();
		const item = workItems[selectedIndex];
		if (!item) return;

		const action = AGENT_ACTIONS[actionIndex].id;

		if (action === "kill") {
			killAgent(item.id);
			set({ showActions: false });
		}
	},
});
