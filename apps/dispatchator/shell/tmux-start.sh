#!/bin/bash
SESSION="yaaf"
AGENTS_SESSION="yaaf-agents"

tmux kill-session -t $SESSION 2>/dev/null
tmux kill-session -t $AGENTS_SESSION 2>/dev/null

tmux new-session -d -s $AGENTS_SESSION -n agents
tmux new-session -d -s $SESSION -n orchestrator "bun --watch apps/dispatchator/index.tsx"

tmux attach -t $SESSION
