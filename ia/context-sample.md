# Workspace Context

## Work Items

| Provider | Access | Default |
|----------|--------|---------|
| jira | mcp:atlassian | yes |

Site: matthieuczeski.atlassian.net

## Projects

| name | path | type | jira-project | jira-board | git |
|------|------|------|--------------|------------|-----|
| yaaf | . | framework | - | - | github:matthieuczeski/yaaf |
| degradation | ../degradation | app | KAN | 1 | - |

## Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `workflow:pr` | "pr", "push", default | Create PR and check mergeable status |
| `workflow:feature-to-develop` | ticket key, "feature" | Full feature lifecycle |
| `workflow:pr-feedback-loop` | "feedback", "review" | Process PR comments and learn |

## Routing

When `/workflow` is invoked:

1. **Ticket key mentioned** (KAN-*, APC-*) → `workflow:feature-to-develop`
2. **"pr", "push", "create pr"** → `workflow:pr`
3. **"feedback", "comments"** → `workflow:pr-feedback-loop`
4. **No signal** → `workflow:pr`

## Notes

- yaaf: The framework itself
- degradation: Test project with Jira integration (KAN board)
