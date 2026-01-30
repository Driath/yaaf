---
name: git:pr:comments:process
description: Execute TODO.md tasks - apply fixes, post replies, resolve comments
model: haiku
---

# git:pr:comments:process

Read TODO.md and execute each task. No decision-making - just follow the plan.

## Usage

```
/git:pr:comments:process
```

## Context Required

- `/ia/state/{branch}/pr/TODO.md` must exist

## Instructions

### 1. Read TODO.md

```bash
cat /ia/state/{branch}/pr/TODO.md
```

Parse tasks list.

### 2. Execute Each Task

For each unchecked task:

**FIX tasks:**
```
- [ ] FIX #1: Rename `x` to `userId` in src/foo.ts:42
```
→ Read the file
→ Apply the fix exactly as described
→ Mark as done: `- [x] FIX #1: ...`

**REPLY tasks:**
```
- [ ] REPLY #2: "Pour isoler la logique métier"
```
→ Post reply via gh CLI:
```bash
gh pr comment {pr.number} --body "Pour isoler la logique métier"
```
→ Mark as done: `- [x] REPLY #2: ...`

**SKIP tasks:**
```
- [ ] SKIP #4
```
→ Do nothing, mark as done: `- [x] SKIP #4`

### 3. Update TODO.md

After each task, update the file:
- Move completed task to `## Done` section
- Keep `## Tasks` for remaining

### 4. Output

```
---
✅ git:pr:comments:process completed

## Actions
- Processed {n} tasks
- Fixes: {n}
- Replies: {n}
- Skipped: {n}

## Result
| Task | Status |
|------|--------|
| FIX #1: Rename x to userId | ✅ |
| REPLY #2 | ✅ |
| FIX #3: Add null check | ✅ |
| SKIP #4 | ✅ |

## Files Modified
- src/foo.ts
- src/bar.ts

## Notes
- (any issues encountered)
---
```

## Error Handling

- **TODO.md not found** → Error: "No TODO.md found"
- **File not found** → Error: "Cannot find {file} for FIX #{n}"
- **gh CLI error** → Error: "Failed to post reply for #{n}"

## Important

- **No interpretation** - execute exactly what TODO.md says
- **No skipping** - process every task
- **No decisions** - if unclear, error out
