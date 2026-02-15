import { filter, map, type OperatorFunction } from "rxjs";
import type { TmuxEvent } from "../tmux";

export const windowRemoved: OperatorFunction<TmuxEvent, string> = (source$) =>
	source$.pipe(
		filter(
			(e): e is Extract<TmuxEvent, { type: "windowRemoved" }> =>
				e.type === "windowRemoved",
		),
		map((e) => e.agentId),
	);
