#!/usr/bin/env bun

/**
 * Create a new Jira project.
 *
 * Usage: bun scripts/jira/create-project.ts <key> <name> [--type=software] [--template=com.pyxis.greenhopper.jira:gh-simplified-kanban-classic]
 *
 * Exit codes: 0 success, 1 error
 */

import { createClient, parseArgs } from "./client.ts";

const { positional, flags } = parseArgs(process.argv);
const [key, ...nameParts] = positional;
const name = nameParts.join(" ");

if (!key || !name) {
	console.error("Usage: bun scripts/jira/create-project.ts <key> <name> [--type=software] [--template=...]");
	process.exit(1);
}

const projectTypeKey = flags.type ?? "software";
const projectTemplateKey = flags.template ?? "com.pyxis.greenhopper.jira:gh-simplified-kanban-classic";

const client = createClient();

try {
	const project = await client.projects.createProject({
		key,
		name,
		projectTypeKey,
		projectTemplateKey,
		leadAccountId: flags.lead,
	});
	console.log(JSON.stringify({ key: project.key, id: project.id, name: project.name, url: project.self }, null, 2));
} catch (error) {
	if (error && typeof error === "object" && "response" in error) {
		const e = error as { response: { data: unknown } };
		console.error("Failed to create project:", JSON.stringify(e.response.data, null, 2));
	} else {
		console.error("Failed to create project:", error);
	}
	process.exit(1);
}
