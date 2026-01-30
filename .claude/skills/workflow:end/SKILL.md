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

No arguments - uses conversation context.

## Instructions

### 1. Update TODO.md

- Read `TODO.md`
- Match completed work to items → mark as `[x]`
- Add discovered tasks as new `[ ]` items under appropriate section
- If no clear match, ask user what to mark done

### 2. Find Next Task

1. Parse TODO.md for first `- [ ]` item
2. If none → read `ia/my-work.md`
3. If nothing → "All clear!"

### 3. Present Handoff (HITL)

Use AskUserQuestion with options:

- "/clear puis /start" (recommandé) - Context propre
- "Continuer ici" - Garder le contexte actuel

Wait for user choice before proceeding.

### 4. Output

Follow `/skill:format:out`:

```
---
✅ workflow:end completed

## Summary
- Workflow: {workflow}

## Actions
- Updated TODO.md: marked {X} done, added {Y} new
- Next task: {task description or "none"}

## Handoff
{User choice: "/clear puis /start" or "Continuer ici"}
---
```

## Error Handling

- **No TODO.md** → Create one with discovered tasks
- **No tasks to mark done** → Skip update, proceed to next task
