#!/usr/bin/env bun

/**
 * Append a skill call to session log
 *
 * Usage:
 *   bun run log.ts <skill> <calledBy> <response>
 *   bun run log.ts workflow:pr agent "PR #8 created"
 *   bun run log.ts git:pr:find workflow:pr "Found PR #8"
 */

import { mkdir } from "node:fs/promises";

const SESSION_FILE = "ia/state/session.json";
const args = Bun.argv.slice(2);

if (args.length < 3) {
  console.error("Usage: log.ts <skill> <calledBy> <response>");
  process.exit(1);
}

const [skill, calledBy, response] = args;

// Ensure directory exists
await mkdir("ia/state", { recursive: true });

// Load existing log or create new
const file = Bun.file(SESSION_FILE);
let log: Array<Record<string, unknown>> = [];

if (await file.exists()) {
  log = await file.json();
}

// Append entry
const entry = {
  skill,
  calledBy,
  timestamp: new Date().toISOString(),
  response
};

log.push(entry);

// Write
await Bun.write(SESSION_FILE, JSON.stringify(log, null, 2));
console.log(`Logged: ${skill} (by ${calledBy})`);
