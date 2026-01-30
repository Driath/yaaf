---
name: git:pr:find
description: Find existing PR/MR for current branch. Provider-agnostic (GitHub, GitLab, Azure).
model: sonnet
agent: Explore
---

# git:pr:find

Find an existing Pull Request / Merge Request for the current branch.

## Usage

```
/git:pr:find
```

## Context Required

From `ia/context.md`:
- `git.provider`: github | gitlab | azure

## Instructions

### 1. Get Current Branch

```bash
git branch --show-current
```

### 2. Find PR Based on Provider

**GitHub:**
```bash
gh pr view --json number,url,state,title,headRefName,baseRefName 2>/dev/null
```

**GitLab:**
```bash
glab mr view --output json 2>/dev/null
```

**Azure DevOps:**
```bash
az repos pr list --source-branch $(git branch --show-current) --output json 2>/dev/null
```

### 3. Output

Follow `/skill:format:out`:

**If PR exists:**
```
---
✅ git:pr:find completed

## Actions
- Found PR #{number} for branch {branch}

## Result
| Field | Value |
|-------|-------|
| Number | #{number} |
| Title | {title} |
| URL | {url} |
| State | {open/merged/closed} |
| Base | {base_branch} |

## Corrections
- (none)

## Notes
- (none)
---
```

**If no PR:**
```
---
✅ git:pr:find completed

## Actions
- No PR found for branch {branch}

## Result
No existing PR.

## Corrections
- (none)

## Notes
- (none)
---
```

## Error Handling

- **No git repo** → Error
- **CLI not installed** → "Install {gh|glab|az} CLI"
- **Not authenticated** → "Run {gh auth|glab auth|az login}"
