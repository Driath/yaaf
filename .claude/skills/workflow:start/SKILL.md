---
name: workflow:start
description: Analyze session state and TODO.md to suggest the best next task or resume interrupted workflow
---

# workflow:start

Entry point for new sessions. Checks for interrupted workflows and suggests the most relevant next task.

## Usage

```
/start
```

No arguments - analyzes state files automatically.

## Instructions

### 1. Check Session State (Priority)

Read `ia/state/session/current.json`:

**If exists → Interrupted workflow detected:**
```
⚠️ Workflow interrompu détecté

Workflow: {workflow}
Étape: {step}
Contexte: {context summary}
Démarré: {started_at}

Options:
- "Reprendre" (Recommandé) → Continue workflow at {step}
- "Abandonner" → Delete current.json, proceed to task selection
```

**If user chooses "Reprendre":**
- Invoke the workflow skill with resume context
- Pass stored context to skip completed steps

**If user chooses "Abandonner" or no current.json:**
- Proceed to step 2

### 2. Load Task State

Read in parallel:
- `TODO.md` - pending tasks
- `ia/my-work.md` - backlog (fallback)

### 3. Analyze Context

From recent sessions (`ia/state/sessions/*.md` - last 3):
- Identify patterns/themes
- Note what was worked on recently

From TODO.md:
- Group tasks by section/domain
- Identify blocked vs ready tasks

### 4. Select Best Task

Priority order:
1. **Related to recent sessions** - Continuity (same domain/skill)
2. **First ready task** - Default fallback
3. **Backlog item** - From `ia/my-work.md` if TODO empty

### 5. Present Suggestion (HITL)

Use AskUserQuestion:

```
{context reasoning if any}

Suggested: {task description}

Options:
- "Start this task" (Recommended)
- "Show all pending tasks"
- "Something else"
```

### 6. Act on Choice

- **Start this task** → Begin the suggested task immediately
- **Show all pending** → Display TODO.md summary, then re-prompt
- **Something else** → Ask what they want to work on

### 7. Output

Follow `/skill:format:out`:

```
---
✅ workflow:start completed

## Actions
- Session state: {resumed workflow | no interrupted workflow}
- Loaded: TODO.md ({X} pending)
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
| `ia/state/session/current.json` | Interrupted workflow (priority) |
| `ia/state/sessions/*.md` | Recent session archives (context) |
| `TODO.md` | Primary task source |
| `ia/my-work.md` | Backlog fallback |

## Error Handling

- **No current.json** → Normal, proceed to task selection
- **No TODO.md** → Check `ia/my-work.md` → If empty: "No pending work. What would you like to do?"
- **All tasks done** → "All clear! What's next?"

## Examples

### Interrupted Workflow
```
current.json exists:
  workflow: workflow:pr
  step: git:pr:monitor
  context: {pr_number: 8}

→ "Workflow interrompu: workflow:pr à l'étape git:pr:monitor. Reprendre ?"
→ User: "Reprendre"
→ Invokes /workflow:pr, skips to monitor step
```

### Fresh Start
```
No current.json, TODO.md has tasks

→ Suggests first unchecked task
```

### Continuity from Archives
```
Recent session: worked on skill improvements
TODO.md has skill-related task

→ Suggests skill task (continuity)
```
