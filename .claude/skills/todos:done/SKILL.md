---
name: todos:done
description: Mark a todo as completed by archiving or deleting it
---

# todos:done

Completes a todo by moving it to archive or deleting it.

## Usage

```
/todos:done add-user-auth
/todos:done add-user-auth --delete
```

**Arguments:**
- `name` (required): The todo slug (filename without .md)

**Options:**
- `--delete`: Permanently delete instead of archive (default: archive)

## Instructions

### 1. Parse Input

Extract the todo name from argument. If not provided, use AskUserQuestion with list of pending todos.

### 2. Find Todo File

Look for `todos/plans/{name}.md`.

If not found:
- Try fuzzy match (partial name)
- If multiple matches, ask user to clarify
- If no matches, report error

### 3. Confirm Action (HITL)

Use AskUserQuestion:

```
Complete todo: {name}

Options:
- "Archive" (Recommended) - Move to todos/archive/
- "Delete" - Permanently remove
- "Cancel"
```

Skip if `--delete` flag provided.

### 4. Execute

**Archive (default):**
1. Create `todos/archive/` if needed
2. Update frontmatter: `status: completed`, add `completed: {date}`
3. Move file to `todos/archive/{name}.md`

**Delete:**
1. Remove `todos/plans/{name}.md`

### 5. Output

Per `/skill:format:out`:

```
---
✅ todos:done completed

## Actions
- {Archived | Deleted}: {name}
- Location: {todos/archive/{name}.md | removed}

## Result
Todo "{name}" marked as done.
{N} todos remaining.
---
```

## Error Handling

- **No name provided** → List pending todos via AskUserQuestion
- **File not found** → "Todo '{name}' not found. Run `/todos:list` to see available."
- **Multiple matches** → Ask user to clarify which one
