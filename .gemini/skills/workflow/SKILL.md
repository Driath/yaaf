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

### 2. Project Path Resolution

Workflows that receive a `projectName` (from `IA:PROJECT:*` label) MUST resolve the project path before any file operations:

```
1. Resolve symlink: readlink projects/{projectName} → absolute path (e.g., /Users/.../Projects/degradation)
2. Use the ABSOLUTE PATH for all file operations (Read, Glob, Grep, Write, Edit)
3. NEVER use Shell to read files — always use dedicated tools with absolute paths
```

The `projects/` directory contains symlinks to external codebases. Agents work on these projects using their absolute paths.

### 3. HITL Gates

Workflows should pause for human input (HITL) at:
- Merge decisions
- Conflict resolution
- Ambiguous review comments
- Plan approval for external reviewer feedback

Auto-proceed for:
- CI status checks
- Simple/clear self-review comments
- Status polling
