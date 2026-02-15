import { from, mergeMap, type OperatorFunction } from "rxjs";
import { agentIds, type TmuxPair } from "../tmux";

export const staleAgent: OperatorFunction<TmuxPair, string> = (source$) =>
	source$.pipe(
		mergeMap(([prev, curr]) => {
			const prevIds = agentIds(prev);
			const currIds = agentIds(curr);
			return from(
				[...curr.storeAgentIds].filter(
					(id) => !currIds.has(id) && !prevIds.has(id),
				),
			);
		}),
	);
