# E2E: workflow:discover-project

## Scenario

Test the full lifecycle: ticket creation → intent routing → discover-project execution → report posted → status updated → teardown kills agents.

## Steps

### 1. Create ticket + transition to "À faire"

```bash
bun scripts/jira/create-issue.ts KAN Task "discover degradation project"
bun scripts/jira/transition-issue.ts <KEY> 11
```

### 2. Wait for intent routing (~30s)

**Assert**:
- [ ] Dispatchator shows the ticket in UI
- [ ] Intent agent spawns, creates subtask with labels `IA:WORKFLOW:discover-project,IA:PROJECT:degradation`
- [ ] Subtask transitioned to "À faire"
- [ ] Parent gets label `IA:WORKFLOW:discover-project`

### 3. Wait for discover-project execution (~60s)

**Assert**:
- [ ] Agent resolves project path via `readlink projects/degradation`
- [ ] Discovery report comment posted on subtask
- [ ] Subtask transitioned to "En cours de revue"

### 4. Verify final state

```bash
bun scripts/jira/get-issue.ts <SUBTASK_KEY> --fields=status,comment
```

**Assert**:
- [ ] Status = "En cours de revue"
- [ ] Comment contains `## workflow:discover-project report`

### 5. Teardown — transition parent to Terminé

```bash
bun scripts/jira/transition-issue.ts <PARENT_KEY> 41
```

**Assert**:
- [ ] Work items removed from UI within 15s
- [ ] Agent tmux windows killed (no orphan windows)
- [ ] `A:0/2 | W:0` in status bar

## On Failure

Transition the parent ticket to "Terminé", manually kill orphan windows, then re-run from Step 1.

```bash
bun scripts/jira/transition-issue.ts <PARENT_KEY> 41
tmux kill-window -t yaaf-agents:<N>  # for each orphan
```

## Run Log

### Run 1 — 2026-02-16 (KAN-65 → KAN-66)

- Step 2: PASS (with self-corrections)
- Step 3: FAIL — agent passed transition name instead of ID
- Step 5: FAIL — dispatchator did not kill agents (detectStatus mismatch)
- **Fix 1**: clarified `transition-issue.ts` dual behavior in CLAUDE.md
- **Fix 2**: fallback config `detectStatus` "Done" → "Terminé"

### Run 2 — 2026-02-16 (KAN-67 → KAN-68)

- Step 2: PASS
- Step 3: PASS
- Step 4: PASS
- Step 5: not tested

### Run 3 — 2026-02-16 (KAN-69 → KAN-70)

- Step 2: PARTIAL — intent tried "Agent-Ready" transition (renamed to "À faire")
- Step 3: PASS
- Step 4: PASS
- Step 5: FAIL — `removedItem` fires, `killAgent()` called but window respawned (race condition)
- **Fix 1**: renamed "Agent-Ready" → "À faire" in all skills
- **Fix 2**: config refactor — `queries`+`doneConfig` → `project`+`excludeStatuses`+`spawnStatus`
- **Fix 3**: removed `scan` (kept stale items) + `workItemStatusChanged` subscriber (redundant)
- **Fix 4**: `removeWorkItem` before `killAgent` to prevent `slotsAvailable$` race condition respawn

### Run 4 — 2026-02-16 (KAN-81 → KAN-82)

- Step 2: PASS — intent created subtask, transitioned to "À faire"
- Step 3: PASS — discovery report posted
- Step 4: PASS — status "En cours de revue", comment present
- Step 5: PASS — both agents killed, no orphan windows
- **Status: ALL PASS**
