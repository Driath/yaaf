---
name: workflow:discover-project
description: Explore a linked project, analyze its structure and stack, post a discovery report.
model: haiku
agent: workflow
---

# workflow:discover-project

Explores a project linked in `projects/` and produces a structured discovery report.

## Input

| Param | Source | Description |
|-------|--------|-------------|
| workItemId | argument | Jira ticket ID (e.g., KAN-30) |
| projectName | `IA:PROJECT:*` label | Project identifier matching `projects/{projectName}` |

## Step 1: Fetch Ticket & Resolve Project Path

```
1. Fetch {workItemId} (summary, description, labels) using work item provider (see CLAUDE.md)
2. Extract projectName from label IA:PROJECT:*
3. If no IA:PROJECT:* label → HITL: ask user to select project
4. Resolve absolute path: Bash(readlink projects/{projectName})
```

The `readlink` command is pre-authorized. The resolved absolute path is used for ALL file operations in subsequent steps.

## Step 2: Explore Project

Using the resolved absolute path, read files with dedicated tools (Read, Glob, Grep — NOT Bash):

- Read README.md, CLAUDE.md, package.json, or equivalent entry points
- Identify stack (language, framework, dependencies)
- Use `Glob("{absolutePath}/*")` to map top-level directory structure
- Identify conventions (linting, testing, CI) via config files
- Note any existing documentation or architecture docs

## Step 3: Post Discovery Report

Post a comment on `{workItemId}` (use work item provider commands from CLAUDE.md):

```
## workflow:discover-project report

### Project: {projectName}
- **Path**: {absolutePath}
- **Stack**: {language} / {framework}
- **Build**: {build tool}
- **Test**: {test framework}

### Structure
{top-level directory listing with descriptions}

### Key Files
{notable config/entry points}

### Conventions
{linting, formatting, naming patterns}

### Timestamp
{ISO 8601}
```

## Step 4: Transition to En cours de revue

Transition `{workItemId}` to **En cours de revue** using work item provider (see CLAUDE.md).

## Done

The comment posted in Step 3 sets `commentCount > 0`, preventing re-spawn.
