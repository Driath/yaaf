import { existsSync } from "node:fs";
import { join } from "node:path";

export interface JiraProviderConfig {
	site: string;
	email: string;
	token: string;
}

export interface WorkItemSourceConfig {
	provider: "jira";
	providerConfig: JiraProviderConfig;
	queries: string[];
	doneColumn: string;
	maxResults: number;
	fields: string[];
}

export interface DispatchatorConfig {
	workItems: WorkItemSourceConfig[];
	polling: {
		jiraInterval: number;
		syncInterval: number;
	};
	agents: {
		maxConcurrent: number;
		defaultModel: "small" | "medium" | "strong";
		defaultWorkflow: string;
		claudePath: "auto" | string;
	};
}

export function defineConfig(config: DispatchatorConfig): DispatchatorConfig {
	return config;
}

let cached: DispatchatorConfig | null = null;

export function getConfig(): DispatchatorConfig {
	if (cached) return cached;

	const configPath = join(process.cwd(), "dispatchator.config.ts");

	if (existsSync(configPath)) {
		try {
			const mod = require(configPath);
			cached = mod.default || mod;
		} catch {
			cached = buildFallbackConfig();
		}
	} else {
		cached = buildFallbackConfig();
	}

	return cached as DispatchatorConfig;
}

function buildFallbackConfig(): DispatchatorConfig {
	return {
		workItems: [
			{
				provider: "jira",
				providerConfig: {
					site: process.env.JIRA_SITE ?? "",
					email: process.env.JIRA_EMAIL ?? "",
					token: process.env.JIRA_TOKEN ?? "",
				},
				queries: ['project = KAN AND status = "Agent-Ready" ORDER BY rank ASC'],
				doneColumn: "Done",
				maxResults: 50,
				fields: ["key", "summary", "description", "labels", "comment"],
			},
		],
		polling: {
			jiraInterval: 10_000,
			syncInterval: 2_000,
		},
		agents: {
			maxConcurrent: 2,
			defaultModel: "small",
			defaultWorkflow: "intent",
			claudePath: "auto",
		},
	};
}
