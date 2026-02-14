import type { AgentMode, Model } from "./types";

export function parseModelFromLabels(
	labels: string[],
	defaultModel: Model,
): Model {
	for (const label of labels) {
		if (label === "IA:MODEL:STRONG") return "strong";
		if (label === "IA:MODEL:MEDIUM") return "medium";
		if (label === "IA:MODEL:SMALL") return "small";
	}
	return defaultModel;
}

export function hasThinking(labels: string[]): boolean {
	return labels.includes("IA:CAP:THINK");
}

export function parseAgentMode(labels: string[]): AgentMode {
	if (labels.includes("IA:AGENT:PLAN")) return "plan";
	return "default";
}

export function parseWorkflow(
	labels: string[],
	defaultWorkflow: string,
): string {
	for (const label of labels) {
		if (label.startsWith("IA:WORKFLOW:")) {
			return label.replace("IA:WORKFLOW:", "").toLowerCase().replace(/_/g, "-");
		}
	}
	return defaultWorkflow;
}
