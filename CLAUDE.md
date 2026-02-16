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

## RxJS Debugging

When a subscriber triggers unexpected behavior, the bug is in the source or operator — never in the subscribe. Fix upstream: trace the pipe back to the source that emits a wrong signal. Never patch downstream.

## TypeScript Architecture

Rules for any TypeScript module (dispatchator, future modules):

- **Clean Architecture layers**: `core/` → `infra/` → `store/` → `components/`
- **Dependency rule**: inner layers never import outer layers (`core/` has zero external deps)
- **Interfaces in infra/**: define interfaces next to implementations, core consumes them
- **No god files**: max ~150 lines per file, split by responsibility
- **One export per concern**: a file does one thing

```
module/
├── core/           # Domain logic, pure functions, types
│   ├── types.ts
│   └── rules.ts
├── infra/          # External integrations (APIs, file system, CLIs)
│   ├── jira-client.ts
│   └── jira-client.types.ts
├── store/          # State management (depends on core + infra)
│   └── app-store.ts
└── components/     # UI / Ink components (depends on everything above)
    └── App.tsx
```

## Project Structure

- `.claude/skills/` — skill definitions (Markdown)
- `.agents/` — generic agent skills (non-Claude-specific)
- `apps/` — TypeScript applications
  - `dispatchator/` — orchestrator (TypeScript/Ink)
- `scripts/` — reusable CLI utilities
- `ia/` — instance-specific runtime state (gitignored)
- `todos/plans/` — plan-based task management

## Debugging Dispatchator UI

The orchestrator runs in tmux session `4`, window `0`. Capture the rendered UI with:

```bash
tmux capture-pane -t 4:0 -p
```

## Session Flow

- **Start**: Run `/start` after `/clear` to get task suggestions
- **End**: Workflows suggest handoff options automatically (see `workflow/SKILL.md`)
