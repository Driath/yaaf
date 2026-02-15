import type { StateCreator } from "zustand";
import { focusAgent } from "../agent/adapters/tmux";
import type { AgentsSlice } from "../agent/agents-slice";
import { useLogStore } from "../log/store";
import type { UiSlice } from "../store/ui-slice";
import type { WorkItem } from "./types";

function log(source: string, action: string, detail?: string) {
	useLogStore.getState().log({ type: "event", source, action, detail });
}

export interface WorkItemsSlice {
	workItems: WorkItem[];
	activeWorkItemId: string | null;

	addWorkItem: (item: WorkItem) => void;
	setActiveWorkItem: (id: string | null) => void;
	focusWorkItem: (id: string) => void;
	removeWorkItem: (id: string) => void;
}

export const createWorkItemsSlice: StateCreator<
	WorkItemsSlice & AgentsSlice & UiSlice,
	[["zustand/subscribeWithSelector", never]],
	[],
	WorkItemsSlice
> = (set, get) => ({
	workItems: [],
	activeWorkItemId: null,

	addWorkItem: (item) => {
		if (get().workItems.some((w) => w.id === item.id)) return;
		set((s) => ({ workItems: [...s.workItems, item] }));
		log("WorkItem", "add", item.id);
	},

	setActiveWorkItem: (id) => {
		set({ activeWorkItemId: id });
	},

	focusWorkItem: (id) => {
		const hasAgent = get().agents.some((a) => a.workItemId === id);
		if (hasAgent) {
			set({ activeWorkItemId: id });
			focusAgent(id);
		}
	},

	removeWorkItem: (id) => {
		const { detachAgent } = get();
		detachAgent(id);
		set((s) => ({
			workItems: s.workItems.filter((w) => w.id !== id),
			selectedIndex: Math.min(
				s.selectedIndex,
				Math.max(0, s.workItems.length - 2),
			),
		}));
		log("WorkItem", "remove", id);
	},
});
