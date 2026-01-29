---
name: session
description: Deterministic scripts for workflow session state management
---

# session

Lightweight scripts to manage workflow session state. Not invoked directly - used by `workflow:*` skills.

## Scripts

All scripts are in `.claude/skills/session/scripts/`.

### get.ts

Get session state for a workflow.

```bash
# Get specific workflow
bun run .claude/skills/session/scripts/get.ts workflow:pr
# → {"step":"git:pr:monitor","context":{"pr_number":8},...}
# → null if no session

# Get all active sessions
bun run .claude/skills/session/scripts/get.ts --all
# → [{"workflow":"workflow:pr","step":"..."},...]
```

### set.ts

Create or update session state.

```bash
# Start a workflow
bun run .claude/skills/session/scripts/set.ts workflow:pr init

# Update step with context
bun run .claude/skills/session/scripts/set.ts workflow:pr git:pr:monitor '{"pr_number":8}'
```

### reset.ts

Delete session state (no archive).

```bash
bun run .claude/skills/session/scripts/reset.ts workflow:pr
```

### save.ts

Archive session to markdown and delete.

```bash
# Archive with default status (completed)
bun run .claude/skills/session/scripts/save.ts workflow:pr

# Archive with status and notes
bun run .claude/skills/session/scripts/save.ts workflow:pr --status=failed --notes="CI blocked"
```

## Storage

```
ia/state/sessions/
├── workflow:pr.json        # Active session
├── workflow:feature.json   # Active session
└── archives/
    └── 2025-01-29-workflow-pr-feat-xxx.md
```

## State Format

```json
{
  "started_at": "2025-01-29T15:00:00Z",
  "updated_at": "2025-01-29T15:05:00Z",
  "step": "git:pr:monitor",
  "steps": ["init", "git:pr:find", "git:pr:monitor"],
  "context": {
    "branch": "feat/workflow-start",
    "pr_number": 8
  }
}
```

## Usage by Workflows

**workflow (global rules):** Reference these scripts for session management.

**workflow:start:** Uses `get.ts --all` to detect interrupted workflows.

**workflow:end:** Uses `save.ts` (if archive) or `reset.ts` to cleanup.

**Any workflow:*:** Uses `set.ts` at step transitions.
