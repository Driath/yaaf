#!/usr/bin/env bun

/**
 * Archive session log to markdown and clear
 *
 * Usage:
 *   bun run save.ts
 *   bun run save.ts --status=completed
 *   bun run save.ts --status=failed --notes="CI blocked"
 */

import { mkdir, unlink } from "node:fs/promises";

const SESSION_FILE = "ia/state/session.json";
const ARCHIVES_DIR = "ia/state/sessions";
const args = Bun.argv.slice(2);

// Parse flags
let status = "completed";
let notes = "";
for (const arg of args) {
  if (arg.startsWith("--status=")) status = arg.split("=")[1];
  if (arg.startsWith("--notes=")) notes = arg.split("=").slice(1).join("=");
}

// Load session log
const file = Bun.file(SESSION_FILE);
if (!(await file.exists())) {
  console.log("No session to save");
  process.exit(0);
}

const log = await file.json() as Array<Record<string, unknown>>;

if (log.length === 0) {
  console.log("Empty session, nothing to save");
  process.exit(0);
}

// Extract info from log
const firstEntry = log[0];
const lastEntry = log[log.length - 1];
const mainWorkflow = firstEntry.skill as string;
const startedAt = new Date(firstEntry.timestamp as string);
const endedAt = new Date(lastEntry.timestamp as string);
const durationMs = endedAt.getTime() - startedAt.getTime();
const durationMin = Math.round(durationMs / 60000);

// Generate archive filename
const date = new Date().toISOString().split("T")[0];
const time = new Date().toISOString().split("T")[1].slice(0, 5).replace(":", "");
const archiveName = `${date}-${time}-${mainWorkflow.replace(/:/g, "-")}.md`;

// Generate markdown
const md = `# ${mainWorkflow} - ${date}

**Status:** ${status}
**Duration:** ${durationMin}min
**Started:** ${firstEntry.timestamp}
**Ended:** ${lastEntry.timestamp}

## Skill Calls

| Skill | Called By | Response |
|-------|-----------|----------|
${log.map(entry =>
  `| ${entry.skill} | ${entry.calledBy} | ${entry.response} |`
).join("\n")}
${notes ? `\n## Notes\n${notes}` : ""}
`;

// Ensure archive directory exists
await mkdir(ARCHIVES_DIR, { recursive: true });

// Write archive
const archivePath = `${ARCHIVES_DIR}/${archiveName}`;
await Bun.write(archivePath, md);

// Clear session log
await unlink(SESSION_FILE);

console.log(`Archived to ${archivePath}`);
console.log(md);
