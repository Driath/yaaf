# Skill Authoring Best Practices

## Progressive Disclosure in Detail

### Level 1: Metadata (Always Loaded)

**Purpose:** Skill discovery - help Claude decide when to use this skill.

**Guidelines:**
- `name`: Short, kebab-case identifier (e.g., `code:feature`, `git:pr:create`)
- `description`: One sentence, action-oriented, specific (50-100 chars)

**Examples:**

✅ **Good:**
```yaml
name: pdf:extract
description: Extract text and tables from PDF files using pdfplumber
```

❌ **Bad:**
```yaml
name: pdf
description: Do stuff with PDFs
```

### Level 2: SKILL.md Body (Loaded on Activation)

**Purpose:** Core instructions for common cases.

**Guidelines:**
- Target ~500 tokens (2-3 screens of text)
- Focus on the happy path
- Link to references for details
- Provide 1-2 quick examples

**Structure:**
```markdown
## When to Use
[Clear trigger conditions]

## Arguments
[List and explain each argument]

## Instructions
[Numbered steps for the core workflow]

## Example
[One concrete example]

## Detailed Guide
See [references/implementation.md](references/implementation.md)
```

### Level 3: References (Loaded on Demand)

**Purpose:** Comprehensive documentation, edge cases, project-specific rules.

**What to Put Here:**
- Detailed implementation steps
- Edge case handling
- Multiple examples
- Project-specific conventions (in `projects/` subdirectory)
- Technical background
- Troubleshooting guides

## Argument Format (MANDATORY)

**ALL skills MUST use key=value format. NEVER use positional arguments.**

### Correct Format

```bash
/skill-name property="value" anotherProperty="value"
```

### Standard Property Names

Always use these exact names (no variations):

| Property | Purpose | Example Values |
|----------|---------|----------------|
| `project` | Project type | nextjs, express, react-native |
| `path` | File/directory path | app/dashboard, src/utils |
| `key` | Work item ID | KAN-123, PROJ-456 |
| `name` | Resource name | UserProfile, api-client |
| `with*` | Boolean flags | withTests="true", withDocs="true" |

### Anti-Patterns

❌ **WRONG - Positional:**
```bash
/code:feature "app/dashboard" "nextjs"
```

❌ **WRONG - Inconsistent names:**
```bash
/code:feature filePath="..." projectName="..."  # Use path, project
```

✅ **CORRECT:**
```bash
/code:feature path="app/dashboard" project="nextjs"
```

## Multi-Project Support Patterns

### Pattern 1: Optional Project Argument

```markdown
## Usage
```
/skill-name path="..." project="..."
```

## Arguments
- `path` (required): Path to feature directory
- `project` (optional): Project type (nextjs, express, react-native)

## Instructions

1. Parse key=value arguments
2. If `project` provided:
   - Read `references/projects/{project}.md`
   - Apply project-specific conventions
3. Otherwise: Use generic conventions
```

### Pattern 2: Auto-Detect Project Type

```markdown
## Instructions

1. If `project` argument provided:
   - Use specified project type
2. Otherwise, auto-detect:
   - If `next.config.js` exists → nextjs
   - If `package.json` has "express" → express
   - Otherwise → generic
3. Load corresponding `references/projects/{detected}.md`
4. Apply conventions
```

### Pattern 3: Required Project Argument

```markdown
## Usage
```
/skill-name key="..." project="..."
```

## Arguments
- `key` (required): Work item identifier
- `project` (required): Project name

## Instructions

1. Parse key=value arguments
2. Validate project exists
3. Load `references/projects/{project}.md`
4. Execute workflow with project context
```

## Writing Deterministic Instructions

### Use Action Verbs

❌ **Vague:** "Handle the error"
✅ **Clear:** "If error code is 404, return null. If 500, throw exception."

### Specify Exact Conditions

❌ **Vague:** "If the file is big"
✅ **Clear:** "If file size > 1MB"

### Provide Exact Paths

❌ **Vague:** "Create a test file"
✅ **Clear:** "Create `tests/{module-name}.test.ts`"

### Define Success Criteria

```markdown
## Success Criteria

✅ File created at correct path
✅ File contains all required sections
✅ File passes linting (run: `npm run lint`)
✅ Tests pass (run: `npm test`)
```

## Examples Section Best Practices

### Multiple Scenarios

```markdown
## Examples

### Example 1: Simple Feature
Input: `/code:feature path="app/dashboard"`
Output: Creates `app/dashboard/page.tsx` with boilerplate

### Example 2: With Project Type
Input: `/code:feature path="app/api/users" project="express"`
Output: Creates Express router with CRUD endpoints

### Example 3: Nested Path
Input: `/code:feature path="features/auth/login" project="nextjs"`
Output: Creates Next.js page with App Router structure
```

### Show Expected Output

```markdown
## Example

Input: `/code:test path="src/utils/format.ts"`

Expected files created:
```
tests/utils/format.test.ts
```

Expected content:
```typescript
import { describe, it, expect } from 'vitest';
import { formatDate } from '../../src/utils/format';

describe('formatDate', () => {
  it('should format date correctly', () => {
    // test implementation
  });
});
```
```

## Error Handling Patterns

### Validate Inputs Early

```markdown
## Instructions

1. Validate arguments:
   - If path is empty → Error: "path argument required"
   - If path doesn't exist → Error: "Directory not found: {path}"
   - If project invalid → Error: "Unknown project: {project}"
2. If validation fails, stop and show error
3. Proceed with workflow
```

### Provide Recovery Steps

```markdown
## Error Handling

### File Already Exists
1. Show error: "File already exists: {path}"
2. Ask user: "Overwrite? (y/n)"
3. If yes → Overwrite
4. If no → Append timestamp to filename

### Missing Dependencies
1. Detect missing package
2. Show error: "Package {name} not installed"
3. Suggest: "Run: npm install {name}"
4. Wait for user to install before proceeding
```

## Skill Composition Patterns

### Pattern 1: Sequential Execution

```markdown
# orchestration:deploy

## Instructions

1. Run tests: `/test:run project="{project}"`
2. Build project: `/build:production project="{project}"`
3. Deploy: `/deploy:vercel project="{project}"`
```

### Pattern 2: Conditional Execution

```markdown
## Instructions

1. Check if tests exist: `/test:check path="tests"`
2. If tests exist:
   - Run: `/test:run project="{project}"`
   - If tests fail → Stop
3. Proceed with deployment
```

### Pattern 3: Parallel Tasks

```markdown
## Instructions

1. In parallel:
   - Lint code: `/lint:check path="src"`
   - Type check: `/type:check path="src"`
   - Format check: `/format:check path="src"`
2. Wait for all to complete
3. If any failed → Show errors and stop
4. Proceed with next step
```

## Project References Structure

### Template for references/projects/{project}.md

```markdown
# {Project Name} Conventions

## Tech Stack
- Framework: {name} {version}
- Language: {TypeScript/JavaScript}
- Build tool: {Vite/Next.js/etc}

## File Structure
```
project-root/
├── src/
│   ├── components/
│   ├── pages/
│   └── utils/
```

## Naming Conventions
- Files: kebab-case (user-profile.tsx)
- Components: PascalCase (UserProfile)
- Functions: camelCase (getUserProfile)

## Code Style
- Prefer functional components
- Use TypeScript strict mode
- Export named exports (not default)

## Testing
- Test files: {name}.test.ts
- Coverage minimum: 80%
- Run: npm test

## Build & Deploy
- Dev: npm run dev
- Build: npm run build
- Deploy: npm run deploy
```

## Anti-Patterns to Avoid

### ❌ Overly Complex Skills

Don't try to do everything in one skill. Split complex workflows into multiple composable skills.

**Bad:**
```
/code:full-stack-feature  (tries to do frontend + backend + tests + deploy)
```

**Good:**
```
/orchestration:full-stack
  ├─ /code:frontend
  ├─ /code:backend
  ├─ /test:run
  └─ /deploy:production
```

### ❌ Positional Arguments

Don't use positional arguments. Always use key=value format.

**Bad:**
```bash
/code:feature "app/dashboard" "nextjs"
```

**Good:**
```bash
/code:feature path="app/dashboard" project="nextjs"
```

### ❌ Hardcoded Values

Don't hardcode project-specific values in SKILL.md.

**Bad:**
```markdown
3. Create file at `src/components/Button.tsx`
```

**Good:**
```markdown
3. Create file at `{components-dir}/{name}.tsx`
   - For Next.js: components-dir = `components/`
   - For React Native: components-dir = `src/components/`
```

### ❌ Ambiguous Instructions

Don't use vague terms like "check", "handle", "process" without specifics.

**Bad:**
```markdown
2. Process the file
3. Handle any errors
```

**Good:**
```markdown
2. Parse the file:
   - Extract imports (lines starting with 'import')
   - Extract exports (lines starting with 'export')
3. Error handling:
   - If file not found → Show error and stop
   - If syntax error → Show line number and stop
```

### ❌ Missing Edge Cases

Don't only document the happy path.

**Bad:**
```markdown
## Instructions
1. Read file
2. Parse content
3. Save output
```

**Good:**
```markdown
## Instructions
1. Read file
   - If not found → Error and stop
   - If permission denied → Request sudo access
2. Parse content
   - If invalid JSON → Show syntax error
   - If empty file → Use default values
3. Save output
   - If directory doesn't exist → Create it
   - If file exists → Ask to overwrite
```

## Testing Your Skills

### Manual Testing Checklist

- [ ] Test with minimal arguments
- [ ] Test with all arguments
- [ ] Test with invalid arguments
- [ ] Test with non-existent paths
- [ ] Test with different project types
- [ ] Test error recovery paths
- [ ] Test integration with other skills

### Documentation Review

- [ ] Frontmatter is valid YAML
- [ ] Description is clear and specific
- [ ] Instructions are numbered and deterministic
- [ ] Examples are concrete and realistic
- [ ] Edge cases are documented
- [ ] Links to references work
- [ ] Project references exist if mentioned

## Versioning and Maintenance

### When to Update Skills

- User reports unexpected behavior → Add edge case handling
- New project type → Add `references/projects/{new-project}.md`
- Instructions unclear → Add examples or rewrite steps
- Breaking change in tool → Update instructions and version

### Documenting Changes

Use Git commit messages to document skill changes:

```
Update code:feature for Next.js 14 App Router

- Add support for Server Components
- Update file structure conventions
- Add example for async components
```

## Summary Checklist

When creating a new skill:

- [ ] Clear, specific name and description in frontmatter
- [ ] Concise SKILL.md body (~500 tokens)
- [ ] Detailed references/implementation.md
- [ ] Project-specific rules in references/projects/
- [ ] Numbered, deterministic instructions
- [ ] Concrete examples with expected output
- [ ] Edge case handling documented
- [ ] Error recovery steps provided
- [ ] Integration with other skills considered
- [ ] Manually tested with various inputs
