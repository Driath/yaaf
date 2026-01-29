---
name: code:implement
description: Implement a work item according to its technical plan
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# code:implement

Implement a work item by following its technical implementation plan.

## Arguments
- project (e.g., "DGD")  
- key (e.g., "KAN-4")

## Instructions

### 1. Verify Prerequisites

```bash
# Check worktree exists
test -d worktrees/{project}-{key}

# Get implementation plan
bun plans/get.ts project={project} key={key}
```

If missing:
- No worktree → Suggest `/git:worktree:add {project} {key}`
- No plan → Suggest `/code:plan {project} {key}`

### 2. Navigate to Worktree

**IMPORTANT:** All work happens in the worktree directory.

```bash
cd worktrees/{project}-{key}
```

All subsequent commands (Read, Write, Edit, Bash) are relative to this directory.

### 3. Follow Implementation Plan

The plan contains step-by-step instructions. Execute them in order:

**Example from plan:**
- Phase 1: Install dependencies (npx commands, npm install)
- Phase 2: Create files (components, pages)
- Phase 3: Modify existing files (layout, config)

Follow the plan exactly:
- Use exact file paths from plan
- Copy code snippets as-is
- Run installation commands
- Verify each step before moving to next

### 4. Commit Changes

Once implementation is complete:

```bash
git add .
git status
git commit -m "{key}: {short-summary}

{brief-description}"
```

**Commit message format:**
- First line: `{KEY}: {summary}` (e.g., "KAN-4: Add shadcn sidebar")
- Body: Brief description of what was done
- **No co-author line**

### 5. HITL: Review

Present to user:
```
✅ Implementation complete

📝 Files created/modified:
- {list}

💬 Commit:
{commit message}

📂 Worktree: worktrees/{project}-{key}/
🌿 Branch: feature/{key}

Next: /git:create-pr {project} {key}
```

User can:
- Approve → Ready for PR
- Request changes → Iterate
- Test manually: `cd worktrees/{project}-{key} && npm run dev`

## Success Criteria

- All files from plan created/modified
- Code compiles (no errors)
- Changes committed
- User approved

## Error Handling

- Compilation errors → Fix and retry
- Missing dependencies → Install
- Plan unclear → Ask user

## Notes

- Work entirely in worktree
- Follow plan exactly
- Don't add extra features
- Use project conventions
- Commit clean, working code
