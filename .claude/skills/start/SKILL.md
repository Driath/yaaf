---
name: start
description: Scan todos/plans/ and suggest the best next task with its implementation plan
---

# start

Entry point for new sessions. Scans `todos/plans/` and suggests the most relevant todo with its full implementation plan.

## Usage

```
/start
```

No arguments.

## Instructions

### 1. Scan todos/plans/

List all `.md` files in `todos/plans/` (excluding `.gitkeep`).

For each file, extract frontmatter:
- `name`: The todo slug
- `status`: pending | in-progress | completed
- `created`: Creation date

Filter to `status: pending` only.

### 2. Select Best Todo

Priority:
1. **First todo** with `status: in-progress`
2. **Oldest pending todo** (by created date)
3. **Fallback**: "All clear! What would you like to work on?"

### 3. Present Suggestion (HITL)

Read the selected todo file to get its full content.

Use AskUserQuestion:

```
Suggested: {todo name}

{Brief summary from ## Context section}

Options:
- "Start this todo" (Recommended)
- "Show all pending todos"
- "Create new todo"
- "Something else"
```

### 4. Act on Choice

- **Start this todo** → Display the full plan, execute it, then delete the plan file
- **Show all pending** → List all pending todos with names and dates, re-prompt
- **Create new todo** → Ask for subject, then invoke `/todos:add`
- **Something else** → Ask what they want

### 5. Execute and Cleanup

When user chooses "Start this todo":

1. Display the full plan from the todo file
2. Execute each step in the plan
3. After successful completion, **delete the plan file** (`rm todos/plans/{name}.md`)

## Output

```
---
✅ start completed

## Actions
- Scanned: todos/plans/ ({X} pending todos)
- Selected: {todo name}

## Result
Starting: {todo name}

## Plan
{Full plan content from todo file}
---
```

## Error Handling

- **No todos/plans/ directory** → "No todos found. Run `/todos:add \"subject\"` to create one."
- **No pending todos** → "All clear! Run `/todos:add \"subject\"` to create a new todo."
- **Malformed todo file** → Skip and note in output
