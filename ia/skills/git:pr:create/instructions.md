# git:pr:create - yaaf specific rules

## Reviewers

**Required:** Always request at least 1 reviewer.

When creating a PR:
```bash
gh pr create ... --reviewer {reviewer}
```

If no reviewer specified, ask user:
"Qui doit review cette PR ?"

## PR Template

Include in body:
- Summary of changes
- Link to design doc if architectural change
- Test instructions if applicable
