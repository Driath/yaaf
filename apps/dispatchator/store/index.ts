import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { type AgentsSlice, createAgentsSlice } from "../agent/agents-slice";
import {
	createWorkItemsSlice,
	type WorkItemsSlice,
} from "../work-item/work-items-slice";
import { createUiSlice, type UiSlice } from "./ui-slice";

export type Store = WorkItemsSlice & AgentsSlice & UiSlice;

export const useStore = create<Store>()(
	subscribeWithSelector((...a) => ({
		...createWorkItemsSlice(...a),
		...createAgentsSlice(...a),
		...createUiSlice(...a),
	})),
);
