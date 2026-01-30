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

No arguments - infers context from session state.

## Instructions

### 1. Read Session State

Read `ia/state/sessions/{workflow}.json`:
- Extract workflow name, step, context, `started_at`
- If not exists → rely on conversation context or ask user

**Calculate duration:**
```
started_at → now
Format: Xh Ym (e.g., "1h 23m" or "45m" if under 1 hour)
```

### 2. Archive Session (HITL)

Propose archiving the session:

```
Session: {workflow} completed
Duration: {Xh Ym} (calculated from started_at)
Context: {summary of context}

Archiver cette session ?
- Oui → génère ia/state/sessions/{date}-{workflow}-{context}.md
- Non → supprime current.json sans archiver
```

**Archive format** (`ia/state/sessions/{name}.md`):
```markdown
# {workflow} - {date}

## Context
- Branch: {branch}
- PR: #{number}
- Duration: {duration}

## Steps Executed
1. {step1} - {status}
2. {step2} - {status}
...

## Result
{outcome summary}

## Notes
{any observations}
```

### 3. Clear Session State

Delete `ia/state/sessions/{workflow}.json`

### 4. Update TODO.md

- Read `TODO.md`
- Match completed work to items → mark as `[x]`
- Add discovered tasks as new `[ ]` items under appropriate section
- If no clear match, ask user what to mark done

### 5. Find Next Task

1. Parse TODO.md for first `- [ ]` item
2. If none → read `ia/my-work.md`
3. If nothing → "All clear!"

### 6. Present Handoff (HITL)

Use AskUserQuestion with options:

- "/clear puis /start" (recommandé) - Context propre
- "Continuer ici" - Garder le contexte actuel

Wait for user choice before proceeding.

### 7. Output

Follow `/skill:format:out`:

```
---
✅ workflow:end completed

## Summary
- Workflow: {workflow}
- Duration: {Xh Ym}
- Session: archived to {path} / cleared

## Actions
- Updated TODO.md: marked {X} done, added {Y} new
- Next task: {task description or "none"}

## Handoff
{User choice: "/clear puis /start" or "Continuer ici"}
---
```

## Error Handling

- **No {workflow}.json** → Rely on conversation context or ask user
- **No TODO.md** → Create one with discovered tasks
- **No tasks to mark done** → Skip update, proceed to next task
