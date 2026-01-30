# yaaf - Yet Another Agent Framework

Agent skills framework for Claude Code.

## Naming Conventions

Skills follow naming conventions that **require** loading base rules:

- `workflow:*` → **MUST** load `.claude/skills/workflow/SKILL.md` BEFORE execution
- `skill:*` → **MUST** load `.claude/skills/skill/SKILL.md` BEFORE execution

**Not optional.** Read the base skill first, then execute the specific skill.

## Security Rules (always apply)

Actions requiring EXPLICIT confirmation (HITL via AskUserQuestion):

- `--admin`, `--force`, `--no-verify` flags
- Destructive git operations (`reset --hard`, `push --force`, `clean -f`)
- Bypassing protections (branch rules, CI checks)
- Deleting branches or files in bulk
- Any override of safety mechanisms

**Never assume approval.** Ask, wait, then act.

## Code Quality

- No unnecessary comments - code should be self-documenting

## Session Flow

- **Start**: Run `/start` after `/clear` to get task suggestions
- **End**: Workflows suggest handoff options automatically (see `workflow/SKILL.md`)
