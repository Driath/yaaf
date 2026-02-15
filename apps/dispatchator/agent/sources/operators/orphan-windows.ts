import { filter, map, type OperatorFunction } from "rxjs";
import type { TmuxEvent } from "../tmux";

export const orphanWindows: OperatorFunction<TmuxEvent, number> = (source$) =>
	source$.pipe(
		filter(
			(e): e is Extract<TmuxEvent, { type: "orphanWindow" }> =>
				e.type === "orphanWindow",
		),
		map((e) => e.windowIndex),
	);
