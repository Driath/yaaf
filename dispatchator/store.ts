import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
	focusAgent as focusAgentPane,
	getActiveAgent,
	getRunningAgents,
	getWindowTitles,
	killAgent as killAgentPane,
	spawnAgent,
} from "./agent/spawn";
import { getWaitingAgents, watchAgentState } from "./agent/state";
import {
	ACTIONS,
	type Agent,
	type AgentStatus,
	type Store,
} from "./agent/types";
import { getConfig } from "./config";

const MAX_LOGS = 100;

const existingAgents = new Set(getRunningAgents());

export const useStore = create<Store>()(
	subscribeWithSelector((set, get) => ({
		maxAgents: getConfig().agents.maxConcurrent,

		agents: [],
		logs: [],
		selectedIndex: 0,
		activeAgentId: getActiveAgent(),
		showActions: false,
		actionIndex: 0,

		addAgent: (
			id,
			summary,
			model = getConfig().agents.defaultModel,
			thinking = false,
			agentMode = "default",
			workflow = getConfig().agents.defaultWorkflow,
		) => {
			if (get().agents.some((a) => a.id === id)) return;

			const alreadyRunning = existingAgents.has(id);
			const waiting = getWaitingAgents();
			const status: AgentStatus = alreadyRunning
				? waiting.has(id)
					? "waiting"
					: "working"
				: "queued";
			const thinkingLabel = thinking ? " 🧠" : "";
			const modeLabel = agentMode === "plan" ? " 📋" : "";
			const logMsg = alreadyRunning
				? `🔄 ${id}: reconnected`
				: `🎫 ${id}: queued (${model}${thinkingLabel}${modeLabel})`;

			const agent: Agent = {
				id,
				summary,
				title: "",
				status,
				model,
				thinking,
				agentMode,
				workflow,
			};
			set((s) => ({
				agents: [...s.agents, agent],
				logs: [...s.logs, logMsg].slice(-MAX_LOGS),
			}));
		},

		updateAgent: (id, status) => {
			set((s) => ({
				agents: s.agents.map((a) => (a.id === id ? { ...a, status } : a)),
			}));
		},

		focusAgent: (id) => {
			const agent = get().agents.find((a) => a.id === id);
			if (agent && (agent.status === "working" || agent.status === "waiting")) {
				focusAgentPane(id);
				set({ activeAgentId: id });
			}
		},

		log: (message) => {
			set((s) => ({
				logs: [...s.logs, message].slice(-MAX_LOGS),
			}));
		},

		selectNext: () => {
			const { agents, selectedIndex } = get();
			if (agents.length === 0) return;
			set({ selectedIndex: (selectedIndex + 1) % agents.length });
		},

		selectPrev: () => {
			const { agents, selectedIndex } = get();
			if (agents.length === 0) return;
			set({
				selectedIndex: (selectedIndex - 1 + agents.length) % agents.length,
			});
		},

		focusSelected: () => {
			const { agents, selectedIndex, focusAgent } = get();
			const agent = agents[selectedIndex];
			if (agent && (agent.status === "working" || agent.status === "waiting")) {
				focusAgent(agent.id);
			}
		},

		syncAgentsState: () => {
			const activeId = getActiveAgent();
			const waiting = getWaitingAgents();
			const running = new Set(getRunningAgents());
			const titles = getWindowTitles();

			set((s) => ({
				activeAgentId: activeId,
				agents: s.agents.map((a) => {
					if (a.status === "queued") return a;
					if (!running.has(a.id))
						return { ...a, status: "queued" as AgentStatus };
					const newStatus: AgentStatus = waiting.has(a.id)
						? "waiting"
						: "working";
					const newTitle = titles.get(a.id) || a.title;
					return { ...a, status: newStatus, title: newTitle };
				}),
			}));
		},

		removeAgent: (id) => {
			const agent = get().agents.find((a) => a.id === id);
			if (!agent) return;

			if (agent.status === "working" || agent.status === "waiting") {
				killAgentPane(id);
			}

			set((s) => ({
				agents: s.agents.filter((a) => a.id !== id),
				logs: [...s.logs, `✅ ${id}: auto-done`].slice(-MAX_LOGS),
				selectedIndex: Math.min(
					s.selectedIndex,
					Math.max(0, s.agents.length - 2),
				),
			}));
		},

		toggleActions: () => {
			set((s) => ({ showActions: !s.showActions, actionIndex: 0 }));
		},

		nextAction: () => {
			set((s) => ({ actionIndex: (s.actionIndex + 1) % ACTIONS.length }));
		},

		prevAction: () => {
			set((s) => ({
				actionIndex: (s.actionIndex - 1 + ACTIONS.length) % ACTIONS.length,
			}));
		},

		getActions: () => ACTIONS,

		executeAction: () => {
			const { agents, selectedIndex, actionIndex } = get();
			const agent = agents[selectedIndex];
			if (!agent) return;

			const action = ACTIONS[actionIndex].id;

			if (
				action === "kill" &&
				(agent.status === "working" || agent.status === "waiting")
			) {
				killAgentPane(agent.id);
				set((s) => ({
					agents: s.agents.map((a) =>
						a.id === agent.id ? { ...a, status: "queued" as AgentStatus } : a,
					),
					logs: [...s.logs, `💀 ${agent.id}: killed, will restart`].slice(
						-MAX_LOGS,
					),
					showActions: false,
				}));
			} else if (action === "done") {
				if (agent.status === "working" || agent.status === "waiting") {
					killAgentPane(agent.id);
				}
				set((s) => ({
					agents: s.agents.filter((a) => a.id !== agent.id),
					logs: [...s.logs, `✅ ${agent.id}: done`].slice(-MAX_LOGS),
					showActions: false,
					selectedIndex: Math.min(s.selectedIndex, s.agents.length - 2),
				}));
			}
		},
	})),
);

const getQueued = (s: Store) => s.agents.filter((a) => a.status === "queued");
const getWorking = (s: Store) => s.agents.filter((a) => a.status === "working");

useStore.subscribe(
	(s) => ({ queued: getQueued(s).length, working: getWorking(s).length }),
	({ queued, working }, _prev) => {
		const { maxAgents, updateAgent, log } = useStore.getState();
		const canWork = working < maxAgents;
		const hasQueued = queued > 0;

		if (canWork && hasQueued) {
			const next = getQueued(useStore.getState())[0];
			if (next) {
				updateAgent(next.id, "working");
				const thinkingLabel = next.thinking ? " 🧠" : "";
				const modeLabel = next.agentMode === "plan" ? " 📋" : "";
				log(
					`🚀 ${next.id}: spawning /workflow:${next.workflow} (${next.model}${thinkingLabel}${modeLabel})`,
				);
				spawnAgent(next.id, next.summary, {
					model: next.model,
					thinking: next.thinking,
					agentMode: next.agentMode,
					workflow: next.workflow,
				});
			}
		}
	},
	{ equalityFn: (a, b) => a.queued === b.queued && a.working === b.working },
);

watchAgentState(
	() => useStore.getState().syncAgentsState(),
	(agentId) => useStore.getState().removeAgent(agentId),
	(agentId) => {
		killAgentPane(agentId);
		useStore.getState().removeAgent(agentId);
		useStore.getState().log(`💀 ${agentId}: killed, will re-spawn`);
	},
);
