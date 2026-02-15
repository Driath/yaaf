import { useEffect } from "react";
import { Subject, takeUntil } from "rxjs";
import { readInitialSnapshots } from "../agent/adapters/state-watcher";
import {
	killAgent,
	killWindow,
	setAgentWindowTitle,
	spawnAgent,
} from "../agent/adapters/tmux";
import { slotsAvailable$ } from "../agent/events/slots";
import { fs$ } from "../agent/sources/fs";
import { activeChanged } from "../agent/sources/operators/active-changed";
import { logEvent, logLifecycle } from "../agent/sources/operators/log-event";
import { orphanWindows } from "../agent/sources/operators/orphan-windows";
import { staleAgent } from "../agent/sources/operators/stale-agent";
import { statusChanged } from "../agent/sources/operators/status-changed";
import { titleChanged } from "../agent/sources/operators/title-changed";
import { windowAdded } from "../agent/sources/operators/window-added";
import { windowRemoved } from "../agent/sources/operators/window-removed";
import { tmux$ } from "../agent/sources/tmux";
import { getConfig } from "../config";
import { useStore } from "../store";
import { getWorkItems$ } from "../work-item/sources";
import { newItems } from "../work-item/sources/operators/new-items";

const config = getConfig();
const workItems$ = getWorkItems$(config);

// Architecture: source$ → operator → subscribe(sideEffect)
//
// Each source (tmux$, fs$, workItems$) is a single shared observable.
// Operators filter/transform events per concern. Subscribers trigger side effects.
// Adding behavior = new operator + new subscribe line. No new observables.
//
//   workItems$.pipe(newItems)        → addWorkItem
//   slotsAvailable$                  → spawnAgent
//   tmux$.pipe(windowAdded)          → attachAgent + restore snapshot
//   tmux$.pipe(windowRemoved)        → detachAgent
//   tmux$.pipe(activeChanged)        → setActiveWorkItem
//   tmux$.pipe(orphanWindows)        → killAgent
//   fs$.pipe(statusChanged)          → updateHookStatus
//   fs$.pipe(titleChanged)           → updateAgentTitle

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
		logLifecycle("start");
		const destroy$ = new Subject<void>();
		const snapshots = readInitialSnapshots();

		workItems$
			.pipe(newItems, logEvent("newItem"), takeUntil(destroy$))
			.subscribe((item) => addWorkItem(item));

		slotsAvailable$
			.pipe(logEvent("slotAvailable"), takeUntil(destroy$))
			.subscribe(({ workItem }) => {
				attachAgent(workItem.id);
				spawnAgent(workItem.id, workItem.summary, {
					model: workItem.model,
					thinking: workItem.thinking,
					agentMode: workItem.agentMode,
					workflow: workItem.workflow,
				});
			});

		tmux$
			.pipe(windowAdded, logEvent("windowAdded"), takeUntil(destroy$))
			.subscribe((agentId) => {
				attachAgent(agentId);
				const snap = snapshots.get(agentId);
				if (snap?.status) updateHookStatus(agentId, snap.status);
				if (snap?.title) updateAgentTitle(agentId, snap.title);
			});

		tmux$
			.pipe(windowRemoved, logEvent("windowRemoved"), takeUntil(destroy$))
			.subscribe((agentId) => detachAgent(agentId));

		tmux$
			.pipe(activeChanged, logEvent("activeChanged"), takeUntil(destroy$))
			.subscribe((agentId) => setActiveWorkItem(agentId));

		tmux$
			.pipe(orphanWindows, logEvent("orphanWindow"), takeUntil(destroy$))
			.subscribe((windowIndex) => killWindow(windowIndex));

		tmux$
			.pipe(staleAgent, logEvent("staleAgent"), takeUntil(destroy$))
			.subscribe((agentId) => detachAgent(agentId));

		fs$
			.pipe(statusChanged, logEvent("statusChanged"), takeUntil(destroy$))
			.subscribe(({ agentId, status }) => updateHookStatus(agentId, status));

		fs$
			.pipe(titleChanged, logEvent("titleChanged"), takeUntil(destroy$))
			.subscribe(({ agentId, title }) => {
				updateAgentTitle(agentId, title);
				setAgentWindowTitle(agentId, title);
			});

		return () => {
			logLifecycle("stop");
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
