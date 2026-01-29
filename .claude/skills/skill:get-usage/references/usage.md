# skill:get-usage Usage Guide

## Purpose

Load the usage documentation for any skill to understand how to use it correctly.

## Required Arguments

- **skill-name**: The name of the skill you want usage information for

## How to Find Arguments

### Missing skill name?

**Discover available skills:**
- Check `.claude/skills/` directory for all available skills
- Use tab completion if your shell supports it
- Look at yaaf documentation for skill catalog

**Common skills:**
- `work-item:analyse` - Analyse work items
- `code:feature` - Implement features
- `code:plan` - Create implementation plans
- `project:list` - List registered projects
- `skill:check` - Validate skill structure

## Examples

### Get usage for a specific skill
```bash
/skill:get-usage work-item:analyse
```

### Get usage for this skill (meta!)
```bash
/skill:get-usage skill:get-usage
```

## What You'll Get

The usage documentation will show:
1. **Purpose** - What the skill does
2. **Required arguments** - What you need to provide
3. **Discovery helpers** - Other skills to help find missing arguments
4. **Examples** - Real usage examples
5. **Troubleshooting** - Common issues

## Troubleshooting

### No output returned
The skill doesn't have a `references/usage.md` file yet. This should be validated by `/skill:check`.

### Skill not found
Check that the skill name is correct:
- Use colons not slashes (`:` not `/`)
- Check spelling
- Verify the skill exists in `.claude/skills/`

## Related Skills

- `/skill:check` - Validate that a skill has proper usage documentation
