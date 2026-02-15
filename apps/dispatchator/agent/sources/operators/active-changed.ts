import { filter, map, type OperatorFunction } from "rxjs";
import type { TmuxEvent } from "../tmux";

export const activeChanged: OperatorFunction<TmuxEvent, string | null> = (
	source$,
) =>
	source$.pipe(
		filter(
			(e): e is Extract<TmuxEvent, { type: "activeChanged" }> =>
				e.type === "activeChanged",
		),
		map((e) => e.agentId),
	);
