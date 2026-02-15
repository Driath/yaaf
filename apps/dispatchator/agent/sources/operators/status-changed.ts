import { filter, map, type OperatorFunction } from "rxjs";
import type { FsEvent } from "../fs";

export const statusChanged: OperatorFunction<
	FsEvent,
	{ agentId: string; status: string }
> = (source$) =>
	source$.pipe(
		filter(
			(e): e is FsEvent & { type: "status"; status: string } =>
				e.type === "status" && !!e.status,
		),
		map((e) => ({ agentId: e.agentId, status: e.status })),
	);
