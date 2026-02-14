import { useEffect } from "react";
import { Subject, takeUntil } from "rxjs";
import { getConfig } from "../config";
import { useStore } from "../store";
import { getWorkItems$ } from "../work-item/sources";
import { newItems } from "../work-item/sources/operators/new-items";

const config = getConfig();
const workItems$ = getWorkItems$(config);

export function useSources() {
	const { addAgent } = useStore();

	useEffect(() => {
		const destroy$ = new Subject<void>();

		workItems$
			.pipe(newItems, takeUntil(destroy$))
			.subscribe((item) => addAgent(item));

		return () => {
			destroy$.next();
			destroy$.complete();
		};
	}, [addAgent]);
}
