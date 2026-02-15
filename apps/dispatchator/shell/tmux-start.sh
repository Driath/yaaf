#!/bin/bash
SESSION="yaaf"
AGENTS_SESSION="yaaf-agents"

tmux kill-session -t $SESSION 2>/dev/null
tmux kill-session -t $AGENTS_SESSION 2>/dev/null

tmux set -g set-titles on
tmux set -g set-titles-string "#{pane_title}"

tmux new-session -d -s $AGENTS_SESSION -n agents
tmux set -t $AGENTS_SESSION status off
tmux set -t $AGENTS_SESSION automatic-rename off
tmux set -t $AGENTS_SESSION allow-rename off

tmux new-session -d -s $SESSION -n orchestrator "bun --watch apps/dispatchator/index.tsx"
tmux set -t $SESSION status off
tmux set -t $SESSION automatic-rename off

tmux attach -t $SESSION
