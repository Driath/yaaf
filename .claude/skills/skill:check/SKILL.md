---
name: skill:check
description: Validate a skill against Agent Skills spec and yaaf best practices
allowed-tools: Read, Bash, Glob
---

# Skill Check

Validate a skill's structure, format, and compliance with the Agent Skills specification and yaaf framework conventions.

## Usage

```bash
/skill-check {skill-name}
```

**Arguments:**
- `{skill-name}` - Name of the skill to validate (e.g., `code:feature`, `orchestration:dev-workflow`)

## What It Checks

### Structure Validation
- ✅ SKILL.md exists
- ✅ Valid YAML frontmatter
- ✅ Required fields: `name`, `description`
- ✅ Skill name matches directory name

### Content Validation
- ✅ SKILL.md has body content
- ✅ Instructions are clear and actionable
- ✅ Progressive disclosure (SKILL.md < 500 lines recommended)
- ✅ References properly linked

### Agent Skills Compliance
- ✅ Follows https://agentskills.io/specification
- ✅ references/ structure valid
- ✅ Scripts are executable (if present)
- ✅ Assets properly organized (if present)

### Claude Code Specifics
- ✅ Valid `allowed-tools` (if specified)
- ✅ Valid `context` value: fork, inherit (if specified)
- ✅ Valid `agent` value (if specified)
- ✅ Skill tool calls properly formatted

### References
- ✅ Broken links detection
- ✅ references/implementation.md structure
- ✅ references/projects/ organization (if multi-project)

### Multi-Project Pattern
- ✅ If skill has `project-name` or `[project]` argument, must load `references/projects/${project-name}.md`
- ✅ references/projects/ directory exists with example projects
- ✅ SKILL.md documents how to use project-specific references

### Output Format (DRY from design-system)
- ✅ Read `/skill:format:out` to get current output format rules
- ✅ Check skill has "Output" or "## Output" section
- ✅ Validate output format matches `skill:format:out` template:
  - Header: `✅ {skill-name} completed`
  - Required sections: `## Actions`, `## Corrections`, `## Notes`
- ⚠️ Warning if "Follow `/skill:format:out`" not referenced

## Output

The skill will output:
1. **Pass/Fail status** for each check
2. **Warnings** for recommendations
3. **Errors** for critical issues
4. **Suggestions** for improvements

## Detailed Validation Rules

See [references/implementation.md](references/implementation.md) for:
- Complete validation checklist
- Error codes and meanings
- Fix recommendations
- Examples of common issues

## Examples

**Check a single skill:**
```bash
/skill-check code:feature
```

**Expected output:**
```
Checking skill: code:feature

✅ Structure
  ✅ SKILL.md exists
  ✅ Valid YAML frontmatter
  ✅ Name matches directory (code:feature)
  ✅ Required fields present

✅ Content
  ✅ Body content present (234 lines)
  ⚠️  Consider moving detailed content to references/ (>200 lines)
  ✅ References properly linked

✅ Agent Skills Compliance
  ✅ Progressive disclosure pattern
  ✅ references/implementation.md exists
  ✅ references/projects/ structure valid

✅ Claude Code Specifics
  ✅ allowed-tools: Read, Bash, Edit, Skill
  ✅ No context specified (inherits by default)

Summary: 12 passed, 1 warning, 0 errors
```

## Quick Instructions

1. **Load design-system** - Read `/skill:format:out` for output format rules
2. **Locate skill directory** at `.claude/skills/{skill-name}`
3. **Read SKILL.md** and parse frontmatter
4. **Validate structure** against Agent Skills spec
5. **Check content** for clarity and organization
6. **Validate output format** against rules from step 1
7. **Verify references** and links
8. **Output results** with actionable feedback

## Advanced Validation

For detailed validation rules and how to fix common issues, see [references/implementation.md](references/implementation.md).
