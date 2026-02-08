#!/bin/bash
# on-stop.sh - Mark agent as waiting for human input (HITL)
#
# BEHAVIOR:
# - Creates {agent_id}.waiting file when agent stops (permission request, etc.)
# - The .waiting file remains until the Jira ticket moves to Done column
# - This is intentional: any HITL can be re-challenged, so the agent stays
#   in "waiting" state until the work item is fully closed
#
# CLEANUP:
# - .waiting is removed by usePolling.ts when ticket status = Done
# - NOT removed when user responds to the agent (that would be wrong)

STATE_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}/ia/state/agents"

# Get agent ID from tmux window name
agent_id=$(tmux display-message -p '#{window_name}' 2>/dev/null)

if [ -n "$agent_id" ] && [ "$agent_id" != "bash" ] && [ "$agent_id" != "zsh" ]; then
  touch "$STATE_DIR/${agent_id}.waiting"
fi
