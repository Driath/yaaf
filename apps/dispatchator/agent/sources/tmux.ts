import { from, interval, map, mergeMap, pairwise, startWith } from "rxjs";
import { useStore } from "../../store";
import {
	getActiveAgent,
	getWindowEntries,
	getWindowTitles,
	type WindowEntry,
} from "../adapters/tmux";

interface TmuxSnapshot {
	activeAgentId: string | null;
	entries: WindowEntry[];
	titles: Map<string, string>;
}

export type TmuxEvent =
	| { type: "activeChanged"; agentId: string | null }
	| { type: "windowAdded"; agentId: string }
	| { type: "windowRemoved"; agentId: string }
	| { type: "titleChanged"; agentId: string; title: string }
	| { type: "orphanWindow"; windowIndex: number }
	| { type: "staleAgent"; agentId: string };

const snapshot$ = interval(2000).pipe(
	startWith(0),
	map(
		(): TmuxSnapshot => ({
			activeAgentId: getActiveAgent(),
			entries: getWindowEntries(),
			titles: getWindowTitles(),
		}),
	),
);

export const tmux$ = snapshot$.pipe(
	startWith({
		activeAgentId: null,
		entries: [],
		titles: new Map(),
	} as TmuxSnapshot),
	pairwise(),
	mergeMap(([prev, curr]) => {
		const events: TmuxEvent[] = [];

		if (prev.activeAgentId !== curr.activeAgentId) {
			events.push({ type: "activeChanged", agentId: curr.activeAgentId });
		}

		const prevAgentIds = new Set(
			prev.entries.filter((e) => e.agentId).map((e) => e.agentId as string),
		);
		const currAgentIds = new Set(
			curr.entries.filter((e) => e.agentId).map((e) => e.agentId as string),
		);

		for (const id of currAgentIds) {
			if (!prevAgentIds.has(id)) {
				events.push({ type: "windowAdded", agentId: id });
			}
		}

		for (const id of prevAgentIds) {
			if (!currAgentIds.has(id)) {
				events.push({ type: "windowRemoved", agentId: id });
			}
		}

		for (const [id, title] of curr.titles) {
			if (prev.titles.get(id) !== title) {
				events.push({ type: "titleChanged", agentId: id, title });
			}
		}

		if (curr.entries.length > 1) {
			for (const entry of curr.entries) {
				if (!entry.agentId) {
					events.push({ type: "orphanWindow", windowIndex: entry.index });
				}
			}
		}

		const storeAgents = useStore.getState().agents;
		for (const agent of storeAgents) {
			if (
				!currAgentIds.has(agent.workItemId) &&
				!prevAgentIds.has(agent.workItemId)
			) {
				events.push({ type: "staleAgent", agentId: agent.workItemId });
			}
		}

		return from(events);
	}),
);
