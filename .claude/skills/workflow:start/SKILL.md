---
name: workflow:start
description: Analyze TODO.md and history to suggest the best next task with context
---

# workflow:start

Entry point for new sessions. Analyzes pending work and recent history to suggest the most relevant next task.

## Usage

```
/start
```

No arguments - analyzes state files automatically.

## Instructions

### 1. Load State

Read in parallel:
- `TODO.md` - pending tasks
- `ia/state/history.json` - recent activity (if exists)
- `ia/my-work.md` - backlog (fallback)

### 2. Analyze Context

From history.json (if available):
- Identify last session's focus area
- Detect incomplete workflows
- Note recurring themes

From TODO.md:
- Group tasks by section/domain
- Identify blocked vs ready tasks
- Find tasks related to recent history

### 3. Select Best Task

Priority order:
1. **Incomplete workflow** - Resume interrupted work
2. **Related to recent work** - Continuity (same domain/skill)
3. **First ready task** - Default fallback
4. **Backlog item** - From `ia/my-work.md` if TODO empty

### 4. Present Suggestion (HITL)

Use AskUserQuestion:

```
Based on {context reasoning}:

Suggested: {task description}

Options:
- "Start this task" (Recommended)
- "Show all pending tasks"
- "Something else"
```

### 5. Act on Choice

- **Start this task** → Begin the suggested task immediately
- **Show all pending** → Display TODO.md summary, then re-prompt
- **Something else** → Ask what they want to work on

### 6. Output

Follow `/skill:format:out`:

```
---
✅ workflow:start completed

## Actions
- Loaded: TODO.md ({X} pending), history.json ({Y} entries)
- Analyzed: {context summary}
- Suggested: {task}

## Result
Starting: {chosen task}

## Notes
- {any relevant observations}
---
```

## State Files

| File | Purpose |
|------|---------|
| `TODO.md` | Primary task source |
| `ia/state/history.json` | Recent activity context |
| `ia/my-work.md` | Backlog fallback |

## Error Handling

- **No TODO.md** → Check `ia/my-work.md` → If empty: "No pending work. What would you like to do?"
- **No history.json** → Use TODO.md order only (no continuity suggestions)
- **All tasks done** → "All clear! What's next?"

## Examples

### With History Context
```
Last session: worked on skill:check improvements
TODO.md has: "Encourage E2E testing in notes" (skill:check section)

→ Suggests continuing skill:check work (continuity)
```

### Fresh Start
```
No history, TODO.md has multiple sections

→ Suggests first unchecked task
```

### Interrupted Workflow
```
History shows: workflow:pr started but no completion entry

→ Suggests resuming the PR workflow
```
