#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_DIR="$SCRIPT_DIR/../../../ia/state/agents"
agent_id=$(tmux display-message -p '#{window_name}' 2>/dev/null)
if [ -n "$agent_id" ] && [ "$agent_id" != "bash" ]; then
  rm -f "$STATE_DIR/${agent_id}.waiting"
fi
