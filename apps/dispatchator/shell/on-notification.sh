#!/bin/bash
INPUT=$(cat)
HOOK=$(echo "$INPUT" | grep -o '"hook_event_name":"[^"]*"' | cut -d'"' -f4)
echo "$(date '+%H:%M:%S') [${HOOK:-notification}] agent=${YAAF_AGENT_ID:-none} ${INPUT}" >> /tmp/yaaf-hooks.log
