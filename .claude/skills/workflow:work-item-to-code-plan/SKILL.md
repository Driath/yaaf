---
name: workflow:work-item-to-code-plan
description: Create implementation plan from work item. Fetches context, explores codebase, generates plan, creates subtask for implementation.
model: sonnet
agent: workflow
---

# workflow:work-item-to-code-plan

Creates a detailed implementation plan from a work item and persists it as a Jira subtask ready for an implementation agent.

## Input

| Param | Source | Description |
|-------|--------|-------------|
| workItemId | argument | Jira ticket ID (e.g., KAN-4) |
| projectName | `IA:PROJECT:*` label | Project identifier for loading overrides |

## Steps

### 1. Fetch Work Item & Determine Project

```
1. Fetch {workItemId} from Jira (summary, description, labels)
2. Extract projectName from label IA:PROJECT:*
3. If no IA:PROJECT:* label:
   a. Read ia/context-sample.md to get available projects
   b. HITL: Ask user to select project from the list
   c. Add IA:PROJECT:{selected} label to the ticket
```

### 2. Load Project Overrides

If `references/projects/{projectName}.md` exists → load it for project-specific requirements.

### 3. Explore Codebase

Use Explore agent:
- Find relevant files for the task
- Identify patterns, conventions, existing components
- Map dependencies

### 4. Generate Plan

```markdown
## Summary
{one-line description}

## Files to Modify/Create
- path/to/file.ts - {what to do}

## Implementation Steps
1. {step}
2. {step}

## Tests
{E2E scenarios if required by project overrides}

## Estimated Complexity
{SMALL | MEDIUM | STRONG} - {justification}
```

### 5. HITL: Validate Plan

```
## Plan: {workItem summary}

{generated plan}

Suggested model: {SMALL|MEDIUM|STRONG}
Approve? [Y/n/modify]
```

### 6. Create Subtask & Exit

Create Jira subtask:
```
Parent: {workItemId}
Summary: "Implement: {original summary}"
Description: {approved plan}
Labels: IA:MODEL:{suggested}, IA:WORKFLOW:IMPLEMENT, IA:PROJECT:{projectName}
Status: À faire
```

Then `/exit`.

## Output

```
✓ {workItemId} → Subtask {subtaskId} (model: {suggested})
```
