import { from, interval, map, mergeMap, pairwise, startWith } from "rxjs";
import { useStore } from "../../store";
import {
	getActiveAgent,
	getAllWindows,
	getRunningAgents,
	getWindowTitles,
} from "../adapters/tmux";

interface TmuxSnapshot {
	activeAgentId: string | null;
	runningIds: string[];
	allWindowNames: string[];
	titles: Map<string, string>;
}

export type TmuxEvent =
	| { type: "activeChanged"; agentId: string | null }
	| { type: "windowAdded"; agentId: string }
	| { type: "windowRemoved"; agentId: string }
	| { type: "titleChanged"; agentId: string; title: string }
	| { type: "orphanWindow"; windowName: string }
	| { type: "staleAgent"; agentId: string };

const snapshot$ = interval(2000).pipe(
	startWith(0),
	map(
		(): TmuxSnapshot => ({
			activeAgentId: getActiveAgent(),
			runningIds: getRunningAgents(),
			allWindowNames: getAllWindows(),
			titles: getWindowTitles(),
		}),
	),
);

export const tmux$ = snapshot$.pipe(
	startWith({
		activeAgentId: null,
		runningIds: [],
		allWindowNames: [],
		titles: new Map(),
	} as TmuxSnapshot),
	pairwise(),
	mergeMap(([prev, curr]) => {
		const events: TmuxEvent[] = [];

		if (prev.activeAgentId !== curr.activeAgentId) {
			events.push({ type: "activeChanged", agentId: curr.activeAgentId });
		}

		const prevRunning = new Set(prev.runningIds);
		const currRunning = new Set(curr.runningIds);

		for (const id of currRunning) {
			if (!prevRunning.has(id)) {
				events.push({ type: "windowAdded", agentId: id });
			}
		}

		for (const id of prevRunning) {
			if (!currRunning.has(id)) {
				events.push({ type: "windowRemoved", agentId: id });
			}
		}

		for (const [id, title] of curr.titles) {
			if (prev.titles.get(id) !== title) {
				events.push({ type: "titleChanged", agentId: id, title });
			}
		}

		if (curr.allWindowNames.length > 1) {
			const orphans = curr.allWindowNames.filter((w) => !currRunning.has(w));
			for (const w of orphans) {
				events.push({ type: "orphanWindow", windowName: w });
			}
		}

		const storeAgents = useStore.getState().agents;
		for (const agent of storeAgents) {
			if (
				!currRunning.has(agent.workItemId) &&
				!prevRunning.has(agent.workItemId)
			) {
				events.push({ type: "staleAgent", agentId: agent.workItemId });
			}
		}

		return from(events);
	}),
);
