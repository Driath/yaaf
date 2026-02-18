---
name: workflow:intent
description: Smart router. Analyzes a work item without a defined workflow, proposes the appropriate workflow, adds the label and exits.
---

# workflow:intent

## Input

`workItemId` - Work item ID (e.g., KAN-4)

## Step 1: Discover Workflows

```bash
ls -d .gemini/skills/workflow:*/ | xargs -I{} head -20 {}/SKILL.md
```

## Step 2: Classify

Fetch `{workItemId}` (summary, description, labels) using the work item provider commands (see GEMINI.md).

Match against workflows. If unclear → HITL.

## Step 3: Collect Arguments

Extract argument labels from the ticket's labels (already fetched in Step 2).
Argument labels follow the pattern `IA:KEY:value` (e.g., `IA:PROJECT:degradation`).
Keep all `IA:*` labels except `IA:WORKFLOW:*` — these are passed to the subtask.

## Step 4: Create Subtask & Exit

1. Add `IA:WORKFLOW:{workflow}` label to the parent (update work item)
2. Read the target workflow's SKILL.md header to extract `model`
3. Map the model to label: `sonnet` → `IA:MODEL:MEDIUM`, `opus` → `IA:MODEL:STRONG`, `haiku` → omit (default)
4. Create a **subtask** under `{workItemId}` (issue type: `Subtask`, parent: `{workItemId}`):
   - Summary: same as parent
   - Labels: `IA:WORKFLOW:{workflow}` + model label (if not haiku) + collected argument labels
   - Description: copy from parent
5. Transition the subtask to **À faire**

The dispatchator will pick up the subtask with the correct workflow label and spawn a new agent.
