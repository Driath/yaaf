---
name: workflow
description: Global workflow rules. Loaded by agent at session start.
---

# workflow

Global rules that apply to all `workflow:*` skills.

## Usage

This skill is **not invoked directly**. It is loaded automatically via `CLAUDE.md` at session start.

## Rules

### 1. Session State (Resumability)

All workflows track their progress in `ia/state/sessions/{workflow}.json`.

**On workflow start:**
1. Check if `{workflow}.json` exists
2. If exists and same workflow → HITL: "Reprendre {workflow} à l'étape {step} ?"
   - Yes → Load context, skip to that step
   - No → Delete `{workflow}.json`, start fresh
3. If exists but different workflow → HITL: "Un workflow {other} est en cours. L'abandonner ?"
4. Create/update `{workflow}.json`:
   ```json
   {
     "workflow": "workflow:pr",
     "started_at": "ISO",
     "step": "init",
     "context": {}
   }
   ```

**On each step:**
- Update `step` field before executing
- Update `context` with relevant data (pr_number, branch, etc.)

**On workflow end:**
- Handled by `/workflow:end` (archive option + delete `{workflow}.json`)

### 2. Retrospective After Completion

After completing any `workflow:*`, execute `/workflow:retrospective` to:
- Analyze what worked and what caused friction
- Propose concrete improvements to skills used
- Apply approved improvements directly to skill files

### 3. Nested Workflow Behavior

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
