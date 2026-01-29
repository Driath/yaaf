#!/usr/bin/env bun

/**
 * Reset (delete) session state for a workflow
 *
 * Usage:
 *   bun run reset.ts workflow:pr
 */

import { unlink } from "node:fs/promises";

const SESSIONS_DIR = "ia/state/sessions";
const args = Bun.argv.slice(2);

if (!args[0]) {
  console.error("Usage: reset.ts <workflow:name>");
  process.exit(1);
}

const workflow = args[0];
const filePath = `${SESSIONS_DIR}/${workflow}.json`;

try {
  await unlink(filePath);
  console.log(`Session ${workflow} reset`);
} catch (e: any) {
  if (e.code === "ENOENT") {
    console.log(`No session found for ${workflow}`);
  } else {
    throw e;
  }
}
