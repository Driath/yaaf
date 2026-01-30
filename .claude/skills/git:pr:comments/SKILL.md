---
name: git:pr:comments
description: Execute a PR comment plan - apply fix, post reply, cleanup
model: haiku
---

# git:pr:comments

Execute a PR comment plan. No decision-making - just follow the plan.

## Usage

```
/git:pr:comments plan="todos/plans/pr-22-comment-1.md"
```

## Arguments

- `plan` (required): Path to the plan file

## Instructions

### 1. Read Plan

Read the plan file. Extract:
- `type`: Must be `pr-comment`
- File/line context
- Action (FIX/REPLY)
- Reply message

### 2. Execute Action

**If FIX:**
1. Read the target file
2. Apply the fix as described in plan
3. Commit:
```bash
git add {file}
git commit -m "fix: address PR comment - {short description}"
git push
```

**If REPLY only:**
Skip to step 3.

### 3. Post Reply & Resolve

```bash
# Reply to inline comment
gh api repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies \
  -f body="{reply message from plan}"

# Resolve the conversation (GraphQL)
gh api graphql -f query='
  mutation {
    resolveReviewThread(input: {threadId: "{thread_id}"}) {
      thread { isResolved }
    }
  }
'
```

**Note:** To get thread_id, use:
```bash
gh api repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id} --jq '.node_id'
```

### 4. Cleanup

Delete the plan file:
```bash
rm {plan}
```

### 5. Output

```
---
✅ git:pr:comments completed

## Actions
- Action: {FIX|REPLY}
- File: {file}:{line} (if FIX)
- Reply: Posted
- Resolved: Yes
- Plan: Deleted

## Commit
{commit hash} (if FIX)
---
```

## Error Handling

- **Plan not found** → Error
- **Invalid plan type** → Error (must be `pr-comment`)
- **File not found** → Error
- **gh API error** → Retry once, then error

## Important

- **No interpretation** - execute exactly what the plan says
- **No decisions** - if unclear, error out
- **Always cleanup** - delete plan even on partial success
