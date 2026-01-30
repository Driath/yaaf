---
name: start
description: Read TODO.md and suggest the best next task or workflow
---

# start

Entry point for new sessions. Reads TODO.md and suggests the most relevant next task.

## Usage

```
/start
```

No arguments.

## Instructions

### 1. Read TODO.md

Read `TODO.md` and identify:
- Unchecked tasks `- [ ]`
- Group by section

### 2. Select Best Task

Priority:
1. **First unchecked task** in "In Progress" section
2. **First unchecked task** in any other section
3. **Fallback**: "All clear! What would you like to work on?"

### 3. Present Suggestion (HITL)

Use AskUserQuestion:

```
Suggested: {task description}

Options:
- "Start this task" (Recommended)
- "Show all pending tasks"
- "Something else"
```

### 4. Act on Choice

- **Start this task** → Begin immediately
- **Show all pending** → List all unchecked tasks, re-prompt
- **Something else** → Ask what they want

## Output

```
---
✅ start completed

## Actions
- Loaded: TODO.md ({X} pending tasks)
- Suggested: {task}

## Result
Starting: {chosen task}
---
```

## Error Handling

- **No TODO.md** → "No TODO.md found. What would you like to work on?"
- **All tasks done** → "All clear! What's next?"
