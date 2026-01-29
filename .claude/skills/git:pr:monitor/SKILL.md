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

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `interval` | 30s | Time between polls |
| `max_iterations` | 60 | Max polls before timeout (30min at 30s) |
| `max_comment_retries` | 2 | Iterations stuck on same comments before HITL |

## Instructions

### Pattern: Cooperative Polling

This skill uses **cooperative polling** - the agent controls when to poll rather than running a background loop. This keeps the conversation interactive and HITL natural.

```
┌─────────────────────────────────────────────────────┐
│  Agent polls → Checks status → Reports to user     │
│  User can chat → Agent responds → Agent polls again │
│  State change → Agent reacts → Continues or HITL   │
└─────────────────────────────────────────────────────┘
```

### 1. Initialize

Get initial PR status via `/git:pr:status` and store as baseline:

```
previous_state = {
  ci_status: pending|passing|failing,
  review_status: pending|approved|changes_requested,
  comment_count: number,
  has_conflicts: boolean,
  mergeable: boolean
}
iteration = 0
stuck_count = 0
```

### 2. Poll Loop

Execute this loop until PR is mergeable or max_iterations reached:

```
WHILE iteration < max_iterations AND NOT mergeable:
│
├─ Poll PR status (see "How to Poll" below)
├─ Compare with previous_state
│
├─ IF error polling:
│   ├─ Retry up to 3 times with backoff
│   └─ IF still failing → HITL: "Cannot reach GitHub. Check connection?"
│
├─ IF PR closed/merged externally:
│   └─ Exit: "PR was closed/merged externally"
│
├─ IF CI status changed:
│   ├─ pending → "⏳ CI running..."
│   ├─ passing → "✅ CI passed!"
│   └─ failing → "❌ CI failed: {summary}. Waiting for fix..."
│
├─ IF new comments (comment_count increased):
│   ├─ Execute /code:review to process comments
│   ├─ Push fixes if any changes made
│   ├─ IF same comments after 2 iterations:
│   │   └─ HITL: "Bloqué sur ces commentaires. Besoin d'aide ?"
│   └─ Reset stuck_count, continue
│
├─ IF has_conflicts changed to true:
│   └─ HITL: "❌ Merge conflicts. Resolve manually then tell me."
│
├─ IF mergeable:
│   └─ Go to step 3
│
├─ Update previous_state = current_state
├─ iteration++
├─ Wait {interval}s (inform user: "Prochain check dans 30s...")
└─ CONTINUE
```

### How to Poll

Use a single background command to avoid blocking:

**GitHub:**
```bash
Bash(run_in_background=true):
  gh pr view {pr.number} --json state,mergeable,reviewDecision,statusCheckRollup,comments,reviews
```

Then retrieve with:
```
TaskOutput(task_id, block=true, timeout=10000)
```

**GitLab:**
```bash
Bash(run_in_background=true):
  glab mr view {pr.number} --output json
```

**Azure:**
```bash
Bash(run_in_background=true):
  az repos pr show --id {pr.number} --output json
```

### 3. Ready to Merge

When PR is mergeable, display status and ask user:

```
✅ PR #{number} is ready to merge!

| Check | Status |
|-------|--------|
| CI | ✅ Passing |
| Reviews | ✅ Approved |
| Conflicts | ✅ None |

Monitored for {iteration} iterations ({duration}).
```

**HITL:** "Merge maintenant ?"
- Yes → Execute merge (step 4)
- No → Exit without merging

### 4. Merge

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

### 5. Output

Follow `/skill:format:out`:

```
---
✅ git:pr:monitor completed

## Actions
- Monitored PR #{number} for {iteration} iterations ({duration})
- CI: {status_changes_summary}
- Reviews: {review_summary}
- Processed {X} review comments via code:review
- Merged to {base} ✅

## Result
PR #{number} merged successfully.

## Corrections
- {list of fixes applied during code:review}

## Notes
- {any blockers encountered}
- {HITL decisions made}
---
```

## State Machine

```
┌─────────────┐
│   Start     │
└──────┬──────┘
       │ get initial status
       ▼
┌─────────────┐
│ CI Pending  │◄─────────────────────────┐
└──────┬──────┘                          │
       │ CI completes                    │ push after review
       ▼                                 │
┌─────────────┐    new comments    ┌─────┴─────────┐
│ CI Passed   │───────────────────►│ code:review   │
└──────┬──────┘                    └───────────────┘
       │ CI failing
       ▼
┌─────────────┐
│ CI Failed   │◄──── wait for external fix
└──────┬──────┘
       │ CI passes again
       ▼
┌─────────────┐
│Need Approval│◄──── poll every {interval}
└──────┬──────┘
       │ approved
       ▼
┌─────────────┐    conflicts    ┌───────────┐
│  Mergeable  │────────────────►│   HITL    │
└──────┬──────┘                 └───────────┘
       │ user confirms
       ▼
┌─────────────┐
│   Merged    │
└─────────────┘
```

## Error Handling

| Error | Response |
|-------|----------|
| Network timeout | Retry 3x with exponential backoff (5s, 15s, 45s) |
| PR not found | Exit: "PR #{number} not found. Was it deleted?" |
| PR closed externally | Exit: "PR was closed. Nothing to monitor." |
| PR merged externally | Exit: "PR already merged!" |
| Auth expired | HITL: "GitHub auth expired. Run `gh auth login` then tell me." |
| Max iterations reached | HITL: "Monitoring timeout after {duration}. Continue?" |
| Stuck on comments | HITL after 2 iterations on same unresolved comments |
| Merge conflicts | HITL: Cannot auto-resolve, user must fix |

## HITL Gates

The skill pauses for human input at these points:

| Gate | Trigger | User Options |
|------|---------|--------------|
| Merge confirmation | PR is mergeable | Yes / No |
| Conflict resolution | Merge conflicts detected | "Fixed, continue" / "Cancel" |
| Stuck comments | Same comments after 2 code:review cycles | Help resolve / Skip / Cancel |
| Timeout | Max iterations reached | Continue / Cancel |
| Auth error | GitHub CLI not authenticated | "Fixed, continue" / "Cancel" |

## Interactive Behavior

During monitoring, the user can:
- **Ask questions** → Agent responds, then continues monitoring
- **Request status** → Agent shows current state immediately
- **Cancel monitoring** → Agent stops and reports final state
- **Chat about other things** → Agent handles, notes to check PR soon

The agent should:
- Inform user before each wait: "⏳ CI still running. Checking again in 30s..."
- React immediately to state changes
- Keep status updates concise
- Use HITL gates, not just inform (for decisions)
