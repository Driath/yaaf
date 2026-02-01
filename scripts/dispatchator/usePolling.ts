import { useEffect } from 'react'
import { Version3Client } from 'jira.js'
import { useStore, type Model, type AgentMode } from './store'

// Parse model from Jira labels (IA:MODEL:*)
function parseModelFromLabels(labels: string[]): Model {
  for (const label of labels) {
    if (label === 'IA:MODEL:STRONG') return 'opus'
    if (label === 'IA:MODEL:MEDIUM') return 'sonnet'
    if (label === 'IA:MODEL:SMALL') return 'haiku'
  }
  return 'haiku' // default
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
  const updateAgent = useStore((s) => s.updateAgent)
  const agents = useStore((s) => s.agents)

  useEffect(() => {
    const poll = async () => {
      try {
        // Fetch ready tickets
        const jql = `project = ${PROJECT_KEY} AND status = "${STATUS_COLUMN}" ORDER BY rank ASC`
        const result = await jira.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
          jql,
          fields: ['key', 'summary', 'description', 'labels'],
          maxResults: 50
        })

        const issues = result.issues || []

        for (const issue of issues) {
          const fields = issue.fields as { summary?: string; labels?: string[] }
          const summary = fields.summary || 'No summary'
          const labels = fields.labels || []
          const model = parseModelFromLabels(labels)
          const thinking = hasThinking(labels)
          const agentMode = parseAgentMode(labels)
          addAgent(issue.key, summary, model, thinking, agentMode)
        }

        // Check for done tickets (only for active agents)
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
        // Silent fail for now
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [addAgent, updateAgent, agents])
}
