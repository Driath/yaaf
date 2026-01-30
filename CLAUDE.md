# yaaf - Yet Another Agent Framework

Agent skills framework for Claude Code.

## Naming Conventions

Skills follow naming conventions that trigger automatic behavior:

- `workflow:*` → Loads `.claude/skills/workflow/SKILL.md` before execution
- `skill:*` → Loads `.claude/skills/skill/SKILL.md` before execution

## Security Rules (always apply)

Actions requiring EXPLICIT confirmation (HITL via AskUserQuestion):

- `--admin`, `--force`, `--no-verify` flags
- Destructive git operations (`reset --hard`, `push --force`, `clean -f`)
- Bypassing protections (branch rules, CI checks)
- Deleting branches or files in bulk
- Any override of safety mechanisms

**Never assume approval.** Ask, wait, then act.

## Session Flow

- **Start**: Run `/start` after `/clear` to get task suggestions
- **End**: Workflows suggest handoff options automatically (see `workflow/SKILL.md`)
