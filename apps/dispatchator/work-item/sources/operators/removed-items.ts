import { from, mergeMap, type Observable, pairwise, startWith } from "rxjs";
import type { WorkItem } from "../../types";

export const removedItems = (source$: Observable<WorkItem[]>) =>
	source$.pipe(
		startWith([] as WorkItem[]),
		pairwise(),
		mergeMap(([prev, curr]) => {
			const currIds = new Set(curr.map((i) => i.id));
			return from(prev.filter((i) => !currIds.has(i.id)));
		}),
	);
