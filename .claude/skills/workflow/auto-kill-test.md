---
name: workflow:auto-kill-test
description: Test workflow that auto-terminates the agent when complete
---

# workflow:auto-kill-test

Test auto-kill by signaling done to the orchestrator.

## Instructions

1. Say "🚀 Auto-kill test started"
2. Get ticket ID: run `tmux display-message -p '#{window_name}'`
3. Signal done: run `touch ia/state/agents/<TICKET_ID>.done`
4. Say "🏁 Done signal sent, orchestrator will terminate me"
