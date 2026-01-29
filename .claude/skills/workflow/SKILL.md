---
name: workflow
description: Global workflow rules. Loaded by agent at session start.
---

# workflow

Global rules that apply to all `workflow:*` skills.

## Usage

This skill is **not invoked directly**. It is loaded automatically via `CLAUDE.md` at session start.

## Rules

### 1. Retrospective After Completion

After completing any `workflow:*`, execute `/workflow:retrospective` to:
- Analyze what worked and what caused friction
- Propose concrete improvements to skills used
- Apply approved improvements directly to skill files

### 2. Nested Workflow Behavior

When a workflow calls another workflow:

```
IF same agent context (no Task spawn):
  → Rules already loaded
  → Skip retrospective (will run at root level)

IF new agent context (Task spawn with custom model/agent):
  → Reloads rules from CLAUDE.md
  → Runs its own retrospective at completion
```

This prevents cascading retrospectives while ensuring each independent agent session learns from its execution.

### 3. Background Monitoring

When using `/git:pr:monitor` or similar long-running skills:
- Run in background mode when possible
- Keep conversation interactive
- Notify user of state changes inline

### 4. HITL Gates

Workflows should pause for human input (HITL) at:
- Merge decisions
- Conflict resolution
- Ambiguous review comments
- Plan approval for external reviewer feedback

Auto-proceed for:
- CI status checks
- Simple/clear self-review comments
- Status polling
