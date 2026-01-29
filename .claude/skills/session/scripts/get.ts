#!/usr/bin/env bun

/**
 * Get session state for a workflow
 *
 * Usage:
 *   bun run get.ts workflow:pr     → state or null
 *   bun run get.ts --all           → all active sessions
 */

import { readdir } from "node:fs/promises";

const SESSIONS_DIR = "ia/state/sessions";
const args = Bun.argv.slice(2);

async function getWorkflowState(workflow: string): Promise<object | null> {
  const file = Bun.file(`${SESSIONS_DIR}/${workflow}.json`);
  if (await file.exists()) {
    return await file.json();
  }
  return null;
}

async function getAllActiveSessions(): Promise<object[]> {
  const sessions: object[] = [];
  try {
    const files = await readdir(SESSIONS_DIR);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const workflow = file.replace(".json", "");
        const state = await getWorkflowState(workflow);
        if (state) {
          sessions.push({ workflow, ...state });
        }
      }
    }
  } catch {
    // Directory doesn't exist or is empty
  }
  return sessions;
}

// Main
if (args[0] === "--all") {
  const sessions = await getAllActiveSessions();
  console.log(JSON.stringify(sessions, null, 2));
} else if (args[0]) {
  const state = await getWorkflowState(args[0]) as Record<string, unknown> | null;
  if (state) {
    console.error(`\n🔄 Restoring state: relaunching from step "${state.step}"\n`);
    console.log(JSON.stringify(state, null, 2));
  } else {
    console.log("null");
  }
} else {
  console.error("Usage: get.ts <workflow:name> | --all");
  process.exit(1);
}
