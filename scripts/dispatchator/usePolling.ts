import { useEffect } from 'react'
import { Version3Client } from 'jira.js'
import { useStore } from './store'

const POLL_INTERVAL = 10_000 // 10s
const JIRA_HOST = `https://${process.env.DGD_WORK_ITEM_SITE}`
const PROJECT_KEY = process.env.WI_PROJECT_KEY || 'KAN'
const STATUS_COLUMN = process.env.WI_COLUMN || 'Agent-Ready'

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

  useEffect(() => {
    const poll = async () => {
      try {
        const jql = `project = ${PROJECT_KEY} AND status = "${STATUS_COLUMN}"`
        const result = await jira.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
          jql,
          fields: ['key', 'summary', 'description'],
          maxResults: 50
        })

        const issues = result.issues || []

        for (const issue of issues) {
          const summary = (issue.fields as { summary?: string }).summary || 'No summary'
          addAgent(issue.key, summary)
        }
      } catch (err) {
        // Silent fail for now
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [addAgent])
}
