#!/bin/bash
INPUT=$(cat)
HOOK=$(echo "$INPUT" | grep -o '"hook_event_name":"[^"]*"' | cut -d'"' -f4)
echo "$(date '+%H:%M:%S') [${HOOK:-notification}] agent=${YAAF_AGENT_ID:-none} ${INPUT}" >> /tmp/yaaf-hooks.log

if [ -n "$YAAF_AGENT_ID" ]; then
  TYPE=$(echo "$INPUT" | grep -o '"notification_type":"[^"]*"' | cut -d'"' -f4)
  if [ "$TYPE" = "idle_prompt" ]; then
    STATE_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}/ia/state/agents"
    echo "waiting" > "$STATE_DIR/${YAAF_AGENT_ID}.state"
  fi
fi
