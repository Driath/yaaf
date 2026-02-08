#!/bin/bash
STATE_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}/ia/state/agents"
agent_id=$(tmux display-message -p '#{window_name}' 2>/dev/null)
if [ -n "$agent_id" ] && [ "$agent_id" != "bash" ] && [ "$agent_id" != "zsh" ]; then
  rm -f "$STATE_DIR/${agent_id}.waiting"
  tmux kill-window -t "yaaf-agents:${agent_id}" 2>/dev/null
fi
