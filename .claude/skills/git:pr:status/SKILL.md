---
name: git:pr:status
description: Check PR/MR status (CI, reviews, conflicts, mergeable). Provider-agnostic.
---

# git:pr:status

Check the status of a Pull Request / Merge Request.

## Usage

```
/git:pr:status [pr="number or url"]
```

## Arguments

- `pr` (optional): PR number or URL. If not provided, uses current branch's PR.

## Context Required

From `ia/context.md`:
- `git.provider`: github | gitlab | azure

## Instructions

### 1. Get PR Info Based on Provider

**GitHub:**
```bash
gh pr view {pr} --json \
  number,url,state,title,mergeable,mergeStateStatus,\
  statusCheckRollup,reviewDecision,reviews,\
  headRefName,baseRefName,isDraft
```

**GitLab:**
```bash
glab mr view {pr} --output json
```

**Azure DevOps:**
```bash
az repos pr show --id {pr} --output json
```

### 2. Parse Status

**CI Status:**
- Extract check/pipeline status
- List: pending, success, failure

**Review Status:**
- APPROVED
- CHANGES_REQUESTED
- REVIEW_REQUIRED
- List reviewers and their status

**Merge Status:**
- MERGEABLE / CONFLICTING / UNKNOWN
- CLEAN / UNSTABLE / DIRTY / BLOCKED

### 3. Output

Follow `/skill:format:out`:

```
---
✅ git:pr:status completed

## Actions
- Checked status of PR #{number}

## Status

| Check | Status |
|-------|--------|
| CI | ✅ Passing / ⏳ Pending / ❌ Failing |
| Reviews | ✅ Approved / ⏳ Pending / ❌ Changes requested |
| Conflicts | ✅ None / ❌ Has conflicts |
| Mergeable | ✅ Ready / ❌ Blocked |

### CI Details
- {check-name}: ✅ / ❌ / ⏳

### Review Details
- @{reviewer}: ✅ Approved / ❌ Changes requested / ⏳ Pending

## Corrections
- (none)

## Notes
- {blockers or next steps if any}
---
```

## Summary Helpers

**Ready to merge:**
```
✅ PR #{number} is ready to merge
```

**Blocked:**
```
❌ PR #{number} is blocked:
- CI failing: {check-name}
- Needs review from: @{reviewer}
- Has merge conflicts
```

## Error Handling

- **PR not found** → "No PR found. Create one with /git:pr:create"
- **API error** → Show error message
