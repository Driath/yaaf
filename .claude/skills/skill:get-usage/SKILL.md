---
name: skill:get-usage
description: Get usage documentation for a skill
allowed-tools: Bash
---

# Skill Get Usage

Load and display the usage documentation for any skill in the yaaf framework.

## Usage

```bash
/skill:get-usage {skill-name}
```

**Arguments:**
- `{skill-name}` - Name of the skill (e.g., `work-item:analyse`, `code:feature`)

## Instructions

1. **Parse skill name** from `$ARGUMENTS`

2. **Execute script** to load usage documentation:
   ```bash
   bun run scripts/get-usage.ts $ARGUMENTS
   ```

3. **Display results**:
   - If usage.md found: Display the content to help user understand how to use the skill
   - If not found: Inform user that this skill doesn't have usage documentation (should be fixed via skill:check)

## What This Returns

The `references/usage.md` file contains:
- **Required arguments** and their purpose
- **Discovery skills** - Other skills to help find missing arguments
- **Examples** - Common usage patterns
- **Troubleshooting** - Common issues

## Example

```bash
/skill:get-usage work-item:analyse
```

**Output:**
```markdown
# work-item:analyse Usage

## Required Arguments
- work-item-id: The ticket ID to analyse

## How to Find Arguments

Missing work-item ID? Try:
- /work-item:get-available - List available tickets
- /project:list - View projects and their tickets

## Examples
...
```

## Notes

- Every skill in yaaf should have a `references/usage.md` file
- Use `/skill:check` to validate if a skill has proper usage documentation
- This skill itself has usage documentation at [references/usage.md](references/usage.md)
