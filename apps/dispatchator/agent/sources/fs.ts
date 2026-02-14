import { Observable } from "rxjs";
import { watchAgentState } from "../adapters/state-watcher";

export interface FsEvent {
	type: "status" | "kill";
	agentId: string;
	status?: string;
}

export const fs$ = new Observable<FsEvent>((subscriber) => {
	watchAgentState(
		(agentId, status) => subscriber.next({ type: "status", agentId, status }),
		(agentId) => subscriber.next({ type: "kill", agentId }),
	);
});
