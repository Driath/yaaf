import { filter, map, type OperatorFunction } from "rxjs";
import type { TmuxEvent } from "../tmux";

export const staleAgent: OperatorFunction<TmuxEvent, string> = (source$) =>
	source$.pipe(
		filter(
			(e): e is Extract<TmuxEvent, { type: "staleAgent" }> =>
				e.type === "staleAgent",
		),
		map((e) => e.agentId),
	);
