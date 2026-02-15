#!/bin/bash
[ -z "$YAAF_AGENT_ID" ] && exit 0
INPUT=$(cat)
STATE_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}/ia/state/agents"
echo "working" > "$STATE_DIR/${YAAF_AGENT_ID}.state"
TITLE=$(echo "$INPUT" | grep -o '"description":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -z "$TITLE" ] && exit 0
echo "$TITLE" > "$STATE_DIR/${YAAF_AGENT_ID}.title"
