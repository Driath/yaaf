---
name: workflow:pr
description: Create a PR and check if it's mergeable (CI, approvals, conflicts). Orchestrates git:pr:* skills.
---

# workflow:pr

Orchestrator that creates a Pull Request and checks its mergeable status.

## Usage

```
/workflow:pr [title="PR title"] [base="main"]
```

## Arguments

- `title` (optional): PR title. If not provided, derives from branch name or commits.
- `base` (optional): Base branch. Default: `main`

## Context Required

From `ia/context.md`:
- `git.provider`: github | gitlab | azure

## Instructions

### 1. Load Context

Read `ia/context.md` to get git provider configuration.

### 2. Verify Prerequisites

```bash
# Check we're in a git repo
git rev-parse --is-inside-work-tree

# Get current branch
git branch --show-current

# Check we have commits ahead of base
git log origin/{base}..HEAD --oneline
```

If no commits ahead → Error: "Nothing to push"
If on main/master → Error: "Cannot create PR from main branch"

### 3. Check for Existing PR

Execute `/git:pr:find`

If PR exists → Skip to step 5

### 4. Create PR

Execute `/git:pr:create title="{title}" base="{base}"`

### 5. Check PR Status

Execute `/git:pr:status`

### 6. Output

Aggregate outputs from sub-skills following `/skill:format:out`:

```
---
✅ workflow:pr completed

## Actions
- {from git:pr:find}
- {from git:pr:create}
- {from git:pr:status}

## Result

PR #{number}: {url}

| Check | Status |
|-------|--------|
| CI | ✅ Passing / ⏳ Pending / ❌ Failing |
| Reviews | ✅ Approved / ⏳ Pending / ❌ Changes requested |
| Conflicts | ✅ None / ❌ Has conflicts |
| Mergeable | ✅ Ready / ❌ Blocked |

## Corrections
- {aggregated from sub-skills}

## Notes
- {aggregated from sub-skills}
---
```

## Error Handling

- **No git repo** → Error with clear message
- **No commits** → "Nothing to push, make some commits first"
- **On main branch** → "Create a feature branch first"
- **Sub-skill fails** → Surface error from sub-skill

## Examples

```bash
# Simple - auto title from branch
/workflow:pr

# With custom title
/workflow:pr title="feat: Add user authentication"

# Different base branch
/workflow:pr base="develop"
```

## Sub-skills Used

| Skill | Purpose |
|-------|---------|
| `git:pr:find` | Find existing PR for current branch |
| `git:pr:create` | Create new PR if none exists |
| `git:pr:status` | Check CI, reviews, conflicts |
