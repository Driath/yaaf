---
name: workflow:smoke-test
description: Smoke test workflow. Creates a subtask, posts a report comment, then exits.
model: haiku
agent: workflow
---

# workflow:smoke-test

Minimal workflow that validates the core dispatchator mechanics:
1. Jira read (fetch ticket)
2. Subtask creation (in À faire, with workflow label)
3. Comment posting (triggers commentCount anti-respawn)

## Input

`workItemId` - Jira ticket ID (e.g., KAN-17)

## Step 1: Fetch Ticket

Read the work item from Jira to confirm access:

```
/jira {workItemId}
```

Extract: `summary`, `status`, `labels`.

## Step 2: Create Subtask

Create a subtask on the work item:

- **summary**: `smoke-test-child`
- **description**: `Subtask created by workflow:smoke-test on {workItemId}`
- **labels**: `IA:WORKFLOW:smoke-test-child` (so the dispatcher picks it up and runs the child workflow)

Then transition the subtask to **À faire**.

Do NOT transition it to Terminé. The dispatcher should spawn an agent on it.

## Step 3: Post Report Comment

Post a comment on `{workItemId}` with the workflow report:

```
## workflow:smoke-test report

- Ticket: {workItemId} ({summary})
- Subtask created: {subtaskKey} → À faire
- Timestamp: {ISO 8601}
- Status: PASS
```

## Done

The comment posted in Step 3 sets `commentCount > 0`, which prevents the dispatcher from re-spawning an agent on this ticket.
