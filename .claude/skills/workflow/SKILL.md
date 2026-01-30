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
1. Read the skill's header to get `model` (default: haiku)
2. Spawn Task with that model:
```
Task(subagent_type: "workflow", model: "{skill.model}", prompt: "Execute /git:pr:find for branch {branch}")
```

**Skill header example:**
```yaml
---
name: git:pr:find
description: Find existing PR for current branch
model: haiku
---
```

**Model selection:**
- Defined in skill header (`model: haiku | sonnet | opus`)
- Default: `haiku` if not specified
- Complex reasoning skills can declare `model: sonnet` or `model: opus`

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

Every workflow (and sub-agents) must display a statusline during execution:

**Statusline format:**
```
[step/total] | agent: {agent} | skill: {skill} | model: {model} | elapsed: {time}
```

**Fields:**
- `step/total`: Current step and total steps (from skill's ### sections)
- `agent`: Agent type (workflow, Explore, Plan, etc.)
- `skill`: Current skill being executed (or `-` if none)
- `model`: Model used - show `(default)` if not declared in skill header
- `elapsed`: Time since workflow start

**Example during execution:**
```
[1/6] | agent: workflow | skill: - | model: opus | elapsed: 0m
[3/6] | agent: workflow | skill: git:pr:find | model: haiku (default) | elapsed: 1m
```

**Sub-agents spawned via Task must also display their statusline:**
```
[3/6] | agent: workflow | skill: git:pr:find | model: opus | elapsed: 1m
  └─ [1/2] | agent: workflow | skill: git:pr:find | model: haiku (default) | elapsed: 0m
```

**At workflow completion, include total duration:**
```
Duration: Xh Ym (or Xm if under 1 hour)
```

This is the agent's responsibility using conversation context - no external state file needed.
