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

**IF comments (unresolved):**
→ Execute `/git:pr:comments` to plan and process comments
→ Repoll

**Otherwise** → Go to step 4 (Blocked - HITL)

### 4. Blocked - HITL (contextual options)

Identify the blocking reason and present contextual options via AskUserQuestion.

#### 4a. Conflicts

```
❌ PR #{number} has merge conflicts

Options:
- "J'ai résolu les conflits, recheck" → repoll (step 1)
- "Sortir du workflow" → exit
```

#### 4b. CI Failed

```
❌ PR #{number} CI failed

{Show failure details from statusCheckRollup}

Options:
- "J'ai fix, recheck" → repoll (step 1)
- "Voir les logs CI" → show CI URL
- "Sortir du workflow" → exit
```

#### 4c. CI Pending

```
⏳ PR #{number} CI in progress

Options:
- "Recheck maintenant" → repoll (step 1)
- "Recheck dans 3 min" (Recommended) → wait 3 min, repoll (step 1)
- "Sortir du workflow" → exit
```

#### 4d. Review Required

```
⏳ PR #{number} awaiting review

Options:
- "J'ai approuvé sur GitHub, recheck" (Recommended) → repoll (step 1)
- "Sortir du workflow" → exit
```

#### 4e. Changes Requested

```
❌ PR #{number} has changes requested

Options:
- "J'ai address les commentaires, recheck" → repoll (step 1)
- "Voir les commentaires" → execute `/git:pr:comments`
- "Sortir du workflow" → exit
```

**Exit message:** "workflow:pr en pause. Relance /workflow:pr pour reprendre."

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
| Conflicts | Has conflicts | "Résolu, recheck" / Exit |
| CI Failed | CI failed | "Fix, recheck" / "Voir logs" / Exit |
| CI Pending | CI running | "Recheck now" / "3 min" / Exit |
| Review Required | Awaiting review | "Approuvé, recheck" / Exit |
| Changes Requested | Changes requested | "Addressé, recheck" / "Voir commentaires" / Exit |
| Merge confirmation | Mergeable | Yes / No |
