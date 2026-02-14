import { useEffect } from "react";
import { Subject, takeUntil } from "rxjs";
import { readInitialSnapshots } from "../agent/adapters/state-watcher";
import { spawnAgent } from "../agent/adapters/tmux";
import { slotsAvailable$ } from "../agent/events/slots";
import { fs$ } from "../agent/sources/fs";
import { tmux$ } from "../agent/sources/tmux";
import { getConfig } from "../config";
import { useStore } from "../store";
import { getWorkItems$ } from "../work-item/sources";
import { newItems } from "../work-item/sources/operators/new-items";

const config = getConfig();
const workItems$ = getWorkItems$(config);

export function useSources() {
	const {
		addWorkItem,
		attachAgent,
		detachAgent,
		updateHookStatus,
		updateAgentTitle,
		setActiveWorkItem,
	} = useStore();

	useEffect(() => {
		const destroy$ = new Subject<void>();

		workItems$
			.pipe(newItems, takeUntil(destroy$))
			.subscribe((item) => addWorkItem(item));

		slotsAvailable$.pipe(takeUntil(destroy$)).subscribe(({ workItem }) => {
			attachAgent(workItem.id);
			spawnAgent(workItem.id, workItem.summary, {
				model: workItem.model,
				thinking: workItem.thinking,
				agentMode: workItem.agentMode,
				workflow: workItem.workflow,
			});
		});

		const snapshots = readInitialSnapshots();

		tmux$.pipe(takeUntil(destroy$)).subscribe((e) => {
			if (e.type === "windowAdded") {
				attachAgent(e.agentId);
				const snap = snapshots.get(e.agentId);
				if (snap?.status) updateHookStatus(e.agentId, snap.status);
				if (snap?.title) updateAgentTitle(e.agentId, snap.title);
			} else if (e.type === "windowRemoved") {
				detachAgent(e.agentId);
			} else if (e.type === "activeChanged") {
				setActiveWorkItem(e.agentId);
			}
		});

		fs$.pipe(takeUntil(destroy$)).subscribe((e) => {
			if (e.type === "status" && e.status) {
				updateHookStatus(e.agentId, e.status);
			} else if (e.type === "title" && e.title) {
				updateAgentTitle(e.agentId, e.title);
			}
		});

		return () => {
			destroy$.next();
			destroy$.complete();
		};
	}, [
		addWorkItem,
		attachAgent,
		detachAgent,
		updateHookStatus,
		updateAgentTitle,
		setActiveWorkItem,
	]);
}
