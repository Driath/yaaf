import { Observable } from "rxjs";
import { useStore } from "../../store";
import type { WorkItem } from "../../work-item/types";

export interface SlotsPayload {
	workItem: WorkItem;
	slots: number;
}

export const slotsAvailable$ = new Observable<SlotsPayload>((subscriber) => {
	useStore.subscribe(
		(s) => {
			const attachedIds = new Set(s.agents.map((a) => a.workItemId));
			const queued = s.workItems.filter((w) => !attachedIds.has(w.id));
			const slots = s.maxAgents - s.agents.length;
			return { queued, slots };
		},
		({ queued, slots }) => {
			if (slots > 0 && queued.length > 0) {
				subscriber.next({ workItem: queued[0], slots });
			}
		},
	);
});
