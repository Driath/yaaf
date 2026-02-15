import { from, mergeMap, type OperatorFunction } from "rxjs";
import { agentIds, type TmuxPair } from "../tmux";

export const windowRemoved: OperatorFunction<TmuxPair, string> = (source$) =>
	source$.pipe(
		mergeMap(([prev, curr]) => {
			const currIds = agentIds(curr);
			return from([...agentIds(prev)].filter((id) => !currIds.has(id)));
		}),
	);
