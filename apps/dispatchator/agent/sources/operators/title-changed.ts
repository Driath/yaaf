import { filter, map, type OperatorFunction } from "rxjs";
import type { FsEvent } from "../fs";

export const titleChanged: OperatorFunction<
	FsEvent,
	{ agentId: string; title: string }
> = (source$) =>
	source$.pipe(
		filter(
			(e): e is FsEvent & { type: "title"; title: string } =>
				e.type === "title" && !!e.title,
		),
		map((e) => ({ agentId: e.agentId, title: e.title })),
	);
