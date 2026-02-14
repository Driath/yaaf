#!/bin/bash
[ -z "$YAAF_AGENT_ID" ] && exit 0
STATE_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}/ia/state/agents"
echo "waiting" > "$STATE_DIR/${YAAF_AGENT_ID}.state"
