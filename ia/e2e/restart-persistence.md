# E2E: restart-persistence

## Scenario

Test that agents and work items survive a dispatchator restart (hot-reload or manual `bun start`).

## Steps

### 1. Create ticket + transition to "À faire"

```bash
bun scripts/jira/create-issue.ts KAN Task "discover degradation project"
bun scripts/jira/transition-issue.ts <KEY> 11
```

### 2. Wait for agent spawn (~30s)

**Assert**:
- [ ] Work item visible in UI
- [ ] Agent spawned in `yaaf-agents` session

### 3. Restart dispatchator

Kill the orchestrator window or re-run `bun start`.

**Assert**:
- [ ] Agent window in `yaaf-agents` still alive
- [ ] After restart, work item re-appears in UI
- [ ] Agent re-attached (not respawned — same tmux window)

### 4. Teardown

```bash
bun scripts/jira/transition-issue.ts <PARENT_KEY> 41
```

## On Failure

Transition tickets to "Terminé", kill orphan windows, re-run from Step 1.

## Run Log

### Run 1 — 2026-02-16 (KAN-85 → KAN-86)

- Step 2: PASS — agents spawned
- Step 3: FAIL — agents killed on restart
- **Root cause**: `tmux kill-session -t yaaf` does prefix matching, also kills `yaaf-agents`
- **Fix**: `tmux kill-session -t "=yaaf"` (exact match with `=` prefix)

### Run 2 — 2026-02-16 (KAN-87 → KAN-88)

- Step 2: PASS — agents spawned
- Step 3: PASS — agents survived restart, work items re-appeared, agents re-attached
- **Status: ALL PASS**
