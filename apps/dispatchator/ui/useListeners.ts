import { useEffect } from "react";
// import { filter, from, mergeMap } from "rxjs";
// import { spawnAgent } from "../agent/adapters/tmux";
// import { useStore } from "../store";
// import { sources } from "./useSources";

export function useListeners() {
	useEffect(() => {
		const subs: { unsubscribe: () => void }[] = [
			// --- jira$ ---
			// ...sources.jira$.map((source$) =>
			// 	source$
			// 		.pipe(
			// 			mergeMap(({ items, doneIds }) =>
			// 				from([
			// 					...items.map((item) => ({ type: "add" as const, item })),
			// 					...doneIds.map((id) => ({ type: "done" as const, id })),
			// 				]),
			// 			),
			// 		)
			// 		.subscribe((event) => {
			// 			const store = useStore.getState();
			// 			if (event.type === "add") {
			// 				store.addAgent(event.item);
			// 			} else {
			// 				store.removeAgent(event.id);
			// 			}
			// 		}),
			// ),
			// --- fs$ ---
			// sources.fs$
			// 	.pipe(filter((e) => e.type === "status" && e.status === "done"))
			// 	.subscribe((e) => useStore.getState().removeAgent(e.agentId)),
			//
			// sources.fs$
			// 	.pipe(filter((e) => e.type === "status" && e.status !== "done"))
			// 	.subscribe((e) =>
			// 		useStore.getState().updateAgent(e.agentId, e.status!),
			// 	),
			//
			// sources.fs$
			// 	.pipe(filter((e) => e.type === "kill"))
			// 	.subscribe((e) => useStore.getState().removeAgent(e.agentId)),
			// --- tmux$ ---
			// sources.tmux$
			// 	.pipe(filter((e) => e.type === "activeChanged"))
			// 	.subscribe((e) => useStore.getState().setActiveAgent(e.agentId)),
			//
			// sources.tmux$
			// 	.pipe(filter((e) => e.type === "crashed"))
			// 	.subscribe((e) => useStore.getState().updateAgent(e.agentId, "queued")),
			//
			// sources.tmux$
			// 	.pipe(filter((e) => e.type === "titleChanged"))
			// 	.subscribe((e) =>
			// 		useStore.getState().updateAgentTitle(e.agentId, e.title),
			// 	),
			// --- slotsAvailable$ ---
			// sources.slotsAvailable$.subscribe(({ queued }) => {
			// 	const next = queued[0]!;
			// 	const store = useStore.getState();
			// 	store.updateAgent(next.id, "working");
			// 	spawnAgent(next.id, next.summary, {
			// 		model: next.model,
			// 		thinking: next.thinking,
			// 		agentMode: next.agentMode,
			// 		workflow: next.workflow,
			// 	});
			// }),
		];

		return () => {
			for (const sub of subs) sub.unsubscribe();
		};
	}, []);
}
