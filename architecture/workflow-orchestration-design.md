# Workflow Orchestration Design - YAAF

**Date:** 2026-01-29
**Status:** Design Phase (Updated)
**Context:** Architecture discussion for implementing a complete feature development workflow orchestrator

---

## Executive Summary

We want to create an orchestrated workflow that automates the complete feature development lifecycle: from ticket selection to PR merge, with HITL (Human-In-The-Loop) validation gates at critical points.

**Goal:** `/workflow:feature-to-develop` that chains multiple atomic skills into a complete, context-aware, self-improving development workflow.

---

## Key Decisions (This Session)

### 1. Naming Convention

| Prefix | Type | Examples |
|--------|------|----------|
| `code:` | Atomic skills - code operations | `code:plan`, `code:implement`, `code:review` |
| `git:` | Atomic skills - git operations | `git:worktree:add`, `git:pr:create` |
| `work-item:` | Atomic skills - ticket operations | `work-item:analyse`, `work-item:get-available` |
| `comms:` | Atomic skills - communication | `comms:pr-announce` |
| `skill:` | Meta-skills | `skill:check`, `skill:design` |
| `workflow:` | **Orchestrators** | `workflow:feature-to-develop`, `workflow:pr-feedback-loop` |

### 2. Context Architecture (Agnostic Skills)

Skills are **agnostic** - they don't hardcode project knowledge. Context comes from:

```
workspace/                              # User's workspace
├── CLAUDE.md                           # Workspace config
├── CLAUDE.EXAMPLE.md                   # Reference/documentation
│
├── api/                                # Project 1
│   ├── CLAUDE.md                       # Project config (override)
│   └── ia/                            # Project-specific skill instructions
│       └── skills/
│           ├── code:review/
│           │   └── instructions.md     # Learned review rules
│           └── code:implement/
│               └── instructions.md     # Implementation patterns
│
└── frontend/                           # Project 2
    ├── CLAUDE.md
    └── ia/skills/...
```

### 3. CLAUDE.md Format (Structured Markdown)

**Workspace CLAUDE.md:**
```markdown
# Workspace

Name: MyBeautifulProject

## Projects

| Name | Path | Type | Git |
|------|------|------|-----|
| api | ./api | express | https://github.com/org/api |
| frontend | ./frontend | nextjs | https://github.com/org/frontend |

## Work Items

Provider: jira
Target: MYPROJ
MCP: atlassian

## Team

Slack: #myproj-dev
```

**Project CLAUDE.md (override/additions):**
```markdown
# Project: api

## Git

Provider: azure-devops
Remote: https://dev.azure.com/org/api
Branch: feat/{ticket-key}-{slug}

## Stack

- Node.js 20
- Express 4
- TypeScript

## Conventions

- Commits: conventional commits
- PR: Requires 2 approvals
```

### 4. Self-Improving Feedback Loop

**Key insight:** `code:pr-review` learns from PR feedback and improves `code:review`.

```
/workflow:pr-feedback-loop

1. Read PR comments
2. For each comment:
   ├─ Fix the issue
   ├─ HITL: "Add this as a rule?"
   ├─ Write to {project}/ia/skills/code:review/instructions.md
   └─ Rerun /code:review (applies new rule, catches similar issues)
3. Loop until clean
4. Push updated code
```

The system **learns from every PR** and improves over time.

### 5. Composable Workflows

Workflows can call other workflows:

```
/workflow:feature-to-develop
│
├─ work-item:get-available
├─ work-item:analyse
├─ code:plan
├─ HITL: validate plan
│
├─ git:worktree:add
├─ code:implement
├─ code:review
├─ git:pr:create
├─ comms:pr-announce
├─ HITL: test & validate PR
│
├─ /workflow:pr-feedback-loop    ← Nested workflow
│   └─ Loop: read comments → fix → learn → rerun review
│
└─ git:pr:monitor → merge
```

Each workflow is:
- **Autonomous** - can be used standalone
- **Composable** - can be called by other workflows
- **Stateful** - has its own state file

### 6. Standardized Skill Output

**Meta-skill:** `skill:format:out` defines a standard output format for all skills.

```markdown
---
✅ {skill-name} completed

## Actions
- {ce qui a été fait}

## Corrections
- {ajustements en cours de route}

## Notes
- {observations, difficultés, feedback user}
---
```

**Usage in skills:**
```markdown
# code:implement/SKILL.md

## Output
Follow /skill:format:out
```

**Benefits:**
- DRY - format defined once
- Discoverable - orchestrator can parse outputs
- Decoupled - skills don't know about workflows
- Evolvable - change format in one place

### 7. Retrospective & Self-Education

Two skills with separated responsibilities:

| Skill | Responsabilité | HITL |
|-------|----------------|------|
| `skill:retrospective` | Analyse state, génère suggestions brutes | Non |
| `skill:feedback` | Présente suggestions, dialogue humain, applique | Oui |

**Flow at end of workflow:**
```
workflow:feature-to-develop
│
├─ ... steps ...
├─ git:pr:monitor → merge ✅
│
├─ skill:retrospective
│   ├─ Lit ia/state.json
│   ├─ Analyse corrections, hitl feedback, pr comments
│   └─ Output: suggestions structurées (suit skill:format:out)
│
├─ skill:feedback
│   ├─ Prend les suggestions de retrospective
│   ├─ HITL: Présente à l'humain
│   │   "Voici ce que j'ai appris, tu valides quoi ?"
│   ├─ Applique les validées → ia/skills/{skill}/instructions.md
│   ├─ Génère TODO.md pour le reste (à challenger plus tard)
│   └─ Delete state.json
│
└─ Done
```

**Why separated:**
- `skill:retrospective` can run **without human** (batch, CI, etc.)
- `skill:feedback` is **interactive**, dedicated to dialogue
- Can rerun `skill:feedback` later on existing TODO.md

**Result:** The system **self-educates** after each workflow, improving quality over time.

### 8. HITL Implementation

**Decision:** HITL gates are **inline waits** (not stop/resume).

The workflow presents a message and waits for user response (~30 min max):

```markdown
⏸️ Validation Required

📄 Plan: plans/MYPROJ-KAN-4.md
📝 Summary: Add user authentication with JWT

Validate with your team, then reply "continue" or describe changes.
```

User stays in same Claude session, does validation, types "ok".

**Fallback:** If session closes, state is persisted. User relaunches `/workflow:feature-to-develop` and it resumes from saved state.

---

## Architecture

### Skill Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOWS (orchestrators)                 │
│  workflow:feature-to-develop, workflow:pr-feedback-loop     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ATOMIC SKILLS                             │
│  code:plan, code:implement, code:review, git:pr:create...   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ reads
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONTEXT LAYER                             │
│  workspace/CLAUDE.md, project/CLAUDE.md, ia/skills/        │
└─────────────────────────────────────────────────────────────┘
```

### Context Architecture

**3-layer context system:**

```
┌─────────────────────────────────────────────┐
│  ia/context.md                              │
│  "Workspace config: providers, projects"    │
│  (jira, github, mcp, api...)                │
└─────────────────────────────────────────────┘
                    │
                    │ loads
                    ▼
┌─────────────────────────────────────────────┐
│  workflow:*                                  │
│  "Reads context, routes, forwards"          │
│  (orchestration + context passing)           │
└─────────────────────────────────────────────┘
                    │
                    │ passes context
                    ▼
┌─────────────────────────────────────────────┐
│  atomic skill                                │
│  "Receives context, executes"               │
│  (provider-agnostic)                         │
└─────────────────────────────────────────────┘
```

**ia/context.md format:**

```markdown
# Workspace Context

## Work Items

| Provider | Access | Default |
|----------|--------|---------|
| jira | mcp:atlassian | yes |

## Projects

| name | path | type | jira-project | git |
|------|------|------|--------------|-----|
| api | ./api | express | PROJ | github:org/api |
| frontend | ./frontend | nextjs | PROJ | github:org/frontend |
```

**Context loading pattern:**

```markdown
# In workflow SKILL.md

1. Load ia/context.md → workspace config
2. Extract relevant config (work-items, project)
3. Pass to child skills as context

# In atomic skill SKILL.md

1. Receive context from orchestrator
2. Based on context.provider + context.access:
   - jira + mcp:atlassian → Use MCP tools
   - jira + api → Use REST API
   - github → Use gh CLI
3. Execute skill logic
```

**Benefits:**
- Skills are **reusable** across providers
- Config is **centralized** in ia/context.md
- Change provider = change config, not skills

### State Management

**Location:** `{project}/ia/state.json` (one workflow at a time per project)

```
workspace/
├── api/
│   └── ia/
│       ├── skills/           # Learned rules
│       │   └── code:review/
│       │       └── instructions.md
│       └── state.json        # Current workflow state
```

**Suggested .gitignore:**
```
# IA workflow state (ephemeral)
ia/state.json
```

**Lifecycle:**
```
Workflow start    → state.json created
Workflow merge    → skill:retrospective → skill:feedback
                  → Generates TODO.md for human review
                  → Deletes state.json
```

**Complete State Schema:**
```json
{
  "workflow": "feature-to-develop",
  "id": "KAN-4",
  "project": "api",
  "current_step": 6,
  "status": "awaiting_pr_approval",

  "context": {
    "ticket_key": "KAN-4",
    "plan_path": "plans/api-KAN-4.md",
    "worktree": "./worktrees/api-KAN-4",
    "branch": "feat/KAN-4-user-auth",
    "pr_url": "https://github.com/org/api/pull/42"
  },

  "steps": [
    {
      "skill": "work-item:get-available",
      "status": "completed",
      "started_at": "2026-01-29T10:00:00Z",
      "completed_at": "2026-01-29T10:01:00Z",
      "output": {
        "actions": ["Selected ticket KAN-4 from backlog"],
        "corrections": [],
        "notes": []
      }
    },
    {
      "skill": "code:plan",
      "status": "completed",
      "started_at": "2026-01-29T10:05:00Z",
      "completed_at": "2026-01-29T10:15:00Z",
      "output": {
        "actions": ["Created implementation plan"],
        "corrections": [],
        "notes": ["User asked to compare JWT vs session"]
      },
      "hitl": {
        "requested_at": "2026-01-29T10:15:00Z",
        "resolved_at": "2026-01-29T10:30:00Z",
        "feedback": "Add JWT vs session comparison"
      }
    },
    {
      "skill": "code:implement",
      "status": "completed",
      "started_at": "2026-01-29T10:35:00Z",
      "completed_at": "2026-01-29T11:00:00Z",
      "output": {
        "actions": ["Created 3 files", "Modified 2 files"],
        "corrections": ["Fixed import paths (2x)", "Added missing types"],
        "notes": []
      }
    }
  ],

  "pr_feedback": [
    {
      "comment": "Use absolute imports",
      "author": "teammate",
      "resolved_by": "code:implement",
      "learned_rule": "Always use absolute imports (@/...)"
    }
  ],

  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T11:00:00Z"
}
```

---

## Workflows

### workflow:feature-to-develop

**Trigger:** `/workflow:feature-to-develop` or with args: `"sur le projet api, ticket KAN-4"`

**Flow:**
```
1. Parse input (natural language or key=value)
2. Load workspace CLAUDE.md
3. HITL: Select project (if multiple)
4. Load project CLAUDE.md
5. Query work items (Jira via MCP)
6. HITL: Confirm ticket
7. work-item:analyse
8. code:plan
9. HITL: Validate plan
10. git:worktree:add
11. code:implement
12. code:review
13. git:pr:create
14. comms:pr-announce
15. HITL: Test & validate PR
16. /workflow:pr-feedback-loop (nested)
17. git:pr:monitor → merge
18. Cleanup → Done
```

### workflow:pr-feedback-loop

**Trigger:** Called by `workflow:feature-to-develop` or standalone: `/workflow:pr-feedback-loop pr="..."`

**Flow:**
```
1. Read PR comments
2. For each unresolved comment:
   a. Analyse the feedback
   b. Fix the code
   c. If pattern detected:
      - HITL: "Add as rule?"
      - Write to ia/skills/code:review/instructions.md
   d. Rerun code:review (catches similar issues)
3. Commit fixes
4. Push
5. Loop until no new comments
```

---

## Skills Inventory

### Existing (Committed)
- ✅ `code:plan`
- ✅ `code:implement`
- ✅ `code:pr-review`
- ✅ `skill:design`
- ✅ `skill:check`
- ✅ `skill:get-usage`

### To Create/Complete
| Skill | Status | Priority |
|-------|--------|----------|
| `skill:format:out` | New | P0 |
| `skill:retrospective` | New | P0 |
| `skill:feedback` | New | P0 |
| `workflow:feature-to-develop` | New | P0 |
| `workflow:pr-feedback-loop` | New | P0 |
| `work-item:get-available` | New | P1 |
| `work-item:analyse` | Partial | P1 |
| `code:review` | Exists, untracked | P1 |
| `git:worktree:add` | Exists, untracked | P1 |
| `git:pr:create` | New (extract from implement) | P1 |
| `git:pr:monitor` | New | P2 |
| `comms:pr-announce` | New | P2 |

---

## Implementation Plan

### Phase 1: Foundation
1. Define CLAUDE.md schema
2. Create CLAUDE.EXAMPLE.md reference
3. Implement context loader (parse workspace/project CLAUDE.md)
4. Implement state management (save/load/update)

### Phase 2: Core Workflow
1. Create `workflow:feature-to-develop` skeleton
2. Wire up existing skills (code:plan, code:implement)
3. Add HITL gates
4. Test end-to-end with one project

### Phase 3: Feedback Loop
1. Create `workflow:pr-feedback-loop`
2. Implement rule learning (write to ia/skills/)
3. Wire into main workflow
4. Test self-improvement cycle

### Phase 4: Polish
1. Complete missing atomic skills
2. Add comms:pr-announce with hooks
3. Multi-project testing
4. Documentation

---

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| HITL mechanism | Inline wait (~30min), fallback to state resume |
| Skill naming | `workflow:` prefix for orchestrators |
| Project config location | workspace/CLAUDE.md + project/CLAUDE.md |
| Learned rules storage | project/ia/skills/{skill}/instructions.md |
| Workflow composition | Yes, workflows can call workflows |
| Skill output format | Standardized via `skill:format:out` |
| Self-education | `skill:retrospective` (analyse) + `skill:feedback` (HITL) |
| State location | project/ia/state.json (ephemeral, gitignored) |
| Post-workflow | TODO.md generated for human to challenge later |

## Remaining Questions

1. **State cleanup** - When to delete old workflow states?
2. **Parallel workflows** - Can run multiple tickets simultaneously?
3. **Error recovery** - Automatic retry vs manual intervention?
4. **Metrics** - Track cycle time, failure rates?

---

## References

- **Agent Skills Spec:** https://agentskills.io
- **Existing Skills:** `.claude/skills/`
- **Work Item System:** `work-item/` (ports/adapters)
- **Project Registry:** `project-registry/`
- **Skill Design Best Practices:** `/skill:design`

---

**End of Design Document**
