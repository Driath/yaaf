#!/bin/bash
# Start dispatchator in tmux

SESSION="yaaf"

# Kill existing session
tmux kill-session -t $SESSION 2>/dev/null

# Create session with orchestrator
tmux new-session -d -s $SESSION -n orchestrator "bun start"

# Attach
tmux attach -t $SESSION
