import { watchAgentState } from "../agent/adapters/state-watcher";
import { spawnAgent } from "../agent/adapters/tmux";
import type { Agent } from "../agent/types";
import { defineEvent, on } from "./events";
import { useStore } from "./index";

const SlotsAvailable = defineEvent(
	(s) => ({
		queued: s.agents.filter((a) => a.status === "queued"),
		slots: s.maxAgents - s.agents.filter((a) => a.status === "working").length,
	}),
	({ slots, queued }) => slots > 0 && queued.length > 0,
);

on(SlotsAvailable).subscribe(({ queued }, _prev, store) => {
	const next = queued[0] as Agent;
	store.updateAgent(next.id, "working");
	const thinkingLabel = next.thinking ? " 🧠" : "";
	const modeLabel = next.agentMode === "plan" ? " 📋" : "";
	store.log(
		`🚀 ${next.id}: spawning /workflow:${next.workflow} (${next.model}${thinkingLabel}${modeLabel})`,
	);
	spawnAgent(next.id, next.summary, {
		model: next.model,
		thinking: next.thinking,
		agentMode: next.agentMode,
		workflow: next.workflow,
	});
});

watchAgentState(
	() => useStore.getState().syncAgentsState(),
	(agentId) => useStore.getState().removeAgent(agentId),
	(agentId) => {
		const store = useStore.getState();
		store.removeAgent(agentId);
		store.log(`💀 ${agentId}: killed, will re-spawn`);
	},
);
