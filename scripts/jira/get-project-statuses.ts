#!/usr/bin/env bun

/**
 * List all statuses for a Jira project.
 *
 * Usage: bun scripts/jira/get-project-statuses.ts <project-key>
 *
 * Exit codes: 0 success, 1 error
 */

import { createClient, parseArgs } from "./client.ts";

const { positional } = parseArgs(process.argv);
const projectKey = positional[0];

if (!projectKey) {
	console.error("Usage: bun scripts/jira/get-project-statuses.ts <project-key>");
	process.exit(1);
}

const client = createClient();

try {
	const statuses = await client.projects.getAllStatuses({ projectIdOrKey: projectKey });
	const flat = statuses.flatMap((issueType) =>
		(issueType.statuses ?? []).map((s) => ({
			id: s.id,
			name: s.name,
			category: s.statusCategory?.name,
			issueType: issueType.name,
		})),
	);
	const unique = Array.from(new Map(flat.map((s) => [s.id, s])).values());
	console.log(JSON.stringify(unique, null, 2));
} catch (error) {
	console.error("Failed to fetch statuses:", error);
	process.exit(1);
}
