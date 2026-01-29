---
name: code:review
description: Review code quality, conventions, and address PR comments. Provider-agnostic.
---

# code:review

Review code for quality, conventions, security, and address PR feedback comments.

## Usage

```
/code:review
```

## Context Required

Passed by orchestrator:
- `git.provider`: github | gitlab | azure
- `pr.number`: PR number (if reviewing PR comments)
- Additional context from `ia/skills/code:review/instructions.md` (project-specific rules)

## Instructions

### 1. Determine Review Mode

Based on context:
- **Has PR context** → Review code + address PR comments
- **No PR context** → Review code only (pre-commit review)

### 2. Load Project Rules

Read `ia/skills/code:review/instructions.md` if exists for:
- Custom linting rules
- Naming conventions
- Security requirements
- Patterns to avoid

### 3. Review Code

Analyze code for:

**Quality:**
- Code duplication
- Dead code
- Overly complex functions
- Missing error handling

**Conventions:**
- Naming conventions
- File structure
- Import organization
- Comment quality

**Security:**
- No secrets in code
- No console.log in production
- Proper input validation
- SQL injection prevention

### 4. Address PR Comments (if PR context)

For each unresolved comment:

```
1. Analyze comment
2. Determine if auto-fixable:
   - ✅ Linter errors → Auto
   - ✅ Type errors → Auto
   - ✅ Missing null checks → Auto
   - ✅ "Add tests" → Auto (if straightforward)
   - ❌ "Why did you do X?" → Needs human
3. If auto-fixable:
   - Implement fix
   - Reply in thread: "Fixed by [commit]"
4. If needs human:
   - Flag for HITL
```

### 5. Apply Fixes

```bash
# If fixes were made
git add .
git commit -m "fix: address review feedback

- [list of fixes]"
git push
```

### 6. Output

Follow `/skill:format:out`:

```
---
✅ code:review completed

## Actions
- Reviewed {X} files
- Found {Y} issues
- Fixed {Z} issues automatically
- Addressed {N} PR comments

## Issues Found

| Severity | Issue | File | Status |
|----------|-------|------|--------|
| 🔴 High | No error handling | api/auth.ts:42 | Fixed |
| 🟡 Medium | console.log | utils/debug.ts:15 | Fixed |
| 🟢 Low | Long function | components/Form.tsx | Flagged |

## PR Comments Addressed

| Comment | Author | Status |
|---------|--------|--------|
| "Add error handling" | @reviewer | ✅ Fixed |
| "Why this approach?" | @reviewer | ❓ Needs human |

## Corrections
- Removed console.log (3 occurrences)
- Added try-catch to form submission
- Fixed import order

## Notes
- 1 comment requires human response
- Consider splitting Form.tsx (>300 lines)
---
```

## Error Handling

- **No files to review** → Exit with message
- **Cannot auto-fix** → Flag for HITL, continue with other fixes
- **Push fails** → Show error, suggest git pull --rebase
