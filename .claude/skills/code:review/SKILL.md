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

Get current user and categorize comments by author:

```
current_user = git config user.email / gh api user
```

#### 4a. My Own Comments (self-review)

For each of my unresolved comments:

```
1. Analyze comment
2. IF understood AND pertinent:
   - Implement fix
   - Reply in thread: "Fixed by [commit]"
   - Resolve conversation
3. IF not pertinent OR unclear:
   - HITL: "Tu as laissé ce commentaire: '{comment}'
           Je ne suis pas sûr de comprendre / ça me semble pas pertinent parce que {reason}.
           On fait quoi ?"
   - IF user clarifies → implement and resolve
   - IF user dismisses → resolve without action
```

#### 4b. External Reviewer Comments

For comments from other reviewers:

```
1. Group all unresolved comments
2. Create action plan:

   ## Plan d'action pour les commentaires de @{reviewer}

   | # | Comment | Proposed Action | Confidence |
   |---|---------|-----------------|------------|
   | 1 | "Add error handling" | Add try-catch in api.ts:42 | ✅ High |
   | 2 | "Why this approach?" | Explain in thread (no code change) | 🟡 Medium |
   | 3 | "Consider using X" | Refactor to use X | ❓ Need input |

3. HITL: Present plan to user
   - "Voici mon plan pour traiter les commentaires. OK ?"

4. IF plan NOT OK:
   - User provides feedback
   - Revise plan
   - HITL again until approved

5. IF plan OK:
   - Execute each action
   - Reply to each thread with action taken
   - DO NOT resolve (reviewer should resolve their own comments)
```

### 5. Apply Fixes

```bash
# If fixes were made
git add .
git commit -m "fix: address review feedback

- [list of fixes]"
git push
```

Inform user:
```
✅ Fixes pushed. En attente de re-review par @{reviewer}.
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
