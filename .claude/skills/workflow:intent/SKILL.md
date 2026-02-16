---
name: workflow:intent
description: Smart router. Analyzes a work item without a defined workflow, proposes the appropriate workflow, adds the label and exits.
model: haiku
agent: workflow
---

# workflow:intent

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

## Step 5: Create Subtask & Exit

1. Add `IA:WORKFLOW:{workflow}` label to the parent ticket (for tracking)
2. Read the target workflow's SKILL.md header to extract `model`
3. Map the model to label: `sonnet` → `IA:MODEL:MEDIUM`, `opus` → `IA:MODEL:STRONG`, `haiku` → omit (default)
4. Create a **Jira subtask** under `{workItemId}` with:
   - Summary: same as parent
   - Labels: `IA:WORKFLOW:{workflow}` + model label (if not haiku) + collected argument labels
   - Description: copy from parent
5. Transition the subtask to **Agent-Ready**

The dispatchator will pick up the subtask with the correct workflow label and spawn a new agent.
