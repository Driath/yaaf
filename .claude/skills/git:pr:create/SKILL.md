---
name: git:pr:create
description: Create a PR/MR for current branch. Provider-agnostic (GitHub, GitLab, Azure).
---

# git:pr:create

Create a Pull Request / Merge Request for the current branch.

## Usage

```
/git:pr:create [title="PR title"] [base="main"]
```

## Arguments

- `title` (optional): PR title. Auto-generated from branch/commits if not provided.
- `base` (optional): Base branch. Default: `main`

## Context Required

Passed by orchestrator:
- `git.provider`: github | gitlab | azure
- Additional context from `ia/skills/git:pr:create/instructions.md` (if exists)

## Instructions

### 1. Verify Prerequisites

```bash
# Get current branch
git branch --show-current

# Check commits ahead of base
git log origin/{base}..HEAD --oneline
```

If no commits → Error: "Nothing to push"

### 2. Push Branch

```bash
git push -u origin HEAD
```

### 3. Generate Title (if not provided)

From branch name:
- `feature/KAN-4-add-sidebar` → "KAN-4: Add sidebar"
- `fix/login-bug` → "Fix: Login bug"

Or from first commit message.

### 4. Generate Body

```markdown
## Summary
{auto from commits}

## Changes
{list files changed}

---
Generated with `/workflow:pr`
```

### 5. Create PR Based on Provider

**GitHub:**
```bash
gh pr create --title "{title}" --body "{body}" --base {base}
```

**GitLab:**
```bash
glab mr create --title "{title}" --description "{body}" --target-branch {base}
```

**Azure DevOps:**
```bash
az repos pr create --title "{title}" --description "{body}" --target-branch {base}
```

### 6. Output

Follow `/skill:format:out`:

```
---
✅ git:pr:create completed

## Actions
- Pushed branch {branch} to origin
- Created PR #{number}: {url}

## Result
| Field | Value |
|-------|-------|
| Number | #{number} |
| Title | {title} |
| URL | {url} |
| Base | {base} |

## Corrections
- (none)

## Notes
- (none)
---
```

## Error Handling

- **Push rejected** → "Run git pull --rebase first"
- **PR already exists** → Return existing PR info
- **No upstream** → Set upstream with -u flag
