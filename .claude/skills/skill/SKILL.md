---
name: skill
description: Primitive design rules for all skills. Loaded by agent at session start.
---

# skill

Primitive rules that apply to all skills in the framework.

## Usage

This skill is **not invoked directly**. It is loaded automatically via `CLAUDE.md` at session start.

## Design System

### Source of Truth Skills

These skills define standards. **Read them dynamically, don't hardcode their rules.**

| Skill | Defines |
|-------|---------|
| `skill:format:out` | Output format for all skills |
| `skill:design` | Skill design principles |

### Pattern: DRY Validation

When validating (e.g., `skill:check`):
1. **Read the source of truth skill** to get current rules
2. **Parse the target** to extract relevant sections
3. **Validate against the rules** from step 1

```
skill:format:out (source of truth)
       │
       ▼
skill:check (reads rules dynamically)
       │
       ▼
validates → target-skill/SKILL.md
```

This ensures validation stays in sync with the design system automatically.

## Skill Structure

Every skill directory contains:

```
skill-name/
├── SKILL.md          # Required - main instructions
├── references/       # Optional - detailed docs
├── scripts/          # Optional - automation
└── assets/           # Optional - resources
```

## Output Format

All skills must end with structured output per `skill:format:out`:

```
---
✅ {skill-name} completed

## Actions
- {what was done}

## Result
{outcome summary}

## Corrections
- {adjustments made}

## Notes
- {observations}
---
```

Reference it in your skill: `Follow /skill:format:out`

## Naming Conventions

| Pattern | Example | Use |
|---------|---------|-----|
| `domain:action` | `git:pr:create` | Domain-specific action |
| `workflow:name` | `workflow:pr` | Orchestration workflow |
| `skill:name` | `skill:check` | Meta/framework skill |

## Progressive Disclosure

- **SKILL.md**: Quick start, essential steps (<500 lines)
- **references/**: Detailed documentation
- **scripts/**: Automation helpers
