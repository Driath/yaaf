---
name: workflow:intent
description: Smart router. Analyzes a work item without a defined workflow, proposes the appropriate workflow, adds the label and exits.
model: haiku
agent: workflow
---

# workflow:intent

**IMPORTANT: Before doing ANYTHING else, fetch the ticket and check its labels.**

If the ticket has ANY label starting with `IA:WORKFLOW:` then run:
```bash
touch ia/state/agents/{workItemId}.kill-agent
```
Then STOP. Do nothing else. The workflow is done.

---

Only continue below if NO `IA:WORKFLOW:*` label exists:

## Input

`workItemId` - Jira ticket ID (e.g., KAN-4)

## Step 1: Discover Workflows

```bash
ls -d .claude/skills/workflow:*/ | xargs -I{} head -20 {}/SKILL.md
```

## Step 2: Classify

Match ticket against workflows. If unclear → HITL.

## Step 3: Collect Arguments

Extract `IA:PROJECT:*` from labels. If missing → ask user.

## Step 4: Confirm (HITL)

```
Add IA:WORKFLOW:{workflow} to {workItemId}?
```

## Step 5: Update

1. Add `IA:WORKFLOW:{workflow}` label
2. Add collected argument labels
3. `touch ia/state/agents/{workItemId}.kill-agent`
