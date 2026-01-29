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

## Workflow Handoff (mandatory)

After completing ANY `workflow:*`:

1. Read `TODO.md` for pending tasks
2. Suggest next highest-priority task
3. Ask: "Next: {task}. /clear to start fresh?"

This keeps the improvement cycle continuous. yaaf always points to what's next.
