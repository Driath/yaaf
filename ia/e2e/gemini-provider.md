# E2E: gemini-provider

## Scenario

Test that a work item with label `IA:PROVIDER:GEMINI` spawns an agent using the `gemini` CLI instead of `claude`.

## Steps

### 1. Create ticket + add label + transition to "À faire"

```bash
KEY=$(bun scripts/jira/create-issue.ts KAN Story "test: gemini provider e2e" | jq -r '.key')
bun scripts/jira/update-issue.ts $KEY --labels="IA:PROVIDER:GEMINI"
bun scripts/jira/transition-issue.ts $KEY 11
echo "Ticket: $KEY"
```

### 2. Wait for agent spawn (~30s)

**Assert**:
- [ ] Work item visible in UI
- [ ] Agent spawned in `yaaf-agents` session

```bash
tmux capture-pane -t 4:0 -p
tmux list-windows -t yaaf-agents
```

### 3. Verify gemini CLI is used

**Assert**:
- [ ] Agent window runs `gemini` (not `claude`)

```bash
tmux list-windows -t yaaf-agents -F '#{window_name} #{pane_current_command}'
# ou inspecter la commande du pane
tmux display-message -t yaaf-agents -p '#{pane_current_command}'
```

### 4. Teardown

```bash
bun scripts/jira/transition-issue.ts $KEY 41
```

## On Failure

Transition ticket to "Terminé", kill orphan windows, re-run from Step 1.

## Run Log

### Run 1 — 2026-02-18 (KAN-97)

_À compléter._
