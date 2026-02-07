---
name: workflow
description: Global workflow rules. Loaded automatically by any workflow:* skill.
---

# workflow

Global rules that apply to all `workflow:*` skills.

## Usage

This skill is **not invoked directly**. By naming convention, any skill named `workflow:*` automatically loads and applies these rules before execution.

## Rules

### 0. Window Title (dispatched agents)

When running as a dispatched agent in tmux, set a descriptive window title at workflow start:

```bash
printf '\033]2;Brief description of current task\007'
```

Keep it short (< 30 chars). Examples:
- `Analyzing PR #42`
- `Implementing sidebar`
- `Fixing auth bug`

This helps the orchestrator display meaningful info.

### 1. Sub-skill Execution via Task

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

### 2. Nested Workflow Behavior

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

### 3. Project Context Loading

Workflows that receive a `projectName` input MUST load project-specific overrides if they exist:

```
.claude/skills/{workflowName}/references/projects/{projectName}.md
```

This file contains project-specific requirements (test strategy, conventions, etc.) that override or extend the workflow's default behavior.

**Example:**
```
workflow:work-item-to-code-plan receives projectName="degradation"
→ Loads .claude/skills/workflow:work-item-to-code-plan/references/projects/degradation.md
→ Plan must include E2E scenarios as specified
```

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

Every workflow must display a statusline during execution. **Only count sub-skills**, not internal orchestrator steps.

**Duration tracking:**
1. At workflow start: `.claude/skills/workflow/scripts/timestamp` → store the value
2. At workflow end: `.claude/skills/workflow/scripts/duration <start_timestamp>` → returns formatted duration

**Start of workflow:**
```
{workflow-name} ({model})
```

**Each skill (as it completes):**
```
[${step}/${total}] ${statusIcon} | ⚡ ${skillName} | 🤖 ${agent} | 🧠 ${model} | → ${result}
```

**Status icons:**
- `✓` = success
- `⏭` = skipped
- `⏳` = pending / blocked
- `❌` = error

**Label icons:**
- `⚡` = skill (action)
- `🤖` = agent (executor)
- `🧠` = model (intelligence)

**Fields:**
- `${step}`: Current skill number (1-indexed)
- `${total}`: Total skills in workflow
- `${statusIcon}`: Status of execution
- `${skillName}`: Skill name (padded for alignment)
- `${agent}`: Agent type from skill header
- `${model}`: Model from skill header
- `${result}`: Brief outcome, or `SKIPPED (reason)` if not executed

**SKIPPED skills:** Keep in numbered sequence. Do not exclude from total count.

**End of workflow (summary):**
```
---
${workflowName} (${model}) | ${timestamp}

[${step}/${total}] ${statusIcon} | ⚡ ${skillName} | 🤖 ${agent} | 🧠 ${model} | → ${result}
...
---
```

**Example:**
```
workflow:pr (opus)

[1/3] ✓ | ⚡ git:pr:find    | 🤖 workflow | 🧠 haiku | → Found PR #18
[2/3] ⏭ | ⚡ git:pr:create  | 🤖 workflow | 🧠 haiku | → SKIPPED (PR exists)
[3/3] ⏳ | ⚡ git:pr:monitor | 🤖 workflow | 🧠 haiku | → Blocked (review required)

---
workflow:pr (opus) | 1m 23s

[1/3] ✓ | ⚡ git:pr:find    | 🤖 workflow | 🧠 haiku | → Found PR #18
[2/3] ⏭ | ⚡ git:pr:create  | 🤖 workflow | 🧠 haiku | → SKIPPED (PR exists)
[3/3] ⏳ | ⚡ git:pr:monitor | 🤖 workflow | 🧠 haiku | → Blocked (review required)
---
```
