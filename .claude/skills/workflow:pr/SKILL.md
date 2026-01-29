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
- `base` (optional): Base branch. Default: from context or `main`

## Context Required

From `ia/context.md`:
- `git.provider`: github | gitlab | azure
- `git.base_branch` (optional): Default base for PRs (e.g., `develop` for gitflow)
- `git.branch_strategy` (optional): github-flow | gitflow | trunk-based

## Instructions

### 1. Load Context

1. Read `ia/context.md` → workspace config (git provider, projects)
2. Extract `git.base_branch` if present → use as default for `base` parameter
3. For each sub-skill, check if `ia/skills/{skill-name}/instructions.md` exists:
   - If yes → Load and pass as additional context to sub-skill

### 2. Verify Prerequisites

```bash
# Check we're in a git repo
git rev-parse --is-inside-work-tree

# Get current branch
git branch --show-current

# Check we have commits ahead of base
git log origin/{base}..HEAD --oneline
```

**Important:** This workflow does NOT commit changes. It works with existing commits only.
- If uncommitted changes → Warn: "⚠️ Uncommitted changes detected (ignored)" and continue
- If no commits ahead of base → Error: "Nothing to push, commit first"
- If on main/master with no feature branch → Error: "Create a feature branch first"

### 3. Check for Existing PR

Execute `/git:pr:find`

If PR exists → Skip to step 4

### 4. Create PR

Execute `/git:pr:create title="{title}" base="{base}"` with additional context from `ia/skills/git:pr:create/instructions.md` if loaded.

### 5. Monitor PR

Execute `/git:pr:monitor` to poll until PR is mergeable (CI passes, reviews approved, no conflicts).

Note: `/git:pr:monitor` calls `/git:pr:status` internally at each poll iteration.

### 6. Output

Aggregate outputs from sub-skills following `/skill:format:out`:

```
---
✅ workflow:pr completed

## Actions
- {from git:pr:find}
- {from git:pr:create}
- {from git:pr:monitor}

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
- **No commits ahead** → "Nothing to push, commit first"
- **On main/master** → "Create a feature branch first"
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
| `git:pr:monitor` | Poll until mergeable (calls `git:pr:status` internally) |
