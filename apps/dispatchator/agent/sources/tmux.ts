import { interval, map, pairwise, share, startWith } from "rxjs";
import { useStore } from "../../store";
import {
	getActiveAgent,
	getWindowEntries,
	getWindowTitles,
	type WindowEntry,
} from "../adapters/tmux";

export interface TmuxSnapshot {
	activeAgentId: string | null;
	entries: WindowEntry[];
	titles: Map<string, string>;
	storeAgentIds: Set<string>;
}

export const agentIds = (snap: TmuxSnapshot) =>
	new Set(
		snap.entries.filter((e) => e.agentId).map((e) => e.agentId as string),
	);

const snapshot$ = interval(2000).pipe(
	startWith(0),
	map(
		(): TmuxSnapshot => ({
			activeAgentId: getActiveAgent(),
			entries: getWindowEntries(),
			titles: getWindowTitles(),
			storeAgentIds: new Set(
				useStore.getState().agents.map((a) => a.workItemId),
			),
		}),
	),
);

const empty: TmuxSnapshot = {
	activeAgentId: null,
	entries: [],
	titles: new Map(),
	storeAgentIds: new Set(),
};

export type TmuxPair = [TmuxSnapshot, TmuxSnapshot];

export const tmux$ = snapshot$.pipe(startWith(empty), pairwise(), share());
