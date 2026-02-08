import { Version3Client } from 'jira.js'
import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

export interface DispatchatorConfig {
  jira: {
    queries: string[]
    doneColumn: string
    maxResults: number
    fields: string[]
  }
  polling: {
    jiraInterval: number
    syncInterval: number
  }
  agents: {
    maxConcurrent: number
    defaultModel: 'small' | 'medium' | 'strong'
    defaultWorkflow: string
    claudePath: 'auto' | string
  }
}

export function defineConfig(config: DispatchatorConfig): DispatchatorConfig {
  return config
}

let cached: DispatchatorConfig | null = null

export function getConfig(): DispatchatorConfig {
  if (cached) return cached

  const configPath = join(process.cwd(), 'dispatchator.config.ts')

  if (existsSync(configPath)) {
    try {
      const mod = require(configPath)
      cached = mod.default || mod
    } catch {
      cached = buildFallbackConfig()
    }
  } else {
    cached = buildFallbackConfig()
  }

  return cached!
}

function buildFallbackConfig(): DispatchatorConfig {
  return {
    jira: {
      queries: [
        'project = KAN AND status = "Agent-Ready" ORDER BY rank ASC',
      ],
      doneColumn: 'Done',
      maxResults: 50,
      fields: ['key', 'summary', 'description', 'labels'],
    },
    polling: {
      jiraInterval: 10_000,
      syncInterval: 2_000,
    },
    agents: {
      maxConcurrent: 1,
      defaultModel: 'small',
      defaultWorkflow: 'intent',
      claudePath: 'auto',
    },
  }
}

export function buildDoneJql(doneColumn: string, activeIds: string[]): string {
  return `key in (${activeIds.join(',')}) AND status = "${doneColumn}"`
}

export function createJiraClient(): Version3Client {
  return new Version3Client({
    host: `https://${process.env.JIRA_SITE}`,
    authentication: {
      basic: {
        email: process.env.JIRA_EMAIL!,
        apiToken: process.env.JIRA_TOKEN!,
      },
    },
  })
}

export function resolveClaudePath(claudePath: 'auto' | string): string {
  if (claudePath !== 'auto') return claudePath
  const result = spawnSync('which', ['claude'])
  if (result.status === 0) return result.stdout.toString().trim()
  throw new Error('Could not find claude CLI. Set agents.claudePath in dispatchator.config.ts')
}
