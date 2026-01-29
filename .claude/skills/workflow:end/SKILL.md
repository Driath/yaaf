---
name: workflow:end
description: Finalize workflow, update TODO.md, suggest next task with handoff options
---

# workflow:end

Finalize workflow execution and propose next steps.

## Usage

```
/workflow:end
```

No arguments - infers context from current session.

## Instructions

### 1. Analyze Session Context

- Read `ia/state/history.json` if available (last N entries)
- Identify what workflow/task was executed from conversation context
- Note any new tasks discovered during execution
- If no history and context unclear → ask user what was completed

### 2. Update TODO.md

- Read `TODO.md`
- Match completed work to items → mark as `[x]`
- Add discovered tasks as new `[ ]` items under appropriate section
- If no clear match, ask user what to mark done

### 3. Find Next Task

1. Parse TODO.md for first `- [ ]` item
2. If none → read `ia/my-work.md`
3. If nothing → "All clear!"

### 4. Present Handoff (HITL)

Use AskUserQuestion with options:

- "/clear puis /start" (recommandé) - Context propre
- "Continuer ici" - Garder le contexte actuel

Wait for user choice before proceeding.

### 5. Output

Follow `/skill:format:out`:

```
---
✅ workflow:end completed

## Actions
- Analyzed session: {workflow/task identified}
- Updated TODO.md: marked {X} done, added {Y} new
- Next task: {task description or "none"}

## Handoff
{User choice: "/clear puis /start" or "Continuer ici"}
---
```

## Error Handling

- **No TODO.md** → Create one with discovered tasks
- **No tasks to mark done** → Skip update, proceed to next task
- **History unavailable** → Rely on conversation context or ask user

## Dependencies

> Note: `ia/state/history.json` is not yet implemented. Until then, rely on conversation context to identify completed work.

Future: Every `skill:format:out` response should append to `ia/state/history.json` with format:
```json
[{"skill": "name", "timestamp": "ISO", "summary": "what was done", "status": "completed|failed"}]
```
