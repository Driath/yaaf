#!/usr/bin/env bun

/**
 * Archive session state to markdown and reset
 *
 * Usage:
 *   bun run save.ts workflow:pr
 *   bun run save.ts workflow:pr --status=completed
 *   bun run save.ts workflow:pr --status=failed --notes="CI blocked"
 */

import { mkdir, unlink } from "node:fs/promises";

const SESSIONS_DIR = "ia/state/sessions";
const ARCHIVES_DIR = "ia/state/sessions/archives";
const args = Bun.argv.slice(2);

if (!args[0]) {
  console.error("Usage: save.ts <workflow:name> [--status=completed|failed] [--notes=...]");
  process.exit(1);
}

const workflow = args[0];
const filePath = `${SESSIONS_DIR}/${workflow}.json`;

// Parse flags
let status = "completed";
let notes = "";
for (const arg of args.slice(1)) {
  if (arg.startsWith("--status=")) status = arg.split("=")[1];
  if (arg.startsWith("--notes=")) notes = arg.split("=").slice(1).join("=");
}

// Load state
const file = Bun.file(filePath);
if (!(await file.exists())) {
  console.error(`No session found for ${workflow}`);
  process.exit(1);
}

const state = await file.json() as Record<string, unknown>;

// Generate archive filename
const date = new Date().toISOString().split("T")[0];
const context = state.context as Record<string, unknown> || {};
const suffix = context.branch
  ? `-${String(context.branch).replace(/[^a-zA-Z0-9-]/g, "-")}`
  : "";
const archiveName = `${date}-${workflow.replace(":", "-")}${suffix}.md`;

// Calculate duration
const startedAt = new Date(state.started_at as string);
const duration = Math.round((Date.now() - startedAt.getTime()) / 60000);

// Generate markdown
const md = `# ${workflow} - ${date}

**Status:** ${status}
**Duration:** ${duration}min

## Context
${Object.entries(context).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- (none)"}

## Steps
${(state.steps as string[] || []).map((s, i, arr) =>
  `${i + 1}. ${s}${i === arr.length - 1 ? ` (final)` : ` ✓`}`
).join("\n") || "- (none)"}

## Final State
- Step: ${state.step}
- Started: ${state.started_at}
- Ended: ${new Date().toISOString()}
${notes ? `\n## Notes\n${notes}` : ""}
`;

// Ensure archive directory exists
await mkdir(ARCHIVES_DIR, { recursive: true });

// Write archive
const archivePath = `${ARCHIVES_DIR}/${archiveName}`;
await Bun.write(archivePath, md);

// Delete session file
await unlink(filePath);

console.log(`Archived to ${archivePath}`);
console.log(md);
