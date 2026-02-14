import { Version3Client } from "jira.js";

export function createJiraClient(): Version3Client {
	return new Version3Client({
		host: `https://${process.env.JIRA_SITE}`,
		authentication: {
			basic: {
				email: process.env.JIRA_EMAIL ?? "",
				apiToken: process.env.JIRA_TOKEN ?? "",
			},
		},
	});
}

export function buildDoneJql(doneColumn: string, activeIds: string[]): string {
	return `key in (${activeIds.join(",")}) AND status = "${doneColumn}"`;
}
