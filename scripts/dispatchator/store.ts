// Zustand store for dispatchator

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { spawnAgent, focusAgent as focusAgentPane, getRunningAgents, getActiveAgent, killAgent as killAgentPane, getWindowTitles } from './spawn'
import { readdirSync, watch, unlinkSync } from 'fs'

const AGENTS_STATE_DIR = `${process.cwd()}/ia/state/agents`

function getWaitingAgents(): Set<string> {
  try {
    const files = readdirSync(AGENTS_STATE_DIR)
    return new Set(files.filter(f => f.endsWith('.waiting')).map(f => f.replace('.waiting', '')))
  } catch {
    return new Set()
  }
}

function getDoneAgents(): Set<string> {
  try {
    const files = readdirSync(AGENTS_STATE_DIR)
    return new Set(files.filter(f => f.endsWith('.done')).map(f => f.replace('.done', '')))
  } catch {
    return new Set()
  }
}

function clearDoneFile(agentId: string): void {
  try {
    unlinkSync(`${AGENTS_STATE_DIR}/${agentId}.done`)
  } catch { /* ignore */ }
}

export type AgentStatus = 'queued' | 'working' | 'waiting' | 'idle'

export type Model = 'small' | 'medium' | 'strong'
export type AgentMode = 'default' | 'plan'

export interface Agent {
  id: string          // ticket ID (e.g. KAN-8)
  summary: string     // ticket summary
  title: string       // tmux window title (set by agent)
  status: AgentStatus
  model: Model
  thinking: boolean
  agentMode: AgentMode
}

export type Action = 'kill' | 'done'
export const ACTIONS: { id: Action; icon: string }[] = [
  { id: 'kill', icon: '✘' },
  { id: 'done', icon: '✔' }
]

export interface Store {
  // Config
  maxAgents: number

  // State
  agents: Agent[]
  logs: string[]
  selectedIndex: number
  activeAgentId: string | null
  showActions: boolean
  actionIndex: number

  // Actions
  addAgent: (id: string, summary: string, model?: Model, thinking?: boolean, agentMode?: AgentMode) => void
  updateAgent: (id: string, status: AgentStatus) => void
  focusAgent: (id: string) => void
  log: (message: string) => void
  selectNext: () => void
  selectPrev: () => void
  focusSelected: () => void
  syncAgentsState: () => void
  removeAgent: (id: string) => void
  toggleActions: () => void
  nextAction: () => void
  prevAction: () => void
  executeAction: () => void
  getActions: () => Action[]
}

const MAX_LOGS = 100 // We'll slice in the UI based on available space

// Get existing agents from tmux at startup
const existingAgents = new Set(getRunningAgents())

export const useStore = create<Store>()(
  subscribeWithSelector((set, get) => ({
    // Config
    maxAgents: 1,

    // State
    agents: [],
    logs: [],
    selectedIndex: 0,
    activeAgentId: getActiveAgent(),
    showActions: false,
    actionIndex: 0,

    // Actions
    addAgent: (id, summary, model = 'small', thinking = false, agentMode = 'default') => {
      if (get().agents.some(a => a.id === id)) return

      // Check if this agent already exists in tmux
      const alreadyRunning = existingAgents.has(id)
      const waiting = getWaitingAgents()
      const status: AgentStatus = alreadyRunning
        ? (waiting.has(id) ? 'waiting' : 'working')
        : 'queued'
      const thinkingLabel = thinking ? ' 🧠' : ''
      const modeLabel = agentMode === 'plan' ? ' 📋' : ''
      const logMsg = alreadyRunning ? `🔄 ${id}: reconnected` : `🎫 ${id}: queued (${model}${thinkingLabel}${modeLabel})`

      const agent: Agent = { id, summary, title: '', status, model, thinking, agentMode }
      set((s) => ({
        agents: [...s.agents, agent],
        logs: [...s.logs, logMsg].slice(-MAX_LOGS)
      }))
    },

    updateAgent: (id, status) => {
      set((s) => ({
        agents: s.agents.map(a => a.id === id ? { ...a, status } : a)
      }))
    },

    focusAgent: (id) => {
      const agent = get().agents.find(a => a.id === id)
      if (agent && (agent.status === 'working' || agent.status === 'waiting')) {
        focusAgentPane(id)
        set({ activeAgentId: id })
      }
    },

    log: (message) => {
      set((s) => ({
        logs: [...s.logs, message].slice(-MAX_LOGS)
      }))
    },

    selectNext: () => {
      const { agents, selectedIndex } = get()
      if (agents.length === 0) return
      set({ selectedIndex: (selectedIndex + 1) % agents.length })
    },

    selectPrev: () => {
      const { agents, selectedIndex } = get()
      if (agents.length === 0) return
      set({ selectedIndex: (selectedIndex - 1 + agents.length) % agents.length })
    },

    focusSelected: () => {
      const { agents, selectedIndex, focusAgent } = get()
      const agent = agents[selectedIndex]
      if (agent && (agent.status === 'working' || agent.status === 'waiting')) {
        focusAgent(agent.id)
      }
    },

    syncAgentsState: () => {
      const activeId = getActiveAgent()
      const waiting = getWaitingAgents()
      const running = new Set(getRunningAgents())
      const titles = getWindowTitles()

      set((s) => ({
        activeAgentId: activeId,
        agents: s.agents.map(a => {
          if (a.status === 'queued') return a
          // If tmux window is dead, back to queued
          if (!running.has(a.id)) return { ...a, status: 'queued' as AgentStatus }
          // Update working/waiting based on HITL state
          const newStatus: AgentStatus = waiting.has(a.id) ? 'waiting' : 'working'
          // Update title from tmux
          const newTitle = titles.get(a.id) || a.title
          return { ...a, status: newStatus, title: newTitle }
        })
      }))
    },

    removeAgent: (id) => {
      const agent = get().agents.find(a => a.id === id)
      if (!agent) return

      // Kill tmux window if running
      if (agent.status === 'working' || agent.status === 'waiting') {
        killAgentPane(id)
      }

      set((s) => ({
        agents: s.agents.filter(a => a.id !== id),
        logs: [...s.logs, `✅ ${id}: auto-done`].slice(-MAX_LOGS),
        selectedIndex: Math.min(s.selectedIndex, Math.max(0, s.agents.length - 2))
      }))
    },

    toggleActions: () => {
      set((s) => ({ showActions: !s.showActions, actionIndex: 0 }))
    },

    nextAction: () => {
      set((s) => ({ actionIndex: (s.actionIndex + 1) % ACTIONS.length }))
    },

    prevAction: () => {
      set((s) => ({ actionIndex: (s.actionIndex - 1 + ACTIONS.length) % ACTIONS.length }))
    },

    getActions: () => ACTIONS,

    executeAction: () => {
      const { agents, selectedIndex, actionIndex } = get()
      const agent = agents[selectedIndex]
      if (!agent) return

      const action = ACTIONS[actionIndex].id

      if (action === 'kill' && (agent.status === 'working' || agent.status === 'waiting')) {
        killAgentPane(agent.id)
        set((s) => ({
          agents: s.agents.map(a => a.id === agent.id ? { ...a, status: 'queued' as AgentStatus } : a),
          logs: [...s.logs, `💀 ${agent.id}: killed, will restart`].slice(-MAX_LOGS),
          showActions: false
        }))
      } else if (action === 'done') {
        if (agent.status === 'working' || agent.status === 'waiting') {
          killAgentPane(agent.id)
        }
        // Remove agent from list (done = no longer exists)
        set((s) => ({
          agents: s.agents.filter(a => a.id !== agent.id),
          logs: [...s.logs, `✅ ${agent.id}: done`].slice(-MAX_LOGS),
          showActions: false,
          selectedIndex: Math.min(s.selectedIndex, s.agents.length - 2)
        }))
      }
    }
  }))
)

// Selectors
const getQueued = (s: Store) => s.agents.filter(a => a.status === 'queued')
const getWorking = (s: Store) => s.agents.filter(a => a.status === 'working')

// Subscribe: when queue changes, try to spawn
useStore.subscribe(
  (s) => ({ queued: getQueued(s).length, working: getWorking(s).length }),
  ({ queued, working }, prev) => {
    const { maxAgents, updateAgent, log } = useStore.getState()
    const canWork = working < maxAgents
    const hasQueued = queued > 0

    if (canWork && hasQueued) {
      const next = getQueued(useStore.getState())[0]
      if (next) {
        updateAgent(next.id, 'working')
        const thinkingLabel = next.thinking ? ' 🧠' : ''
        const modeLabel = next.agentMode === 'plan' ? ' 📋' : ''
        log(`🚀 ${next.id}: spawning agent (${next.model}${thinkingLabel}${modeLabel})`)
        spawnAgent(next.id, next.summary, { model: next.model, thinking: next.thinking, agentMode: next.agentMode })
      }
    }
  },
  { equalityFn: (a, b) => a.queued === b.queued && a.working === b.working }
)

// Watch for state file changes
const watcher = watch(AGENTS_STATE_DIR, (event, filename) => {
  if (filename?.endsWith('.waiting')) {
    useStore.getState().syncAgentsState()
  } else if (filename?.endsWith('.done')) {
    const agentId = filename.replace('.done', '')
    clearDoneFile(agentId)
    useStore.getState().removeAgent(agentId)
  }
})

// Cleanup on exit
process.on('exit', () => watcher.close())
process.on('SIGINT', () => { watcher.close(); process.exit() })
process.on('SIGTERM', () => { watcher.close(); process.exit() })
