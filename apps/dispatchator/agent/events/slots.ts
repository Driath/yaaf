import { interval, map, merge, Observable } from "rxjs";
import { useStore } from "../../store";
import type { WorkItem } from "../../work-item/types";

export interface SlotsPayload {
	workItem: WorkItem;
	slots: number;
}

function check(): SlotsPayload | null {
	const s = useStore.getState();
	const attachedIds = new Set(s.agents.map((a) => a.workItemId));
	const queued = s.workItems.filter(
		(w) => !attachedIds.has(w.id) && w.status === "Agent-Ready",
	);
	const activeAgents = s.agents.filter(
		(a) => a.hookStatus !== "waiting" && a.hookStatus !== "idle",
	);
	const slots = s.maxAgents - activeAgents.length;
	if (slots > 0 && queued.length > 0) {
		return { workItem: queued[0], slots };
	}
	return null;
}

const onStoreChange$ = new Observable<void>((subscriber) => {
	useStore.subscribe(() => subscriber.next());
});

export const slotsAvailable$ = merge(onStoreChange$, interval(5000)).pipe(
	map(() => check()),
	(source$) =>
		new Observable<SlotsPayload>((subscriber) => {
			source$.subscribe((payload) => {
				if (payload) subscriber.next(payload);
			});
		}),
);
