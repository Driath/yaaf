import { Version3Client } from "jira.js";
import type { JiraProviderConfig } from "../../config";

export function createJiraClient(config: JiraProviderConfig): Version3Client {
	if (!config.email || !config.token || !config.site) {
		throw new Error("Missing Jira credentials in config (site, email, token)");
	}
	return new Version3Client({
		host: `https://${config.site}`,
		authentication: {
			basic: {
				email: config.email,
				apiToken: config.token,
			},
		},
	});
}
