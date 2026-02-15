import { filter, map, type OperatorFunction } from "rxjs";
import type { TmuxPair } from "../tmux";

export const activeChanged: OperatorFunction<TmuxPair, string | null> = (
	source$,
) =>
	source$.pipe(
		filter(([prev, curr]) => prev.activeAgentId !== curr.activeAgentId),
		map(([, curr]) => curr.activeAgentId),
	);
