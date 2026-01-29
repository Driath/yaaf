---
name: skill:design
description: Explains skill design principles, progressive disclosure, and multi-project patterns. Use at the start of orchestrations to load best practices.
---

# skill:design

## Purpose

Provides design principles and patterns for creating reliable, reusable skills. Called by orchestration skills to ensure consistency across all child skills.

## Skill Structure (Agent Skills Format)

Every skill follows this structure:

```
skill-name/
├── SKILL.md          # Required: frontmatter + instructions
├── references/       # Optional: detailed docs (progressive disclosure)
│   ├── implementation.md
│   └── projects/     # Optional: project-specific rules
│       ├── nextjs.md
│       ├── express.md
│       └── react-native.md
├── scripts/          # Optional: executable code
└── assets/           # Optional: templates, resources
```

### Required Frontmatter

```yaml
---
name: skill-name
description: When to use this skill (short, clear, specific)
---
```

## Progressive Disclosure Pattern

Load context in 3 levels to manage token usage:

1. **Metadata** (~50 tokens) - Always loaded at startup
   - `name` and `description` from frontmatter
   - Used for skill discovery

2. **SKILL.md Body** (~500 tokens) - Loaded when skill activated
   - Core instructions
   - Quick examples
   - Links to references

3. **references/** (~2000+ tokens) - Loaded on demand
   - Detailed implementation guides
   - Project-specific rules
   - Edge cases and examples

**Example:**

```markdown
## Quick Instructions
[Essential steps - keep under 500 tokens]

## Detailed Guide
See [references/implementation.md](references/implementation.md) for comprehensive documentation.

## Project-Specific Rules
See [references/projects/](references/projects/) for framework-specific guidelines.
```

## Argument Format (MANDATORY)

**ALL skills MUST use key=value format:**

```bash
/skill-name property="value" anotherProperty="value"
```

**NEVER use positional arguments.**

### Standard Property Names

Use these exact names consistently across all skills:

- `project` - Project type (nextjs, express, react-native, etc.)
- `path` - File or directory path
- `key` - Work item identifier (e.g., KAN-123)
- `name` - Resource name
- `with*` - Boolean flags (withTests, withDocs, withTypes)

### Examples

```bash
# Code feature with project type
/code:feature path="app/dashboard" project="nextjs"

# Work item analysis
/work-item:analyse key="KAN-123" project="DGD"

# With optional flags
/code:feature path="app/auth" project="nextjs" withTests="true" withDocs="true"
```

### Documentation Template

Document your skill's arguments clearly in SKILL.md:

```markdown
## Usage

```
/skill-name property="value" anotherProperty="value"
```

## Arguments

- `property` (required): Description of this property
- `anotherProperty` (optional): Description, default: value
- `project` (optional): Project type, loads references/projects/{project}.md
```

## Multi-Project Support Pattern

Use `references/projects/{project}.md` for project-specific rules:

```bash
/code:feature path="app/dashboard" project="nextjs"
                                            ↑
                      Loads references/projects/nextjs.md
```

### Implementation Pattern

```markdown
# In SKILL.md

## Instructions

1. Parse arguments: key=value format
2. If `project` argument provided:
   - Read `references/projects/{project}.md`
   - Apply project conventions
3. Execute core workflow
```

### Project Reference Example

```markdown
# references/projects/nextjs.md

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## File Structure
- Pages: `app/**/page.tsx`
- Components: `components/**/*.tsx`
- Server actions: `app/actions/*.ts`

## Conventions
- Use Server Components by default
- Client Components: add "use client" directive
- File naming: kebab-case
```

## Writing Clear Instructions

### 1. Be Specific and Deterministic

❌ **Bad:** "Check if the file looks correct"
✅ **Good:** "Verify the file contains: 1) import statement, 2) function declaration, 3) export statement"

### 2. Use Numbered Steps

```markdown
## Instructions

1. Read the file at {path}
2. Extract the function name from line 5
3. Create a test file named {function-name}.test.ts
4. Write test cases for each public method
```

### 3. Provide Concrete Examples

```markdown
## Example

Input: `/code:feature path="app/dashboard" project="nextjs"`

Expected output:
- Create `app/dashboard/page.tsx`
- Create `app/dashboard/layout.tsx`
- Follow Next.js App Router conventions
```

### 4. Handle Edge Cases

```markdown
## Edge Cases

- If file already exists → Ask user to confirm overwrite
- If directory doesn't exist → Create parent directories
- If no project argument → Use generic conventions
```

## Orchestration Pattern

Orchestration skills should call `/skill:design` first to load best practices:

```markdown
# orchestration:dev-workflow

## Instructions

1. **Load design principles:** `/skill:design`
2. **Analyze work item:** `/work-item:analyse key="{key}" project="{project}"`
3. **Implement feature:** `/code:feature path="{path}" project="{project}"`
4. **Create PR:** `/git:pr:create project="{project}"`

Each child skill inherits the design principles from step 1.
All skills use key=value format for consistency.
```

## Key Principles

1. **Progressive Disclosure**
   - Keep SKILL.md concise (~500 tokens)
   - Move details to references/
   - Load on demand

2. **Multi-Project by Design**
   - Support references/projects/ for customization
   - Default to generic when no project specified
   - Allow project-specific overrides

3. **Deterministic Instructions**
   - Clear, numbered steps
   - Concrete examples
   - Explicit error handling

4. **Self-Documenting**
   - Instructions readable by humans
   - Easy to audit and improve
   - Version-controlled in Git

5. **Composable**
   - Skills call other skills
   - Orchestrations coordinate workflows
   - Context flows through the chain

## Detailed Reference

See [references/best-practices.md](references/best-practices.md) for comprehensive skill authoring guidelines.
