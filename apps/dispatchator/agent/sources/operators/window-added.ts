import { filter, map, type OperatorFunction } from "rxjs";
import type { TmuxEvent } from "../tmux";

export const windowAdded: OperatorFunction<TmuxEvent, string> = (source$) =>
	source$.pipe(
		filter(
			(e): e is Extract<TmuxEvent, { type: "windowAdded" }> =>
				e.type === "windowAdded",
		),
		map((e) => e.agentId),
	);
