import { Observable } from "rxjs";
import { watchAgentState } from "../adapters/state-watcher";

export interface FsEvent {
	type: "waiting" | "done" | "kill";
	agentId?: string;
}

export const fs$ = new Observable<FsEvent>((subscriber) => {
	watchAgentState(
		() => subscriber.next({ type: "waiting" }),
		(agentId) => subscriber.next({ type: "done", agentId }),
		(agentId) => subscriber.next({ type: "kill", agentId }),
	);
});
