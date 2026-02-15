import { from, mergeMap, type OperatorFunction } from "rxjs";
import { agentIds, type TmuxPair } from "../tmux";

export const windowAdded: OperatorFunction<TmuxPair, string> = (source$) =>
	source$.pipe(
		mergeMap(([prev, curr]) => {
			const prevIds = agentIds(prev);
			return from([...agentIds(curr)].filter((id) => !prevIds.has(id)));
		}),
	);
