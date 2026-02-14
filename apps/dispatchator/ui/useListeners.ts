import { useEffect } from "react";
import { filter, tap } from "rxjs";
import { spawnAgent } from "../agent/adapters/tmux";
import { slotsAvailable$ } from "../agent/events/slots";
import { fs$ } from "../agent/sources/fs";
import { logEvent } from "../log/operator";
import { useLogStore } from "../log/store";
import { useStore } from "../store";
import { workItemSources$ } from "./useSources";

export function useListeners() {
	useEffect(() => {
		const subs = [
			...workItemSources$.map((source$) =>
				source$
					.pipe(
						tap(({ items }) => {
							if (items.length > 0) {
								useLogStore.getState().log({
									type: "event",
									source: "Jira",
									action: "addAgents",
									detail: `${items.length} item(s): ${items.map((i) => i.id).join(", ")}`,
								});
							}
						}),
						tap(({ doneIds }) => {
							if (doneIds.length > 0) {
								useLogStore.getState().log({
									type: "event",
									source: "Jira",
									action: "markDone",
									detail: doneIds.join(", "),
								});
							}
						}),
					)
					.subscribe(({ items, doneIds }) => {
						const store = useStore.getState();
						for (const item of items) {
							store.addAgent(item);
						}
						for (const id of doneIds) {
							store.updateAgent(id, "idle");
						}
					}),
			),

			fs$
				.pipe(
					filter((e) => e.type === "waiting"),
					logEvent("FS", "syncState"),
				)
				.subscribe(() => {
					useStore.getState().syncAgentsState();
				}),

			fs$
				.pipe(
					filter((e) => e.type === "done" && !!e.agentId),
					logEvent("FS", "removeAgent", (e) => e.agentId),
				)
				.subscribe((e) => {
					useStore.getState().removeAgent(e.agentId!);
				}),

			fs$
				.pipe(
					filter((e) => e.type === "kill" && !!e.agentId),
					logEvent("FS", "killAgent", (e) => e.agentId),
				)
				.subscribe((e) => {
					useStore.getState().removeAgent(e.agentId!);
				}),

			slotsAvailable$
				.pipe(logEvent("SlotsAvailable", "spawnAgent"))
				.subscribe(({ queued }) => {
					const next = queued[0]!;
					const store = useStore.getState();
					store.updateAgent(next.id, "working");
					spawnAgent(next.id, next.summary, {
						model: next.model,
						thinking: next.thinking,
						agentMode: next.agentMode,
						workflow: next.workflow,
					});
				}),
		];

		return () => {
			for (const sub of subs) sub.unsubscribe();
		};
	}, []);
}
