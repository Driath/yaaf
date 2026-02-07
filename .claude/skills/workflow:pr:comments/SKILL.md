---
name: workflow:pr:comments
description: Discuss PR comments with user, prioritize, create plans and execute in background
---

# workflow:pr:comments

Fetch PR comments, discuss with user to prioritize and decide actions, then dispatch to background agents.

## Usage

```
/workflow:pr:comments [pr=NUMBER]
```

## Arguments

- `pr` (optional): PR number. Auto-detected from current branch if not provided.

## Instructions

### 1. Fetch Comments

```bash
# Get PR number from branch if not provided
gh pr view --json number

# Inline review comments
gh api repos/{owner}/{repo}/pulls/{pr}/comments

# General comments
gh pr view {pr} --json comments,reviews
```

### 2. Early Exit

If no comments:
```
---
✅ workflow:pr:comments completed

## Result
No comments to process.
---
```

### 3. Present Comments

Show ALL comments for discussion:

```
## PR #{number} Comments

| # | File:Line | Comment | Priority |
|---|-----------|---------|----------|
| 1 | SKILL.md:4 | "add model:sonnet?" | ? |
| 2 | SKILL.md:26 | "understand project" | ? |

Let's discuss and prioritize.
```

### 4. HITL: Discuss & Prioritize

Have a conversation with the user:

- Understand each comment
- Discuss solutions
- Agree on priority (high/medium/low/skip)
- Decide action type (FIX/REPLY/SKIP)

Continue until user says "go" or similar.

### 5. Create Plans & Dispatch

For each agreed action (not skipped):

1. Create a plan file:
```markdown
# todos/plans/pr-{pr}-comment-{id}.md
---
name: pr-{pr}-comment-{id}
status: pending
created: {date}
type: pr-comment
---

# PR Comment #{id}

## Context
File: {file}:{line}
Comment: "{comment text}"

## Plan
1. {ACTION}: {description}

## Reply
"{reply message to post}"
```

2. Immediately dispatch to background:
```
Task(
  subagent_type: "workflow",
  model: "haiku",
  run_in_background: true,
  prompt: "Execute /git:pr:comments plan=todos/plans/pr-{pr}-comment-{id}.md"
)
```

### 6. Continue or Finish

After dispatching:
- If more comments to discuss → continue HITL
- If all done → show summary

### 7. Output

```
---
✅ workflow:pr:comments completed

## Actions
- Discussed: {n} comments
- Dispatched: {n} background tasks
- Skipped: {n}

## Background Tasks
| Comment | Plan | Status |
|---------|------|--------|
| #1 | pr-22-comment-1.md | 🚀 Running |
| #2 | pr-22-comment-2.md | 🚀 Running |

## Skipped
- #3: {reason}
---
```

## Key Principle

**Discuss while agents work.** Create plans and dispatch immediately, continue conversation with user while fixes happen in background.
