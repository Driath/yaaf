import { from, mergeMap, type Observable, pairwise, startWith } from "rxjs";
import type { WorkItem } from "../../types";

export const completedParents = (source$: Observable<WorkItem[]>) =>
	source$.pipe(
		startWith([] as WorkItem[]),
		pairwise(),
		mergeMap(([prev, curr]) => {
			const prevCounts = new Map(prev.map((i) => [i.id, i.commentCount]));
			return from(
				curr.filter(
					(i) => i.commentCount > 0 && (prevCounts.get(i.id) ?? 0) === 0,
				),
			);
		}),
	);
