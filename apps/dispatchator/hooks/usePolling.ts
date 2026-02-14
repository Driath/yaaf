import { useEffect } from "react";
import { getConfig } from "../config";
import { useStore } from "../store";
import {
	buildDoneJql,
	createJiraClient,
	hasThinking,
	parseAgentMode,
	parseModelFromLabels,
	parseWorkflow,
} from "../work-item";

const client = createJiraClient();

export function usePolling() {
	const addAgent = useStore((s) => s.addAgent);
	const config = getConfig();

	useEffect(() => {
		const syncInterval = setInterval(() => {
			useStore.getState().syncAgentsState();
		}, config.polling.syncInterval);
		return () => clearInterval(syncInterval);
	}, [config.polling.syncInterval]);

	useEffect(() => {
		const poll = async () => {
			try {
				for (const jql of config.workItem.queries) {
					const result =
						await client.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
							jql,
							fields: config.workItem.fields,
							maxResults: config.workItem.maxResults,
						});

					for (const issue of result.issues || []) {
						const fields = issue.fields as {
							summary?: string;
							labels?: string[];
						};
						const summary = fields.summary || "No summary";
						const labels = fields.labels || [];
						const model = parseModelFromLabels(labels);
						const thinking = hasThinking(labels);
						const agentMode = parseAgentMode(labels);
						const workflow = parseWorkflow(labels);
						addAgent(issue.key, summary, model, thinking, agentMode, workflow);
					}
				}

				const { agents, updateAgent } = useStore.getState();
				const activeIds = agents
					.filter((a) => a.status !== "queued")
					.map((a) => a.id);
				if (activeIds.length > 0) {
					const doneJql = buildDoneJql(config.workItem.doneColumn, activeIds);
					const doneResult =
						await client.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
							jql: doneJql,
							fields: ["key"],
							maxResults: config.workItem.maxResults,
						});
					for (const issue of doneResult.issues || []) {
						updateAgent(issue.key, "idle");
					}
				}
			} catch (_err) {
				// Silent fail
			}
		};

		poll();
		const interval = setInterval(poll, config.polling.jiraInterval);
		return () => clearInterval(interval);
	}, [
		addAgent,
		config.workItem.doneColumn,
		config.workItem.fields,
		config.workItem.maxResults,
		config.workItem.queries,
		config.polling.jiraInterval,
	]);
}
