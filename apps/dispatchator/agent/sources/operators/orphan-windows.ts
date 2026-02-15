import { from, mergeMap, type OperatorFunction } from "rxjs";
import type { TmuxPair } from "../tmux";

export const orphanWindows: OperatorFunction<TmuxPair, number> = (source$) =>
	source$.pipe(
		mergeMap(([, curr]) =>
			from(
				curr.entries
					.filter((e) => e.index !== 0 && !e.agentId)
					.map((e) => e.index),
			),
		),
	);
