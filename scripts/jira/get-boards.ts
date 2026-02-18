#!/usr/bin/env bun

/**
 * List Jira boards, optionally filtered by project key.
 *
 * Usage: bun scripts/jira/get-boards.ts [--project=PROJECT-KEY]
 *
 * Exit codes: 0 success, 1 error
 */

import { AgileClient } from "jira.js";
import { parseArgs } from "./client.ts";

const { flags } = parseArgs(process.argv);

const site = process.env.JIRA_SITE;
const email = process.env.JIRA_EMAIL;
const token = process.env.JIRA_TOKEN;

if (!site || !email || !token) {
	console.error("Missing environment variable: JIRA_SITE, JIRA_EMAIL, JIRA_TOKEN");
	process.exit(1);
}

const client = new AgileClient({
	host: `https://${site}`,
	authentication: {
		basic: {
			email,
			apiToken: token,
		},
	},
});

try {
	const result = await client.board.getAllBoards({
		projectKeyOrId: flags.project,
	});
	const boards = (result.values ?? []).map((b) => ({
		id: b.id,
		name: b.name,
		type: b.type,
		projectKey: b.location?.projectKey,
	}));
	console.log(JSON.stringify(boards, null, 2));
} catch (error) {
	console.error("Failed to fetch boards:", error);
	process.exit(1);
}
