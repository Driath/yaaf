---
name: session
description: Deterministic scripts for session logging and archival
---

# session

Lightweight scripts to log skill calls and archive sessions. Not invoked directly - used by agent/workflows.

## Scripts

All scripts are in `.claude/skills/session/scripts/`.

### log.ts

Append a skill call to the session log.

```bash
bun run .claude/skills/session/scripts/log.ts <skill> <calledBy> <response>

# Examples
bun run .claude/skills/session/scripts/log.ts workflow:pr agent "PR #8 created"
bun run .claude/skills/session/scripts/log.ts git:pr:find workflow:pr "Found PR #8"
```

### save.ts

Archive session log to markdown and clear.

```bash
# Archive with default status (completed)
bun run .claude/skills/session/scripts/save.ts

# Archive with status and notes
bun run .claude/skills/session/scripts/save.ts --status=failed --notes="CI blocked"
```

## Storage

```
ia/state/
├── session.json              # Current session log
└── sessions/
    └── 2025-01-29-1430-workflow-pr.md  # Archived sessions
```

## Session Log Format

`ia/state/session.json`:
```json
[
  {
    "skill": "workflow:pr",
    "calledBy": "agent",
    "timestamp": "2025-01-29T14:30:00Z",
    "response": "PR #8 created"
  },
  {
    "skill": "git:pr:find",
    "calledBy": "workflow:pr",
    "timestamp": "2025-01-29T14:30:05Z",
    "response": "Found PR #8"
  }
]
```

## Archive Format

`ia/state/sessions/*.md`:
```markdown
# workflow:pr - 2025-01-29

**Status:** completed
**Duration:** 5min
**Started:** 2025-01-29T14:30:00Z
**Ended:** 2025-01-29T14:35:00Z

## Skill Calls

| Skill | Called By | Response |
|-------|-----------|----------|
| workflow:pr | agent | PR #8 created |
| git:pr:find | workflow:pr | Found PR #8 |
```

## Usage

**On skill invocation:** Agent calls `log.ts` to record the call.

**On workflow:end:** Agent calls `save.ts` to archive and clear.
