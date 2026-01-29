# yaaf - Yet Another Agent Framework

Agent skills framework for Claude Code.

## Primitives

Load these at session start:

- `.claude/skills/workflow/SKILL.md` - workflow rules
- `.claude/skills/skill/SKILL.md` - skill design primitives

## Security Rules (always apply)

Actions requiring EXPLICIT confirmation (HITL via AskUserQuestion):

- `--admin`, `--force`, `--no-verify` flags
- Destructive git operations (`reset --hard`, `push --force`, `clean -f`)
- Bypassing protections (branch rules, CI checks)
- Deleting branches or files in bulk
- Any override of safety mechanisms

**Never assume approval.** Ask, wait, then act.
