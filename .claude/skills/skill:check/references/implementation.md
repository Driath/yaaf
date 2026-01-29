# Skill Check - Implementation Guide

Comprehensive validation rules and guidelines for checking skills against Agent Skills spec and yaaf best practices.

## Validation Checklist

### 1. Structure Validation

#### 1.1 SKILL.md Exists
**Check:** `.claude/skills/{skill-name}/SKILL.md` file exists

**Error Code:** `E001`
**Message:** "SKILL.md not found"
**Fix:** Create SKILL.md in the skill directory

#### 1.2 Valid YAML Frontmatter
**Check:** SKILL.md starts with `---` and contains valid YAML

**Error Code:** `E002`
**Message:** "Invalid or missing YAML frontmatter"
**Fix:** Add valid frontmatter:
```yaml
---
name: skill-name
description: Description here
---
```

#### 1.3 Required Frontmatter Fields
**Check:** `name` and `description` fields present

**Error Code:** `E003`
**Message:** "Missing required field: {field}"
**Fix:** Add the missing field to frontmatter

#### 1.4 Name Matches Directory
**Check:** `name` field matches directory name

**Error Code:** `E004`
**Message:** "Name mismatch: frontmatter says '{name}' but directory is '{dir}'"
**Fix:** Update frontmatter name or rename directory

### 2. Content Validation

#### 2.1 Body Content Present
**Check:** SKILL.md has content after frontmatter

**Error Code:** `E005`
**Message:** "SKILL.md has no body content"
**Fix:** Add instructions and documentation

#### 2.2 Progressive Disclosure
**Check:** SKILL.md is under 500 lines (recommendation)

**Warning Code:** `W001`
**Message:** "SKILL.md is {lines} lines (>500). Consider moving details to references/"
**Fix:** Move detailed content to `references/implementation.md`

#### 2.3 Essential Sections Present
**Check:** SKILL.md contains key sections:
- Usage/Synopsis
- Instructions/Steps
- Examples (recommended)

**Warning Code:** `W002`
**Message:** "Missing recommended section: {section}"
**Fix:** Add the section with relevant content

#### 2.4 Clear and Actionable
**Check:** Instructions are step-by-step and actionable

**Manual Review:** This requires human judgment
**Guideline:** Each instruction should be a clear action Claude can take

### 3. Agent Skills Compliance

#### 3.1 Directory Structure
**Check:** Follows Agent Skills spec:
```
skill-name/
├── SKILL.md          # Required
├── references/       # Optional
├── scripts/          # Optional
└── assets/           # Optional
```

**Error Code:** `E006`
**Message:** "Unexpected files/directories: {files}"
**Fix:** Remove non-standard files or document in references/

#### 3.2 References Structure
**Check:** If `references/` exists:
- Contains `.md` files
- No executable files (those go in `scripts/`)
- Properly organized by topic

**Warning Code:** `W003`
**Message:** "references/ should contain documentation, not {type} files"
**Fix:** Move executables to `scripts/`, data to `assets/`

#### 3.3 Scripts Are Executable
**Check:** If `scripts/` exists, files have execute permissions

**Warning Code:** `W004`
**Message:** "Script {script} is not executable"
**Fix:** `chmod +x .claude/skills/{skill}/scripts/{script}`

#### 3.4 Progressive Disclosure Pattern
**Check:**
- SKILL.md: Quick start (<500 lines)
- references/: Detailed docs
- scripts/: Automation
- assets/: Resources

**Info:** This is the recommended pattern for complex skills

### 4. Claude Code Specifics

#### 4.1 Valid allowed-tools
**Check:** If specified, tools are valid Claude Code tools:
- Read, Write, Edit, NotebookEdit
- Bash, Glob, Grep
- Task, Skill
- AskUserQuestion, TodoWrite
- EnterPlanMode, ExitPlanMode
- WebFetch, WebSearch
- MCP tools (mcp__*)

**Error Code:** `E007`
**Message:** "Invalid tool in allowed-tools: {tool}"
**Fix:** Remove invalid tool or check spelling

#### 4.2 Valid context
**Check:** If specified, context is one of:
- `fork` - New conversation context
- `inherit` - Inherits parent context

**Error Code:** `E008`
**Message:** "Invalid context value: {value}"
**Fix:** Use 'fork' or 'inherit', or omit field

#### 4.3 Valid agent
**Check:** If specified, agent is a valid Claude Code agent:
- Bash, general-purpose, Explore, Plan
- (Custom agents if configured)

**Warning Code:** `W005`
**Message:** "Agent '{agent}' may not be available in all environments"
**Fix:** Document agent requirements or use standard agents

#### 4.4 Skill Tool Calls
**Check:** If skill uses Skill tool, format is correct:
```markdown
Use the Skill tool to invoke {skill-name}
```

**Warning Code:** `W006`
**Message:** "Skill tool calls should reference existing skills"
**Fix:** Verify referenced skills exist

### 5. References and Links

#### 5.1 Broken Links
**Check:** All markdown links in SKILL.md resolve:
- `[text](references/file.md)` - file exists
- `[text](https://...)` - external links (warning if unreachable)
- `[text](#anchor)` - anchor exists in document

**Error Code:** `E009`
**Message:** "Broken link: {link} -> {target} not found"
**Fix:** Create the referenced file or fix the link

#### 5.2 References Format
**Check:** If `references/implementation.md` exists:
- Follows markdown structure
- Uses clear headings
- Includes examples

**Info:** This is the standard detailed documentation file

#### 5.3 Project-Specific References
**Check:** If skill supports multi-project, `references/projects/` exists:
- Contains project-specific `.md` files
- Files are referenced in SKILL.md
- File names match project identifiers

**Warning Code:** `W007`
**Message:** "references/projects/ exists but not mentioned in SKILL.md"
**Fix:** Document how to use project-specific rules

### 6. Best Practices

#### 6.1 Naming Convention
**Check:** Skill name follows conventions:
- Orchestration: `orchestration:{name}`
- Contextual: `{domain}:{action}`
- Global: `{domain}:{action}`

**Info:** See `docs/DESIGN.md` for category guidelines

**Warning Code:** `W008`
**Message:** "Skill name doesn't follow convention: {pattern}"
**Fix:** Rename skill or document exception

#### 6.2 Description Quality
**Check:** Description field:
- Starts with "when to use" or "what it does"
- Under 200 characters
- Actionable and clear

**Warning Code:** `W009`
**Message:** "Description could be more actionable"
**Fix:** Focus on when/why to use the skill

#### 6.3 Examples Included
**Check:** SKILL.md includes examples section

**Warning Code:** `W010`
**Message:** "No examples section found"
**Fix:** Add concrete usage examples

#### 6.4 Error Handling
**Check:** SKILL.md documents:
- What can go wrong
- How to troubleshoot
- Common errors

**Info:** Good skills anticipate failure modes

#### 6.5 yaaf Design Patterns

##### 6.5.1 Usage Documentation
**Check:** `references/usage.md` exists

**Error Code:** `E017`
**Message:** "Missing references/usage.md - required by yaaf design pattern"
**Fix:** Create `references/usage.md` with:
- Required arguments documentation
- Discovery skills to help find arguments
- Examples and troubleshooting

**Pattern:**
```markdown
# skill-name Usage Guide

## Required Arguments
- arg1: Description

## How to Find Arguments
### Missing arg1?
/other-skill to discover arg1

## Examples
/skill-name arg1=value
```

##### 6.5.2 Usage Loading Logic
**Check:** If skill has required arguments, SKILL.md must load usage.md when arguments missing

**Warning Code:** `W015`
**Message:** "SKILL.md doesn't load usage.md when arguments missing"
**Fix:** Add Step 0 to instructions:
```markdown
### Step 0: Validate Arguments
If arguments missing:
- Use Skill tool: /skill:get-usage {skill-name}
- Display guide
- Exit
```

##### 6.5.3 No Direct Script Calls
**Check:** SKILL.md must not call scripts directly

**Error Code:** `E016`
**Message:** "Direct script call detected: {script-path}. Use skill wrapper instead."
**Fix:** Replace direct script calls with skill wrappers

**Anti-pattern (❌):**
```bash
bun run ../../../scripts/get-skill-usage.ts my-skill
bun run scripts/get-skill-usage.ts my-skill
```

**Correct pattern (✅):**
```markdown
Use Skill tool: /skill:get-usage my-skill
```

**Why:** Skills should call other skills, not scripts directly. This enables:
- Proper skill-to-skill composition
- Discoverable dependencies
- Centralized script management

**See:** `docs/DESIGN.md` - Script Utilities Pattern

## Error Codes Reference

### Errors (Must Fix)

| Code | Issue | Severity |
|------|-------|----------|
| E001 | SKILL.md not found | Critical |
| E002 | Invalid YAML frontmatter | Critical |
| E003 | Missing required field | Critical |
| E004 | Name mismatch | High |
| E005 | No body content | High |
| E006 | Unexpected files | Medium |
| E007 | Invalid allowed-tools | Medium |
| E008 | Invalid context value | Medium |
| E009 | Broken link | Medium |
| E016 | Direct script call in SKILL.md | High |
| E017 | Missing references/usage.md | High |

### Warnings (Should Fix)

| Code | Issue | Priority |
|------|-------|----------|
| W001 | SKILL.md too long | Medium |
| W002 | Missing section | Low |
| W003 | Wrong file location | Medium |
| W004 | Script not executable | Low |
| W005 | Non-standard agent | Low |
| W006 | Unverified skill reference | Low |
| W007 | Undocumented projects/ | Low |
| W008 | Non-standard naming | Info |
| W009 | Weak description | Info |
| W010 | No examples | Low |
| W015 | No usage loading logic | Medium |

## Validation Implementation

### Step-by-Step Validation Process

```markdown
1. **Parse skill name**
   - Extract from argument
   - Normalize format (handle with/without .claude/skills/ prefix)

2. **Locate skill directory**
   - Construct path: `.claude/skills/{skill-name}/`
   - Verify directory exists

3. **Read SKILL.md**
   - Check file exists (E001)
   - Read full content
   - Count lines for W001 check

4. **Parse frontmatter**
   - Extract YAML between --- markers (E002)
   - Parse to object
   - Validate required fields (E003)
   - Check name matches directory (E004)

5. **Validate optional frontmatter**
   - If allowed-tools present, validate each (E007)
   - If context present, validate value (E008)
   - If agent present, check validity (W005)

6. **Check body content**
   - Verify content after frontmatter exists (E005)
   - Look for standard sections (W002)
   - Check for examples (W010)

7. **Validate structure**
   - List directory contents
   - Check for non-standard files (E006)
   - If references/ exists, validate structure (W003)
   - If scripts/ exists, check permissions (W004)

8. **Check links**
   - Extract all markdown links from SKILL.md
   - Verify relative links resolve (E009)
   - Check references/implementation.md if linked
   - Verify references/projects/ if mentioned

9. **Apply best practices**
   - Check naming convention (W008)
   - Evaluate description (W009)
   - Verify progressive disclosure (W001)

10. **Generate report**
    - Categorize: Errors, Warnings, Info
    - Provide actionable fixes
    - Show summary counts
```

### Example Validation Output

```
Checking skill: code:feature

✅ Structure
  ✅ SKILL.md exists
  ✅ Valid YAML frontmatter
  ✅ Name matches directory (code:feature)
  ✅ Required fields: name, description
  ✅ allowed-tools: Read, Bash, Edit, Skill

❌ Content
  ✅ Body content present (523 lines)
  ⚠️  W001: SKILL.md is 523 lines (>500). Consider moving details to references/
  ✅ References properly linked
  ❌ E009: Broken link: references/testing.md not found

✅ Agent Skills Compliance
  ✅ Progressive disclosure pattern
  ✅ references/implementation.md exists
  ✅ references/projects/ structure valid
  ✅ No unexpected files

⚠️  Best Practices
  ⚠️  W010: No examples section found
  ✅ Description is actionable
  ✅ Naming follows convention

Summary: 12 passed, 3 warnings, 1 error

Recommended actions:
1. Fix E009: Create references/testing.md or update link
2. Consider W001: Move detailed content to references/
3. Add examples section to SKILL.md
```

## Common Issues and Fixes

### Issue: "SKILL.md too long"

**Problem:** SKILL.md is >500 lines, making it hard to load efficiently

**Fix:**
1. Create `references/implementation.md`
2. Move detailed content there
3. Keep SKILL.md focused on:
   - Quick usage
   - Essential steps
   - Link to references/

**Example:**
```markdown
## Detailed Implementation

See [references/implementation.md](references/implementation.md) for:
- Complete step-by-step guide
- Advanced configurations
- Troubleshooting tips
```

### Issue: "Broken link to references/"

**Problem:** SKILL.md references a file that doesn't exist

**Fix:**
```bash
# Create the referenced file
touch .claude/skills/{skill-name}/references/{file}.md

# Add basic structure
echo "# {Title}\n\nContent here" > .claude/skills/{skill-name}/references/{file}.md
```

### Issue: "Name mismatch"

**Problem:** Directory name is `code:feature` but frontmatter says `code-feature`

**Fix:**
```yaml
---
name: code:feature  # Must match directory name exactly
description: ...
---
```

### Issue: "Invalid allowed-tools"

**Problem:** Frontmatter includes non-existent tool

**Fix:**
```yaml
---
# ❌ Wrong
allowed-tools: Read, GitCommit, MyCustomTool

# ✅ Correct
allowed-tools: Read, Bash, Skill
---
```

Valid tools:
- Read, Write, Edit, NotebookEdit
- Bash, Glob, Grep
- Task, Skill
- AskUserQuestion, TodoWrite
- EnterPlanMode, ExitPlanMode
- WebFetch, WebSearch

### Issue: "Scripts not executable"

**Problem:** Files in `scripts/` directory lack execute permissions

**Fix:**
```bash
chmod +x .claude/skills/{skill-name}/scripts/*.sh
```

### Issue: "Missing references/projects/"

**Problem:** Multi-project skill doesn't have project-specific docs

**Fix:**
```bash
mkdir -p .claude/skills/{skill-name}/references/projects
cat > .claude/skills/{skill-name}/references/projects/nextjs.md << 'EOF'
# Next.js Specific Rules

## Tech Stack
[Next.js patterns]

## Conventions
[Project conventions]
EOF
```

## Automated Checks vs Manual Review

### Automated (Tool Can Check)
✅ File existence
✅ YAML parsing
✅ Field presence
✅ Link resolution
✅ File permissions
✅ Line count
✅ Directory structure

### Manual Review (Requires Judgment)
👤 Instruction clarity
👤 Example quality
👤 Description effectiveness
👤 Completeness of documentation
👤 Appropriate level of detail

## Integration with Other Skills

### skill:check + code:review
Use skill:check before committing new skills

### skill:check + git:worktree
Validate skills in feature branches

### skill:check in CI/CD
Run validation on all skills in pull requests

## Future Enhancements

- **Automated fixes:** Generate patches for common issues
- **Batch validation:** Check all skills at once
- **Quality metrics:** Score skills on completeness
- **Dependency checking:** Verify Skill tool references
- **Performance testing:** Test skill execution
- **Documentation coverage:** Ensure all features documented
