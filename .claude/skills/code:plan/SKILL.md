---
name: code:plan
description: Create a detailed technical implementation plan for a work item
allowed-tools: Read, Write, Bash, Glob, Grep
agent: Plan
context: fork
---

# code:plan

You are creating a detailed technical implementation plan for a work item.

## Arguments
- project (e.g., "DGD")
- key (e.g., "KAN-4")

## Instructions

1. **Fetch work item details**
   ```bash
   bun work-item/get.ts project={project} key={key}
   ```

2. **Get project architecture**
   ```bash
   bun architecture/get.ts project={project}
   ```

3. **Get project repository path**
   ```bash
   bun project-registry/get.ts project={project}
   ```
   Extract the `path` field to locate the project codebase.

4. **Explore project codebase**

   Navigate to the project path and explore:
   - File structure (use Glob to find relevant files)
   - Existing patterns (use Grep to find similar components)
   - Read relevant files to understand implementation approach

   This gives you the real codebase context to create a realistic plan.

5. **Create technical implementation plan** (Plan mode)

   Based on work item requirements + architecture + real code, create a plan with:

   - **Files to create/modify** - Exact file paths relative to project root
   - **Implementation steps** - Ordered, concrete actions
   - **Technical decisions** - Framework choices, patterns to use
   - **Dependencies** - What needs to exist first (packages, components)
   - **Testing approach** - How to verify it works

6. **HITL: User validates the plan**
   - Present plan for review
   - User can challenge, refine, or approve

7. **Write plan**
   - Output to: `plans/{project}-{key}-implementation.md`
   - Format: Markdown with clear sections

## Success Criteria

Plan should be:
- **Actionable** - Clear steps, no ambiguity
- **Complete** - All technical decisions made
- **Realistic** - Based on actual codebase patterns
- **Scoped** - Focused on this work item only
- **Ready** - Can be handed to `/code:implement` directly
