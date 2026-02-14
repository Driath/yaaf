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
	| { type: "crashed"; agentId: string }
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
		for (const id of prevRunning) {
			if (!curr.runningIds.includes(id)) {
				events.push({ type: "crashed", agentId: id });
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
