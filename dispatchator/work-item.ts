import { Version3Client } from "jira.js";
import type { AgentMode, Model } from "./agent/types";
import { getConfig } from "./config";

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

export function parseModelFromLabels(labels: string[]): Model {
	for (const label of labels) {
		if (label === "IA:MODEL:STRONG") return "strong";
		if (label === "IA:MODEL:MEDIUM") return "medium";
		if (label === "IA:MODEL:SMALL") return "small";
	}
	return getConfig().agents.defaultModel;
}

export function hasThinking(labels: string[]): boolean {
	return labels.includes("IA:CAP:THINK");
}

export function parseAgentMode(labels: string[]): AgentMode {
	if (labels.includes("IA:AGENT:PLAN")) return "plan";
	return "default";
}

export function parseWorkflow(labels: string[]): string {
	for (const label of labels) {
		if (label.startsWith("IA:WORKFLOW:")) {
			return label.replace("IA:WORKFLOW:", "").toLowerCase().replace(/_/g, "-");
		}
	}
	return getConfig().agents.defaultWorkflow;
}
