import { useEffect } from 'react'
import { useStore, type Model, type AgentMode } from './store'
import { getConfig, buildDoneJql, createJiraClient } from './config'

function parseModelFromLabels(labels: string[]): Model {
  for (const label of labels) {
    if (label === 'IA:MODEL:STRONG') return 'strong'
    if (label === 'IA:MODEL:MEDIUM') return 'medium'
    if (label === 'IA:MODEL:SMALL') return 'small'
  }
  return getConfig().agents.defaultModel
}

function hasThinking(labels: string[]): boolean {
  return labels.includes('IA:CAP:THINK')
}

function parseAgentMode(labels: string[]): AgentMode {
  if (labels.includes('IA:AGENT:PLAN')) return 'plan'
  return 'default'
}

function parseWorkflow(labels: string[]): string {
  for (const label of labels) {
    if (label.startsWith('IA:WORKFLOW:')) {
      return label.replace('IA:WORKFLOW:', '').toLowerCase().replace(/_/g, '-')
    }
  }
  return getConfig().agents.defaultWorkflow
}

const jira = createJiraClient()

export function usePolling() {
  const addAgent = useStore((s) => s.addAgent)
  const config = getConfig()

  useEffect(() => {
    const syncInterval = setInterval(() => {
      useStore.getState().syncAgentsState()
    }, config.polling.syncInterval)
    return () => clearInterval(syncInterval)
  }, [])

  useEffect(() => {
    const poll = async () => {
      try {
        for (const jql of config.jira.queries) {
          const result = await jira.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
            jql,
            fields: config.jira.fields,
            maxResults: config.jira.maxResults,
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
        }

        const { agents, updateAgent } = useStore.getState()
        const activeIds = agents.filter(a => a.status !== 'queued').map(a => a.id)
        if (activeIds.length > 0) {
          const doneJql = buildDoneJql(config.jira.doneColumn, activeIds)
          const doneResult = await jira.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
            jql: doneJql,
            fields: ['key'],
            maxResults: config.jira.maxResults,
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
    const interval = setInterval(poll, config.polling.jiraInterval)
    return () => clearInterval(interval)
  }, [addAgent])
}
