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
- `interval` (optional): Polling interval in seconds. Default: 30

## Instructions

### 0. Launch Background Monitor

Run the polling loop in background so the conversation remains interactive:

```bash
# Launch background monitor script
Bash(run_in_background=true):
  while true; do
    gh pr view {pr.number} --json state,mergeable,reviewDecision,statusCheckRollup,reviews,comments
    sleep {interval}
  done
```

This returns a `task_id`. Use `TaskOutput(task_id, block=false)` to check status without blocking.

**Key behavior:**
- User can continue chatting while monitor runs
- Check monitor output periodically (every few messages or when relevant)
- React immediately when state changes (approval, comments, CI status)
- Notify user of important changes inline in conversation

### 1. Initialize

- Get initial PR status via `/git:pr:status`
- Store as `previous_state`

### 2. Monitor Loop

```
While PR is not mergeable:
│
├─ Check current status
│
├─ IF CI pending:
│   └─ Display "⏳ CI running..."
│   └─ Wait {interval}s → continue
│
├─ IF CI failing:
│   └─ Display "❌ CI failed: {details}"
│   └─ Wait {interval}s → continue (might be fixed by push)
│
├─ IF has new comments (compared to previous_state):
│   ├─ Execute /code:review (traite les commentaires)
│   ├─ Push fixes if any
│   ├─ Compare new state with previous
│   │   ├─ IF changed → update previous_state, continue
│   │   └─ IF same after 2 iterations:
│   │       └─ HITL: "Bloqué sur les mêmes commentaires. Besoin d'aide ?"
│   └─ continue
│
├─ IF needs approval (no new comments):
│   └─ Display "⏳ Waiting for reviewer approval..."
│   └─ Wait {interval}s → continue
│
├─ IF has conflicts:
│   └─ HITL: "❌ Merge conflicts detected. Resolve manually."
│   └─ Exit or wait for user
│
└─ IF mergeable:
    └─ Go to step 3
```

### 3. Ready to Merge

```
✅ PR #{number} is ready to merge!

| Check | Status |
|-------|--------|
| CI | ✅ Passing |
| Reviews | ✅ Approved |
| Conflicts | ✅ None |
```

HITL: "Merge maintenant ?"
- Yes → Execute merge (step 4)
- No → Exit

### 4. Merge

**GitHub:**
```bash
gh pr merge {pr.number} --merge
```

**GitLab:**
```bash
glab mr merge {pr.number}
```

**Azure:**
```bash
az repos pr update --id {pr.number} --status completed
```

### 5. Output

Follow `/skill:format:out`:

```
---
✅ git:pr:monitor completed

## Actions
- Monitored PR #{number} for {duration}
- Processed {X} review comments via code:review
- PR approved by @{reviewer}
- Merged to {base}

## Result
PR #{number} merged successfully.

## Corrections
- {fixes applied during code:review}

## Notes
- Waited {X} iterations
- {any blockers encountered}
---
```

## State Machine Summary

```
┌─────────────┐
│ CI Pending  │◄─────────────────┐
└──────┬──────┘                  │
       │ CI done                 │ push
       ▼                         │
┌─────────────┐    comments  ┌───┴───────────┐
│ CI Passing  │─────────────►│ code:review│
└──────┬──────┘              └───────────────┘
       │
       ▼
┌─────────────┐
│Need Approval│◄──── wait 30s
└──────┬──────┘
       │ approved
       ▼
┌─────────────┐
│  Mergeable  │──── HITL ───► Merge
└─────────────┘
```

## Error Handling

- **PR closed** → Exit with message
- **Merge conflicts** → HITL, cannot auto-resolve
- **Stuck on same comments** → HITL after 2 iterations
- **CI keeps failing** → Continue polling, user may push fix

## Background Mode Behavior

When running in background:

1. **User interrupts (Escape)** → Monitor keeps running, conversation continues
2. **State change detected** → Notify user inline:
   ```
   🔔 PR #2 update: CI passed, waiting for approval
   ```
3. **Action required** → Prompt user:
   ```
   🔔 PR #2 approved! Ready to merge. On merge ?
   ```
4. **User asks about PR** → Check latest status and respond
5. **Conversation ends** → Background task auto-terminates

This allows collaborative decision-making while the PR progresses.
