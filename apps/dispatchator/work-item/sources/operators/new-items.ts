import { from, mergeMap, type Observable, pairwise, startWith } from "rxjs";
import type { WorkItem } from "../../types";

export const newItems = (source$: Observable<WorkItem[]>) =>
	source$.pipe(
		startWith([] as WorkItem[]),
		pairwise(),
		mergeMap(([prev, curr]) => {
			const prevIds = new Set(prev.map((i) => i.id));
			return from(curr.filter((i) => !prevIds.has(i.id)));
		}),
	);
