---
name: code:implement
description: Execute a plan file to implement changes in any project
model: sonnet
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# code:implement

Execute a plan file to implement changes. Works with any project that has a CLAUDE.md file.

## Arguments

- `plan` (required): Path to plan file (e.g., `todos/plans/my-feature.md`)
- `path` (optional, default: `.`): Working directory

## Instructions

### 1. Resolve Working Directory

```bash
cd {path}  # default: current directory
```

### 2. Find and Merge CLAUDE.md Files

Collect ALL CLAUDE.md files from `path` up to git root:

```bash
# Get git root
git rev-parse --show-toplevel

# Collect all CLAUDE.md from path to root
# Example: /root/CLAUDE.md, /root/packages/CLAUDE.md, /root/packages/app/CLAUDE.md
```

**Merge order:** Root first, then progressively closer to `path`. Local conventions override global ones.

If any found → Read all and merge conventions.
If none found → Warn and proceed with generic conventions.

### 3. Read and Validate Plan

Read the plan file. Validate structure:

- Has frontmatter with `name`
- Has `## Plan` section with steps

If invalid → Error with specific issue.

### 4. Execute Plan Steps

Execute each step in the `## Plan` section in order:

- Follow the plan exactly
- Use paths relative to `path` argument
- Apply CLAUDE.md conventions
- Verify each step before moving to next

### 5. Commit Changes

Once implementation is complete:

```bash
git add -A
git status
git commit -m "{plan-name}: {short-summary}

{brief-description}"
```

**Commit message format:**
- First line: `{plan-name}: {summary}` (from frontmatter name)
- Body: Brief description of what was done
- Follow CLAUDE.md commit conventions if specified

## Output

Follow `/skill:format:out`

## Error Handling

- **Plan file not found** → Error with path
- **Invalid plan structure** → Error with what's missing
- **No CLAUDE.md** → Warn, continue with generic conventions
- **Compilation errors** → Fix and retry
- **Plan unclear** → Ask user
