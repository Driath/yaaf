---
name: git:pr:monitor
description: Poll PR status until mergeable, react to CI/comments/approvals. Provider-agnostic.
---

# git:pr:monitor

Monitor a PR and react to its state until it's ready to merge.

## Usage

```
/git:pr:monitor
```

## Context Required

Passed by orchestrator:
- `git.provider`: github | gitlab | azure
- `pr.number`: PR number to monitor
- `pr.url`: PR URL

## Instructions

### 1. Poll PR Status

Get current PR status:

**GitHub:**
```bash
gh pr view {pr.number} --json state,mergeable,reviewDecision,statusCheckRollup,comments,reviews
```

### 2. Display Status

```
PR #{number}: {url}

| Check | Status |
|-------|--------|
| CI | ✅ Passing / ⏳ Pending / ❌ Failing |
| Reviews | ✅ Approved / ⏳ Pending / ❌ Changes requested |
| Conflicts | ✅ None / ❌ Has conflicts |
```

### 3. React to State

**IF mergeable:**
→ Go to step 5 (Ready to Merge)

**IF new comments:**
→ Execute `/code:review` to process comments
→ Push fixes if any
→ Repoll

**IF conflicts:**
→ HITL: "❌ Merge conflicts. Resolve manually then tell me."

**IF CI failed:**
→ Show failure details, wait for fix

**IF waiting (not mergeable yet):**
→ Go to step 4 (HITL choice)

### 4. Wait Choice (HITL)

Present options via AskUserQuestion:

```
⏳ PR #{number}: {url}

| CI | {status} | Reviews | {status} | Conflicts | {status} |

Options:
- "Recheck maintenant" (Recommandé)
- "Recheck dans 3 min"
- "Sortir du workflow"
```

**Actions:**
- "Recheck maintenant" → repoll immediately (go to step 1)
- "Recheck dans 3 min" → wait 3 min, then repoll (go to step 1)
- "Sortir du workflow" → exit with message: "workflow:pr en pause. Relance /workflow:pr pour reprendre."

### 5. Ready to Merge

When PR is mergeable:

```
✅ PR #{number} is ready to merge!

| CI | ✅ | Reviews | ✅ | Conflicts | ✅ |
```

**HITL:** "Merge maintenant ?"
- Yes → Execute merge (step 6)
- No → Exit without merging

### 6. Merge

**GitHub:**
```bash
gh pr merge {pr.number} --merge --delete-branch
```

**GitLab:**
```bash
glab mr merge {pr.number} --remove-source-branch
```

**Azure:**
```bash
az repos pr update --id {pr.number} --status completed --delete-source-branch
```

### 7. Output

Follow `/skill:format:out`:

```
---
✅ git:pr:monitor completed

## Actions
- Monitored PR #{number}
- {status changes summary}
- Merged to {base} ✅

## Result
PR #{number} merged successfully.

## Notes
- {any blockers encountered}
---
```

## Error Handling

| Error | Response |
|-------|----------|
| PR not found | Exit: "PR #{number} not found" |
| PR closed externally | Exit: "PR was closed" |
| PR merged externally | Exit: "PR already merged!" |
| Auth error | HITL: "Run `gh auth login`" |

## HITL Gates

| Gate | Trigger | Options |
|------|---------|---------|
| Wait choice | Not mergeable | Recheck now / 3 min / Exit |
| Merge confirmation | Mergeable | Yes / No |
| Conflict resolution | Conflicts | "Fixed" / "Cancel" |
