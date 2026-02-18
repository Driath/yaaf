---
name: workitem:draft
description: List all Draft tickets across configured work item sources, suggest the best one to tackle, challenge the idea, help refine the description, then move it to Todo.
compatibility: Designed for Claude Code and Gemini CLI with access to bun and scripts/jira/
---

# workitem:draft

Backlog grooming for Draft tickets. Lists all drafts across projects, suggests the best pick, challenges the scope, and moves to Todo when ready.

## Step 1: Fetch all Draft tickets

Read `dispatchator.config.ts` to get all configured projects and their `spawnStatus`.

For each project, fetch tickets in the draft status (the status that precedes `spawnStatus` on the board):

```bash
bun scripts/jira/search-issues.ts "project = <KEY> AND status = \"Draft\"" --fields=summary,description,labels,priority
```

Repeat for each project in `workItems`.

## Step 2: Display as a table

Render a markdown table:

| # | Key | Project | Summary | Labels |
|---|-----|---------|---------|--------|
| 1 | WIA-3 | WIA | feat: ... | |
| 2 | DGDTION-12 | DGDTION | fix: ... | workflow:intent |

Then suggest the best ticket to tackle next. Criteria (in order):
1. Has a clear, actionable summary
2. Has labels hinting at a known workflow
3. Smallest scope (prefer focused over broad)
4. Oldest creation date as tiebreaker

State the suggestion and why in one sentence.

## Step 3: User selects

Ask the user which ticket to work on (by number or key). Accept their choice or default to the suggestion if they confirm.

## Step 4: Can workflow:intent run this without HITL?

Read the full ticket:

```bash
bun scripts/jira/get-issue.ts <KEY>
```

Simulate what `workflow:intent` would do with this ticket cold. It needs to:
- Understand what to do from summary + description alone
- Route to the right `workflow:*` without asking
- Execute without missing context

**If yes** → proceed to step 5.

**If no** → identify exactly what's missing, tell the user, and challenge them to fill the gap. Iterate until the ticket is ready. Examples of what may be missing:
- Summary too vague to route
- Goal not stated
- No acceptance criteria
- Ambiguous scope
- Missing `IA:PROJECT:*` when codebase context is needed

Never move to Todo until you're confident `workflow:intent` won't hit HITL.

## Step 5: Help refine the description

If the description is missing or thin, propose an improved version based on the discussion:

```
**Context**: ...
**Goal**: ...
**Acceptance criteria**: ...
```

Ask for confirmation before updating:

```bash
bun scripts/jira/update-issue.ts <KEY> --description="..."
```

Also suggest labels based on what was discussed. Use this reference:

| Need | Label |
|------|-------|
| Simple task, fast execution | `IA:MODEL:SMALL` |
| Complex reasoning needed | `IA:MODEL:STRONG` |
| Deep analysis / architecture | `IA:MODEL:STRONG` + `IA:CAP:THINK` |
| Requires a plan before coding | `IA:AGENT:PLAN` |
| Use Gemini instead of Claude | `IA:PROVIDER:GEMINI` |
| Target a specific workflow | `IA:WORKFLOW:<NAME>` (e.g. `IA:WORKFLOW:INTENT`, `IA:WORKFLOW:WORK_ITEM_TO_CODE_PLAN`) |
| Scope to a specific project | `IA:PROJECT:<name>` |

Suggest only what's relevant — don't dump all labels. One sentence justification per suggested label.

```bash
bun scripts/jira/update-issue.ts <KEY> --labels="IA:MODEL:STRONG,IA:WORKFLOW:WORK_ITEM_TO_CODE_PLAN"
```

## Step 6: Move to Todo

Once the user is satisfied:

```bash
bun scripts/jira/transition-issue.ts <KEY>
```

List available transitions, identify the one matching `spawnStatus` of the project, then apply it:

```bash
bun scripts/jira/transition-issue.ts <KEY> <transition-id>
```

## Step 7: Confirm

```
✅ <KEY> moved to Todo — the dispatchator will pick it up on next poll.
```
