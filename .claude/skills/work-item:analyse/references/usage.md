# work-item:analyse Usage Guide

## Purpose

Evaluate if a work item is ready for implementation and determine which projects are impacted. Creates subtasks if multiple projects are involved.

## Required Arguments

- **project**: Project identifier (e.g., "DGD", "myapp")
- **key**: Work item ID (e.g., "KAN-4", "PROJ-123")

## How to Find Arguments

### Missing project name?

**Discover registered projects:**
```bash
/project:list
```

This will show all projects you have registered with their identifiers.

**First time setup:**
If no projects listed, you need to register your project:
```bash
/project:add {name} {type} {path}
```

### Missing work item key?

**List available work items:**
```bash
/work-item:get-available
```

This will fetch and display tickets ready for work from your configured issue tracker (Jira, etc.).

**Or check your issue tracker directly:**
- Look at your Jira board
- Check sprint planning
- Review assigned tickets

## Examples

### Full command with all arguments
```bash
/work-item:analyse project=DGD key=KAN-4
```

### What happens next

The skill will:
1. Fetch the work item details
2. Get project architecture
3. Analyze impact (single vs multiple projects)
4. Create subtasks if needed
5. Write evaluation to `plans/{project}-{key}-evaluation.md`
6. Suggest next actions

### Expected outcomes

**Single project impact:**
```
✅ Ready for implementation
Next: /code:plan DGD KAN-4
```

**Multiple projects impact:**
```
⚠️ Created subtasks:
- KAN-5: [frontend] Add login UI
- KAN-6: [backend] Add login API

Next:
/code:plan DGD KAN-5
/code:plan DGD KAN-6
```

**Needs clarification:**
```
❌ Questions to answer:
- Which authentication method should we use?
- Should this affect mobile or web only?
```

## Troubleshooting

### "Project not found"
Run `/project:list` to see registered projects, or `/project:add` to register a new one.

### "Work item not found"
- Check the key is correct (case-sensitive)
- Verify you have access to the issue tracker
- Confirm the ticket exists and is not closed

### "Architecture not found"
This skill depends on architecture data from `/architecture:get`. For help:
```bash
/skill:get-usage architecture:get
```

## Related Skills

- `/work-item:get-available` - List available work items
- `/project:list` - Show registered projects
- `/project:add` - Register a new project
- `/architecture:get` - Get project architecture (dependency)
- `/code:plan` - Create implementation plan (next step after analysis)
