---
name: workflow
description: Global workflow rules. Loaded automatically by any workflow:* skill.
---

# workflow

Global rules that apply to all `workflow:*` skills.

## Usage

This skill is **not invoked directly**. By naming convention, any skill named `workflow:*` automatically loads and applies these rules before execution.

## Rules

### 1. Retrospective After Completion

After completing any `workflow:*`, execute `/workflow:retrospective` to:
- Analyze what worked and what caused friction
- Propose concrete improvements to skills used
- Apply approved improvements directly to skill files

### 2. Sub-skill Execution via Task

**All sub-skills must be spawned via Task**, not executed inline. This ensures:
- Each skill has its own isolated context
- Cost control (skills default to haiku)
- Visibility (statusline shows hierarchy)

**Workflow agent responsibilities:**
- Keeps global context (orchestration, decisions, HITL)
- Spawns sub-skills via Task
- Aggregates results

**Sub-skill execution:**
1. Read the skill's header to get `model` and `agent`
2. Spawn Task with those values:
```
Task(subagent_type: "{skill.agent}", model: "{skill.model}", prompt: "Execute /git:pr:find for branch {branch}")
```

**Skill header example:**
```yaml
---
name: git:pr:find
description: Find existing PR for current branch
model: haiku
agent: workflow
---
```

**Header fields:**

| Field | Values | Default | Description |
|-------|--------|---------|-------------|
| `model` | haiku, sonnet, opus | haiku | Model for reasoning complexity |
| `agent` | workflow, Explore, general-purpose | workflow | Agent type for tool access |

**Agent selection guide:**
- `workflow` - Skills that execute commands and interact with user (HITL)
- `Explore` - Skills focused on codebase search and exploration
- `general-purpose` - Complex multi-step tasks requiring broad tool access

**Example hierarchy:**
```
workflow:pr (opus) ← global context, orchestration
  └─ Task: git:pr:find (haiku) ← isolated, executes and returns
  └─ Task: git:pr:create (haiku) ← isolated, executes and returns
  └─ Task: git:pr:monitor (haiku) ← isolated, executes and returns
```

### 3. Nested Workflow Behavior

When a workflow calls another workflow (not a skill):

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

### 5. Statusline & Duration Tracking

Every workflow must display a statusline during execution. **Only count sub-skills in progress**, not internal orchestrator steps.

**Orchestrator format:**
```
[skill/total] {workflow-name} ({model}) | {elapsed}
```

**Worker (sub-skill) format:**
```
  └─ {skill-name} ({agent}, {model}) → {result}
```

**Fields:**
- `skill/total`: Current sub-skill number / total sub-skills in workflow
- `workflow-name`: Name of the workflow being orchestrated
- `skill-name`: Name of the sub-skill being executed
- `agent`: Agent type from skill header (Explore, general-purpose) - omit if `workflow` (default)
- `model`: Model used - omit if `haiku` (default)
- `elapsed`: Time since workflow start
- `result`: Brief outcome of the sub-skill

**Example during execution:**
```
[1/3] workflow:pr (opus) | 0m
  └─ git:pr:find (Explore, sonnet) → No PR found
[2/3] workflow:pr (opus) | 1m
  └─ git:pr:create (haiku) → PR #16 created
[3/3] workflow:pr (opus) | 2m
  └─ git:pr:monitor (haiku) → Ready to merge
```

Note: When agent is `workflow` (default), omit it. Always show model for transparency.

**At workflow completion, include total duration:**
```
Duration: Xm
```
