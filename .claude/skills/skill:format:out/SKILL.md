---
name: skill:format:out
description: Standard output format for all skills. Reference this to ensure consistent, parseable output.
---

# skill:format:out

Defines the standard output format for all skills. This enables orchestrators to parse skill outputs and feed `skill:retrospective`.

## Usage

In any skill's SKILL.md:

```markdown
## Output

Follow `/skill:format:out`
```

## Format

Every skill must end with this structured output:

```
---
✅ {skill-name} completed

## Actions
- {what was done, one item per line}

## Corrections
- {adjustments made during execution}
- {things that had to be fixed or retried}

## Notes
- {observations, difficulties encountered}
- {user feedback received}
- {suggestions for improvement}
---
```

## Rules

1. **Always include all sections** - even if empty, write `- (none)`
2. **Actions** - factual, what happened
3. **Corrections** - things that went wrong and were fixed
4. **Notes** - subjective observations, learnings

## Examples

### Successful execution, no issues

```
---
✅ code:implement completed

## Actions
- Created src/components/Button.tsx
- Modified src/App.tsx to import Button
- Ran npm install for new dependencies

## Corrections
- (none)

## Notes
- (none)
---
```

### Execution with corrections

```
---
✅ code:implement completed

## Actions
- Created src/auth/login.ts
- Created src/auth/logout.ts
- Modified src/routes.ts

## Corrections
- Fixed import paths (changed relative to absolute)
- Added missing TypeScript types after compilation error

## Notes
- User requested simpler approach without Redux
- Consider adding auth pattern to project conventions
---
```

### Execution with HITL feedback

```
---
✅ code:plan completed

## Actions
- Analyzed ticket KAN-4 requirements
- Created implementation plan at plans/api-KAN-4.md

## Corrections
- (none)

## Notes
- User asked to add JWT vs session comparison
- User wants smaller PRs, split into 2 phases
---
```

## Why This Matters

1. **Orchestrators** can parse outputs programmatically
2. **skill:retrospective** uses Corrections and Notes to suggest improvements
3. **Consistent UX** - users know what to expect from any skill
4. **Self-documenting** - output explains what happened

## Parsing

Orchestrators can parse this format:

```typescript
// Pseudo-code
const output = skillOutput.split('---')[1];
const actions = extractSection(output, 'Actions');
const corrections = extractSection(output, 'Corrections');
const notes = extractSection(output, 'Notes');

state.steps.push({
  skill: skillName,
  output: { actions, corrections, notes }
});
```
