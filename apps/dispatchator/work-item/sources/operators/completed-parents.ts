import { filter, from, map, mergeMap, type Observable } from "rxjs";
import type { WorkItem } from "../../types";

export const completedParents = (source$: Observable<WorkItem[]>) =>
	source$.pipe(
		map((items) => {
			const childParentIds = new Set(
				items.filter((i) => i.parentId).map((i) => i.parentId as string),
			);
			return items.filter(
				(i) => i.commentCount > 0 && childParentIds.has(i.id),
			);
		}),
		filter((items) => items.length > 0),
		mergeMap((items) => from(items)),
	);
