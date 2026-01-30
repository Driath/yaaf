---
name: workflow:retrospective
description: Analyze completed workflow execution and propose skill improvements.
---

# workflow:retrospective

Analyze a completed workflow execution to identify friction points and propose concrete improvements to the skills used.

## Usage

```
/workflow:retrospective
```

Called optionally after a workflow completes to analyze and improve skills.

## Context Required

From the completed workflow:
- Outputs from all skills executed (following `skill:format:out`)
- Corrections made during execution
- HITL interventions that occurred
- Errors encountered

## Instructions

### 1. Gather Session Data

Collect from the conversation context:
- Which workflow was executed
- Which skills were called
- Each skill's output (Actions, Corrections, Notes sections)
- Any HITL moments (questions asked, user interventions)
- Errors or retries

### 2. Analyze Execution

Evaluate:

**What worked well:**
- Skills that executed smoothly
- Correct assumptions made
- Efficient paths taken

**Friction points:**
- Steps that required manual intervention
- Corrections that had to be made
- Misunderstandings or wrong assumptions
- Repeated attempts or loops

### 3. Generate Improvement Proposals

For each friction point, propose a concrete skill improvement:

```
Friction: Had to ask user for reviewer because skill didn't know
Skill: git:pr:create
Proposal: Add step to check ia/skills/git:pr:create/instructions.md for default reviewers
```

Proposals must be:
- **Specific** - exact change to make
- **Actionable** - can be applied immediately
- **Scoped** - one change per proposal

### 4. Present to User (HITL)

For each proposal:

```
## Proposal: {skill-name}

**Problem:** {what went wrong}

**Current behavior:**
{relevant excerpt from SKILL.md}

**Proposed change:**
{new/modified content}

Apply this improvement? [Yes / No / Modify]
```

### 5. Apply Approved Changes

For each approved proposal:
1. Read the skill's SKILL.md
2. Apply the modification
3. Confirm change made

### 6. Output

Follow `/skill:format:out`:

```
---
✅ workflow:retrospective completed

## Session Analysis
- Workflow: {workflow name}
- Skills executed: {list with count}
- HITL interventions: {count}
- Corrections made: {count}

## What Worked Well
- {positive observation 1}
- {positive observation 2}

## Friction Points

| Issue | Skill | Status |
|-------|-------|--------|
| {issue} | {skill} | ✅ Improved / ❌ Skipped / 🔄 Deferred |

## Improvements Applied

| Skill | Change |
|-------|--------|
| {skill} | {summary of change} |

## Notes
- {observations for future sessions}
- {patterns noticed}
---
```

## Error Handling

- **No friction points found** → Output positive summary, no proposals
- **User rejects all proposals** → Log for pattern recognition, exit gracefully
- **Cannot parse skill output** → Note in friction points, suggest standardizing output

## Example Session

After `/workflow:pr` completes:

```
---
✅ workflow:retrospective completed

## Session Analysis
- Workflow: workflow:pr
- Skills executed: git:pr:find, git:pr:create, git:pr:status (3)
- HITL interventions: 1
- Corrections made: 2

## What Worked Well
- Branch detection worked correctly
- PR creation succeeded on first attempt
- Status check accurately reported CI state

## Friction Points

| Issue | Skill | Status |
|-------|-------|--------|
| Asked for reviewer manually | git:pr:create | ✅ Improved |
| Didn't detect existing PR | git:pr:find | ❌ Skipped (edge case) |

## Improvements Applied

| Skill | Change |
|-------|--------|
| git:pr:create | Added: check instructions.md for default reviewers |

## Notes
- Consider caching PR lookup results
- git:pr:find edge case: PR exists but on different remote
---
```
