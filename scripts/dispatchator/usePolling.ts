import { useEffect } from 'react'
import { Version3Client } from 'jira.js'
import { useStore, type Model, type AgentMode } from './store'

// Parse model from Jira labels (IA:MODEL:*)
function parseModelFromLabels(labels: string[]): Model {
  for (const label of labels) {
    if (label === 'IA:MODEL:STRONG') return 'strong'
    if (label === 'IA:MODEL:MEDIUM') return 'medium'
    if (label === 'IA:MODEL:SMALL') return 'small'
  }
  return 'small' // default
}

// Check if thinking is enabled (IA:CAP:THINK label)
function hasThinking(labels: string[]): boolean {
  return labels.includes('IA:CAP:THINK')
}

// Parse agent mode from labels (IA:AGENT:*)
function parseAgentMode(labels: string[]): AgentMode {
  if (labels.includes('IA:AGENT:PLAN')) return 'plan'
  return 'default'
}

// Parse workflow from labels (IA:WORKFLOW:*)
function parseWorkflow(labels: string[]): string {
  for (const label of labels) {
    if (label.startsWith('IA:WORKFLOW:')) {
      return label.replace('IA:WORKFLOW:', '').toLowerCase().replace(/_/g, '-')
    }
  }
  return 'intent' // default: router
}

const POLL_INTERVAL = 10_000 // 10s
const JIRA_HOST = `https://${process.env.DGD_WORK_ITEM_SITE}`
const PROJECT_KEY = process.env.WI_PROJECT_KEY || 'KAN'
const STATUS_COLUMN = process.env.WI_COLUMN || 'Agent-Ready'
const DONE_COLUMN = process.env.WI_DONE_COLUMN || 'Done'

const jira = new Version3Client({
  host: JIRA_HOST,
  authentication: {
    basic: {
      email: process.env.DGD_WORK_ITEM_EMAIL!,
      apiToken: process.env.DGD_WORK_ITEM_TOKEN!
    }
  }
})

export function usePolling() {
  const addAgent = useStore((s) => s.addAgent)

  // Sync local state periodically (tmux windows, .waiting files)
  // Uses getState() to avoid re-render loops
  useEffect(() => {
    const syncInterval = setInterval(() => {
      useStore.getState().syncAgentsState()
    }, 2000)
    return () => clearInterval(syncInterval)
  }, [])

  // Poll Jira for new tickets
  useEffect(() => {
    const poll = async () => {
      try {
        const jql = `project = ${PROJECT_KEY} AND status = "${STATUS_COLUMN}" ORDER BY rank ASC`
        const result = await jira.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
          jql,
          fields: ['key', 'summary', 'description', 'labels'],
          maxResults: 50
        })

        for (const issue of result.issues || []) {
          const fields = issue.fields as { summary?: string; labels?: string[] }
          const summary = fields.summary || 'No summary'
          const labels = fields.labels || []
          const model = parseModelFromLabels(labels)
          const thinking = hasThinking(labels)
          const agentMode = parseAgentMode(labels)
          const workflow = parseWorkflow(labels)
          addAgent(issue.key, summary, model, thinking, agentMode, workflow)
        }

        // Check for done tickets
        const { agents, updateAgent } = useStore.getState()
        const activeIds = agents.filter(a => a.status !== 'queued').map(a => a.id)
        if (activeIds.length > 0) {
          const doneJql = `key in (${activeIds.join(',')}) AND status = "${DONE_COLUMN}"`
          const doneResult = await jira.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
            jql: doneJql,
            fields: ['key'],
            maxResults: 50
          })
          for (const issue of doneResult.issues || []) {
            updateAgent(issue.key, 'idle')
          }
        }
      } catch (err) {
        // Silent fail
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [addAgent])
}
