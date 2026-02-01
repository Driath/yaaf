#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_DIR="$SCRIPT_DIR/../../../ia/state/agents"
agent_id=$(tmux display-message -p '#{window_name}' 2>/dev/null)
echo "[on-stop] agent_id=$agent_id STATE_DIR=$STATE_DIR" >> /tmp/hooks-debug.log
if [ -n "$agent_id" ] && [ "$agent_id" != "bash" ]; then
  touch "$STATE_DIR/${agent_id}.waiting"
  echo "[on-stop] created $STATE_DIR/${agent_id}.waiting" >> /tmp/hooks-debug.log
fi
