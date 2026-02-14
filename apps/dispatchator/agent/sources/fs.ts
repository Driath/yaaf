import { Observable } from "rxjs";
import { watchAgentState } from "../adapters/state-watcher";

export interface FsEvent {
	type: "status" | "kill" | "title";
	agentId: string;
	status?: string;
	title?: string;
}

export const fs$ = new Observable<FsEvent>((subscriber) => {
	watchAgentState(
		(agentId, status) => subscriber.next({ type: "status", agentId, status }),
		(agentId) => subscriber.next({ type: "kill", agentId }),
		(agentId, title) => subscriber.next({ type: "title", agentId, title }),
	);
});
