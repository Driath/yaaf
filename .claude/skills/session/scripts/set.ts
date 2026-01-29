#!/usr/bin/env bun

/**
 * Set/update session state for a workflow
 *
 * Usage:
 *   bun run set.ts workflow:pr init
 *   bun run set.ts workflow:pr git:pr:monitor '{"pr_number":8}'
 */

import { mkdir } from "node:fs/promises";

const SESSIONS_DIR = "ia/state/sessions";
const args = Bun.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: set.ts <workflow:name> <step> [context-json]");
  process.exit(1);
}

const [workflow, step, contextArg] = args;
const filePath = `${SESSIONS_DIR}/${workflow}.json`;

// Ensure directory exists
await mkdir(SESSIONS_DIR, { recursive: true });

// Load existing state or create new
const file = Bun.file(filePath);
let state: Record<string, unknown>;

if (await file.exists()) {
  state = await file.json();
} else {
  state = {
    started_at: new Date().toISOString(),
    steps: [],
  };
}

// Update step
state.step = step;

// Track step history
if (Array.isArray(state.steps) && state.steps[state.steps.length - 1] !== step) {
  state.steps.push(step);
}

// Merge context if provided
if (contextArg) {
  try {
    const newContext = JSON.parse(contextArg);
    state.context = { ...(state.context as object || {}), ...newContext };
  } catch (e) {
    console.error("Invalid JSON context:", contextArg);
    process.exit(1);
  }
}

state.updated_at = new Date().toISOString();

// Write
await Bun.write(filePath, JSON.stringify(state, null, 2));
console.log(JSON.stringify(state, null, 2));
