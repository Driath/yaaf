import type { StateCreator } from "zustand";
import { getConfig } from "../config";
import type { WorkItem } from "../work-item/types";
import { getWaitingAgents } from "./adapters/state-watcher";
import {
	focusAgent as focusAgentPane,
	getActiveAgent,
	getRunningAgents,
	getWindowTitles,
	killAgent as killAgentPane,
} from "./adapters/tmux";
import type { Agent, AgentStatus } from "./types";

const MAX_LOGS = 100;

const existingAgents = new Set(getRunningAgents());

export interface AgentsSlice {
	maxAgents: number;
	agents: Agent[];
	logs: string[];
	activeAgentId: string | null;

	addAgent: (item: WorkItem) => void;
	updateAgent: (id: string, status: AgentStatus) => void;
	focusAgent: (id: string) => void;
	log: (message: string) => void;
	syncAgentsState: () => void;
	removeAgent: (id: string) => void;
}

export const createAgentsSlice: StateCreator<
	AgentsSlice & import("../store/ui-slice").UiSlice,
	[["zustand/subscribeWithSelector", never]],
	[],
	AgentsSlice
> = (set, get) => ({
	maxAgents: getConfig().agents.maxConcurrent,
	agents: [],
	logs: [],
	activeAgentId: getActiveAgent(),

	addAgent: (item) => {
		if (get().agents.some((a) => a.id === item.id)) return;

		const alreadyRunning = existingAgents.has(item.id);
		const waiting = getWaitingAgents();
		const status: AgentStatus = alreadyRunning
			? waiting.has(item.id)
				? "waiting"
				: "working"
			: "queued";
		const thinkingLabel = item.thinking ? " 🧠" : "";
		const modeLabel = item.agentMode === "plan" ? " 📋" : "";
		const logMsg = alreadyRunning
			? `🔄 ${item.id}: reconnected`
			: `🎫 ${item.id}: queued (${item.model}${thinkingLabel}${modeLabel})`;

		const agent: Agent = {
			id: item.id,
			summary: item.summary,
			title: "",
			status,
			model: item.model,
			thinking: item.thinking,
			agentMode: item.agentMode,
			workflow: item.workflow,
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
});
