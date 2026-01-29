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

## Session Start

At the beginning of any session:

1. Read `TODO.md` for pending tasks
2. If pending → Suggest: "Continue with {highest priority task}?"
3. If all done → Read `ia/context.md` for work items (Jira, etc.)
4. If nothing → "All clear! What do you want to work on?"

## Workflow Handoff (mandatory)

After completing ANY `workflow:*`:

1. Update `TODO.md` (mark done, add new tasks discovered)
2. Suggest next task from TODO.md
3. Ask: "/clear to start fresh?"

This keeps the improvement cycle continuous.
