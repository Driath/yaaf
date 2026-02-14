import { from, interval, map, mergeMap, pairwise, startWith } from "rxjs";
import {
	getActiveAgent,
	getRunningAgents,
	getWindowTitles,
} from "../adapters/tmux";

interface TmuxSnapshot {
	activeAgentId: string | null;
	runningIds: string[];
	titles: Map<string, string>;
}

export type TmuxEvent =
	| { type: "activeChanged"; agentId: string | null }
	| { type: "windowAdded"; agentId: string }
	| { type: "windowRemoved"; agentId: string }
	| { type: "titleChanged"; agentId: string; title: string };

const snapshot$ = interval(2000).pipe(
	startWith(0),
	map(
		(): TmuxSnapshot => ({
			activeAgentId: getActiveAgent(),
			runningIds: getRunningAgents(),
			titles: getWindowTitles(),
		}),
	),
);

export const tmux$ = snapshot$.pipe(
	startWith({
		activeAgentId: null,
		runningIds: [],
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

		return from(events);
	}),
);
