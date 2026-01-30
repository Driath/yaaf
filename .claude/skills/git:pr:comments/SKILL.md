---
name: git:pr:comments
description: Fetch PR comments, discuss openly with user, resolve together
agent: Plan
---

# git:pr:comments

Fetch PR comments and have an open discussion with the user to resolve them.

## Usage

```
/git:pr:comments
```

## Context Required

From parent (git:pr:monitor):
- `pr.number`: PR number
- `pr.branch`: Branch name

## Instructions

### 1. Fetch Comments

```bash
# Inline review comments
gh api repos/{owner}/{repo}/pulls/{pr.number}/comments

# General comments
gh pr view {pr.number} --json comments,reviews
```

### 2. Early Exit

If no unresolved comments:
```
---
✅ git:pr:comments completed

## Result
No comments to process.
---
```

### 3. Present All Comments

Show ALL comments at once for discussion:

```
## PR #12 Comments

| # | File:Line | Comment |
|---|-----------|---------|
| 1 | workflow.md:32 | "callbacks for skills - where should the responsibility?" |
| 2 | workflow.md:1 | "scripts/set-session responsibility?" |
| 3 | workflow.md:15 | "format d'instruction - pertinent? outils?" |

---

Let's discuss these. What do you think?
```

### 4. Open Discussion

Have a **real conversation** with the user:

- Listen to their thoughts
- Ask clarifying questions if needed
- Challenge ideas if relevant
- Propose solutions
- Build consensus

**This is NOT a form to fill.** It's a discussion until we agree on what to do.

Continue the conversation until the user indicates they're ready to finalize.

### 5. HITL: Confirm Plan

When discussion feels complete, summarize what was decided:

```
## Agreed Actions

| # | Comment | Action |
|---|---------|--------|
| 1 | callbacks | → Add to TODO.md: "Explore skill callbacks pattern" |
| 2 | scripts/set-session | → Reply: "Will implement in next iteration" |
| 3 | format d'instruction | → Skip for now |

Ready to process?
- "Yes, go" → generate TODO.md and process
- "Wait, let's discuss more" → continue discussion
```

### 6. Generate TODO.md

Create `/ia/state/{branch}/pr/TODO.md` with agreed actions:

```markdown
# PR Comments TODO

Branch: {branch}
PR: #{number}

## Tasks

- [ ] TODO: Explore skill callbacks pattern (from PR comment #1)
- [ ] REPLY #2: "Will implement in next iteration"
- [ ] SKIP #3

## Done
(none yet)
```

### 7. Execute Process

Execute `/git:pr:comments:process` which:
- Posts replies
- Adds items to project TODO.md if requested
- Marks conversations as resolved

### 8. Commit & Push

If changes were made:
```bash
git add -A
git commit -m "fix: address PR comments"
git push
```

### 9. Output

```
---
✅ git:pr:comments completed

## Actions
- Discussed: {n} comments
- Resolved: {n}
- Added to TODO: {n}
- Replied: {n}
- Skipped: {n}

## Files
- /ia/state/{branch}/pr/TODO.md
---
```

## Key Principle

**This is a conversation, not a form.**

- Present all comments
- Discuss openly
- Reach agreement together
- Then execute

The workflow cannot proceed until comments are resolved through discussion.
