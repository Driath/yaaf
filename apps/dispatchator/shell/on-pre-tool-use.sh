#!/bin/bash
[ -z "$YAAF_AGENT_ID" ] && exit 0
INPUT=$(cat)
TITLE=$(echo "$INPUT" | grep -o '"description":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -z "$TITLE" ] && exit 0
STATE_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}/ia/state/agents"
echo "$TITLE" > "$STATE_DIR/${YAAF_AGENT_ID}.title"
