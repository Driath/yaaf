import { filter, Observable } from "rxjs";
import { useStore } from "../../store";
import type { Agent } from "../types";

export interface SlotsPayload {
	queued: Agent[];
	slots: number;
}

export const slotsAvailable$ = new Observable<SlotsPayload>((subscriber) => {
	useStore.subscribe(
		(s) => ({
			queued: s.agents.filter((a) => a.status === "queued"),
			slots:
				s.maxAgents - s.agents.filter((a) => a.status === "working").length,
		}),
		(next) => subscriber.next(next),
	);
}).pipe(filter(({ slots, queued }) => slots > 0 && queued.length > 0));
