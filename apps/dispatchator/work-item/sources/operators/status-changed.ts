import { from, mergeMap, type Observable, pairwise } from "rxjs";
import type { WorkItem } from "../../types";

export const workItemStatusChanged = (source$: Observable<WorkItem[]>) =>
	source$.pipe(
		pairwise(),
		mergeMap(([prev, curr]) => {
			const prevStatus = new Map(prev.map((i) => [i.id, i.status]));
			return from(
				curr.filter(
					(i) => prevStatus.has(i.id) && prevStatus.get(i.id) !== i.status,
				),
			);
		}),
	);
