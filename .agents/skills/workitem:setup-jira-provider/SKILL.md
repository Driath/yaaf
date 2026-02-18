---
name: workitem:setup-jira-provider
description: Interactive setup for configuring a Jira project as a yaaf work item provider. Creates statuses, guides board configuration, and generates dispatchator.config.ts.
compatibility: Designed for Claude Code and Gemini CLI with access to bun and scripts/jira/
---

# workitem:setup-jira-provider

Guides the user through configuring a Jira project for use with the dispatchator.

## Required statuses

| Status | Category | Role |
|--------|----------|------|
| `Brouillon` | TODO | Draft — not ready to spawn |
| `À faire` | TODO | Ready — dispatchator spawns agent |
| `Human-needed` | IN_PROGRESS | Blocked — agent waiting for human input |
| `Terminé` | DONE | Done |

## Step 1: Collect project info

Ask the user for the Jira project key (e.g. `WIA`).

## Step 2: Verify project type (CRITICAL)

```bash
bun scripts/jira/get-project-statuses.ts <PROJECT-KEY>
```

Also check project style:

```bash
bun scripts/jira/get-issue.ts <PROJECT-KEY>-1  # or use project API
```

**The project MUST be `next-gen` (team-managed / simplified: true).**

If it's `classic` (company-managed), statuses cannot be created via API. Tell the user:

> Your project is company-managed. Custom statuses require a team-managed project.
> Please create a new project at https://<site>.atlassian.net/jira/projects/create
> Choose **Kanban** and make sure it's **team-managed** (not company-managed).
> Come back with the new project key when done.

## Step 3: Get project ID

```bash
bun -e "
const { Version3Client } = await import('jira.js');
const client = new Version3Client({
  host: 'https://' + process.env.JIRA_SITE,
  authentication: { basic: { email: process.env.JIRA_EMAIL, apiToken: process.env.JIRA_TOKEN } }
});
const p = await client.projects.getProject({ projectIdOrKey: '<PROJECT-KEY>' });
console.log(p.id);
"
```

## Step 4: Create missing statuses via API

Compare existing statuses (from Step 2) against required ones. For each missing status:

```bash
bun -e "
const { Version3Client } = await import('jira.js');
const client = new Version3Client({
  host: 'https://' + process.env.JIRA_SITE,
  authentication: { basic: { email: process.env.JIRA_EMAIL, apiToken: process.env.JIRA_TOKEN } }
});
const result = await client.status.createStatuses({
  scope: { type: 'PROJECT', project: { id: '<PROJECT-ID>' } },
  statuses: [
    { name: 'Brouillon', statusCategory: 'TODO' },
    { name: 'Human-needed', statusCategory: 'IN_PROGRESS' },
    // Add 'À faire' and 'Terminé' only if missing
  ]
});
console.log(JSON.stringify(result, null, 2));
"
```

Note: `À faire` and `Terminé` usually exist by default in next-gen projects.

## Step 5: Add statuses to board (HITL)

Newly created statuses are not automatically added to the workflow. Tell the user:

> Go to: https://<site>.atlassian.net/jira/software/projects/<PROJECT-KEY>/boards
> Click **"Manage workflow"** → add the new statuses (`Brouillon`, `Human-needed`) to the board columns.
> Reorder columns: Brouillon → À faire → Human-needed → Terminé
> Come back when done.

## Step 6: Verify

```bash
bun scripts/jira/get-project-statuses.ts <PROJECT-KEY>
```

Confirm all 4 statuses are present.

## Step 7: Generate dispatchator.config.ts

Show the user this config and ask for confirmation before writing:

```ts
import { defineConfig } from './apps/dispatchator/config'

export default defineConfig({
  workItems: [
    {
      provider: 'jira',
      providerConfig: {
        site: process.env.JIRA_SITE ?? '',
        email: process.env.JIRA_EMAIL ?? '',
        token: process.env.JIRA_TOKEN ?? '',
      },
      project: '<PROJECT-KEY>',
      excludeStatuses: {
        draft: 'Brouillon',
        done: 'Terminé',
      },
      spawnStatus: 'À faire',
      maxResults: 50,
      fields: ['key', 'summary', 'description', 'labels', 'parent'],
    },
  ],
  polling: {
    jiraInterval: 10_000,
    syncInterval: 2_000,
  },
  agents: {
    maxConcurrent: 2,
    defaultModel: 'small',
    defaultWorkflow: 'intent',
    defaultProvider: 'claude',
    providerPaths: { claude: 'auto', gemini: 'auto' },
  },
})
```

Once confirmed, write to `dispatchator.config.ts`.

## Step 8: Summary

```
✅ Project: <PROJECT-KEY> (next-gen)
✅ Statuses: Brouillon, À faire, Human-needed, Terminé
✅ Board configured
✅ dispatchator.config.ts written
```
