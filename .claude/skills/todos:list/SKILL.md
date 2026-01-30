---
name: todos:list
description: List all todos from todos/plans/ with status and creation date
---

# todos:list

Lists all todos stored in `todos/plans/` directory.

## Usage

```
/todos:list
/todos:list --status pending
/todos:list --status all
```

**Options:**
- `--status pending` (default): Show only pending todos
- `--status all`: Show all todos including completed

## Instructions

### 1. Scan Directory

List all `.md` files in `todos/plans/` (excluding `.gitkeep`).

If directory is empty or doesn't exist, report "No todos found."

### 2. Parse Each File

For each file, extract frontmatter:
- `name`: The todo slug
- `status`: pending | in-progress | completed
- `created`: Creation date

### 3. Filter by Status

Apply status filter (default: pending only).

### 4. Display List

Format as table:

```
| # | Name                  | Status    | Created    |
|---|----------------------|-----------|------------|
| 1 | add-user-auth        | pending   | 2026-01-30 |
| 2 | refactor-statusline  | pending   | 2026-01-29 |
```

Sort by created date (newest first).

### 5. Output

Per `/skill:format:out`:

```
---
✅ todos:list completed

## Actions
- Scanned: todos/plans/
- Found: {N} todos ({M} pending)

## Result
{table}

## Notes
- Run `/start` to work on a todo
- Run `/todos:add "subject"` to create new
- Run `/todos:done {name}` to complete
---
```

## Error Handling

- **Directory missing** → "No todos directory. Run `/todos:add` to create your first todo."
- **No files** → "No todos found. Run `/todos:add` to create one."
- **Malformed frontmatter** → Skip file, note in output
