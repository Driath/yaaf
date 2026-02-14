import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { type AgentsSlice, createAgentsSlice } from "../agent/agents-slice";
import { createUiSlice, type UiSlice } from "./ui-slice";

export type Store = AgentsSlice & UiSlice;

export const useStore = create<Store>()(
	subscribeWithSelector((...a) => ({
		...createAgentsSlice(...a),
		...createUiSlice(...a),
	})),
);
