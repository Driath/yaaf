---
name: workflow:smoke-test-child
description: Child smoke test. Posts a comment on itself and transitions parent to Terminé.
model: haiku
agent: workflow
---

# workflow:smoke-test-child

Executed by subtasks created by `workflow:smoke-test`. Validates that child agents can act on parent tickets.

## Input

`workItemId` - Jira subtask ID (e.g., KAN-19)

## Step 1: Fetch Ticket

Read the work item from Jira:

```
/jira {workItemId}
```

Extract: `summary`, `status`, `parent key`.

## Step 2: Transition Parent to Terminé

Transition the **parent** ticket to **Terminé**.

## Step 3: Post Report Comment

Post a comment on `{workItemId}` (the subtask itself):

```
## workflow:smoke-test-child report

- Ticket: {workItemId}
- Parent: {parentKey} → Terminé
- Timestamp: {ISO 8601}
- Status: PASS
```

## Done

The comment on the subtask sets `commentCount > 0`, preventing re-spawn.
