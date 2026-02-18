# yaaf - Yet Another Agent Framework

Agent skills framework for Gemini CLI.

## Naming Conventions

Skills follow naming conventions that **require** loading base rules:

- `workflow:*` → **MUST** load `.gemini/skills/workflow/SKILL.md` BEFORE execution
- `skill:*` → **MUST** load `.gemini/skills/skill/SKILL.md` BEFORE execution

**Not optional.** Read the base skill first, then execute the specific skill.

## Security Rules (always apply)

Actions requiring EXPLICIT confirmation (HITL):

- `--admin`, `--force`, `--no-verify` flags
- Destructive git operations (`reset --hard`, `push --force`, `clean -f`)
- Bypassing protections (branch rules, CI checks)
- Deleting branches or files in bulk
- Any override of safety mechanisms

**Never assume approval.** Ask, wait, then act.

## Code Quality

- No unnecessary comments - code should be self-documenting

## Project Structure

- `.gemini/skills/` — skill definitions (Markdown)
- `.agents/` — generic agent skills (provider-agnostic)
- `apps/` — TypeScript applications
  - `dispatchator/` — orchestrator (TypeScript/Ink)
- `scripts/` — reusable CLI utilities
- `ia/` — instance-specific runtime state (gitignored)
- `todos/plans/` — plan-based task management

## Work Item Provider

Provider: **Jira** (via `scripts/jira/`)

Skills MUST use these commands for work item operations — never call APIs directly.

| Action | Command |
|--------|---------|
| Fetch | `bun scripts/jira/get-issue.ts <KEY> [--fields=...]` |
| Search | `bun scripts/jira/search-issues.ts "<jql>" [--max=50] [--fields=...]` |
| Create | `bun scripts/jira/create-issue.ts <project> <type> <summary> [--description=...] [--labels=...] [--parent=...]` |
| Update | `bun scripts/jira/update-issue.ts <KEY> [--summary=...] [--description=...] [--labels=...] [--priority=...]` |
| Transition | `bun scripts/jira/transition-issue.ts <KEY> [transition-id]` — without ID: lists available transitions; with ID: applies transition |
| Comment | `bun scripts/jira/add-comment.ts <KEY> <text \| ->` |
| Link | `bun scripts/jira/link-issues.ts <key1> <key2> <link-type>` |

All scripts output JSON. Use `-` to read content from stdin.
