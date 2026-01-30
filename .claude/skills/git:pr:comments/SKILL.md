---
name: git:pr:comments
description: Fetch PR comments, create a plan, get approval, then process
agent: Plan
---

# git:pr:comments

Fetch and analyze PR comments, propose a plan for handling them, get HITL approval, then execute via `git:pr:comments:process`.

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
gh pr view {pr.number} --json comments,reviews,reviewThreads
```

Extract:
- Review comments (inline on code)
- General comments
- Review decisions (approve/request-changes)

### 2. Early Exit

If no unresolved comments:
```
---
✅ git:pr:comments completed

## Actions
- Fetched comments: 0 unresolved

## Result
No comments to process.
---
```
→ Exit, parent continues

### 3. Analyze & Classify

For each comment, determine:

**Type:**
- `auto` - Can be fixed automatically (rename, add check, fix typo)
- `manual` - Needs human decision (architecture, approach question)

**Subject:**
- `code-style` - formatting, naming, conventions
- `logic` - bug, edge case, error handling
- `architecture` - design, pattern, structure
- `docs` - comments, types, readme
- `test` - coverage, missing cases
- `security` - vulnerability, validation
- `perf` - optimization

**Importance:**
- `blocking` - Must resolve to merge (request-changes)
- `suggestion` - Nice to have
- `question` - Needs response
- `nitpick` - Ignorable

**Auto criteria:**
```
IF (well understood from context)
   AND (consistent with codebase)
   AND (technically feasible)
   AND (no architecture decision)
   AND (isolated change, no side effects)
→ type: auto
ELSE
→ type: manual
```

### 4. Write PLAN.md

Create `/ia/state/{branch}/pr/PLAN.md`:

```markdown
# PR Comments Plan

Branch: {branch}
PR: #{number}
Generated: {timestamp}

## Summary
- Total: {n} comments
- Auto: {n} (can be fixed automatically)
- Manual: {n} (need human input)

## Comments

| # | Type | Subject | Importance | Comment | Proposed Action |
|---|------|---------|------------|---------|-----------------|
| 1 | auto | code-style | suggestion | "Rename x to userId" | fix: rename variable |
| 2 | manual | architecture | question | "Why this approach?" | reply: "{proposed response}" |
| 3 | auto | logic | blocking | "Add null check" | fix: add null check |
| 4 | manual | architecture | suggestion | "Consider Redux?" | reply: "Hors scope" |
```

### 5. HITL Approval

Present plan and ask:

```
## PR Comments Plan

| # | Type | Action |
|---|------|--------|
| 1 | auto | fix: rename variable |
| 2 | manual | reply: "Pour isoler la logique métier" |
| 3 | auto | fix: add null check |
| 4 | manual | reply: "Hors scope pour cette PR" |

Options:
- "Approve all" (Recommended)
- "Manage plan"
```

**If "Approve all"** → Continue to step 6

**If "Manage plan"** → User provides modifications:
```
> "2: skip, 4: reformule 'On peut en discuter en sync'"
```
Update PLAN.md, re-show, re-HITL until approved.

### 6. Generate TODO.md

Create `/ia/state/{branch}/pr/TODO.md` from approved plan:

```markdown
# PR Comments TODO

Branch: {branch}
PR: #{number}
Generated: {timestamp}

## Tasks

- [ ] FIX #1: Rename `x` to `userId` in src/foo.ts:42
- [ ] REPLY #2: "Pour isoler la logique métier"
- [ ] FIX #3: Add null check in src/bar.ts:17
- [ ] SKIP #4

## Done
(none yet)
```

### 7. Execute Process

Execute `/git:pr:comments:process`

This will read TODO.md and execute each task.

### 8. Commit & Push

If changes were made:

```bash
git add -A
git commit -m "fix: address PR comments

- {summary of fixes}"
git push
```

### 9. Output

```
---
✅ git:pr:comments completed

## Actions
- Fetched {n} comments
- Plan: {auto} auto, {manual} manual
- Processed: {fixes} fixes, {replies} replies, {skipped} skipped

## Result
PR comments addressed.

## Files
- /ia/state/{branch}/pr/PLAN.md
- /ia/state/{branch}/pr/TODO.md

## Notes
- {observations}
---
```

## Error Handling

- **No PR context** → Error: "Missing pr.number"
- **gh CLI error** → Surface error
- **Plan rejected multiple times** → HITL: "Abandon comment processing?"

## HITL Gates

| Gate | Trigger | Options |
|------|---------|---------|
| Plan approval | After analysis | Approve all / Manage plan |
| Abandon | Multiple rejections | Yes / No |
