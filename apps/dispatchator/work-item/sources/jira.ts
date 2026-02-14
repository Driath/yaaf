import {
	filter,
	interval,
	type Observable,
	share,
	startWith,
	switchMap,
} from "rxjs";
import { getConfig, type WorkItemSourceConfig } from "../../config";
import { useStore } from "../../store";
import { buildDoneJql, createJiraClient } from "../adapters/jira";
import {
	hasThinking,
	parseAgentMode,
	parseModelFromLabels,
	parseWorkflow,
} from "../labels";
import type { WorkItem } from "../types";

export interface JiraPollResult {
	items: WorkItem[];
	doneIds: string[];
}

export function createJiraSource$(
	sourceConfig: WorkItemSourceConfig,
): Observable<JiraPollResult> {
	const config = getConfig();
	const jiraClient = createJiraClient(sourceConfig.providerConfig);
	let knownIds = new Set<string>();

	return interval(config.polling.jiraInterval).pipe(
		startWith(0),
		switchMap(async () => {
			const allItems: WorkItem[] = [];
			for (const jql of sourceConfig.queries) {
				const result =
					await jiraClient.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
						jql,
						fields: sourceConfig.fields,
						maxResults: sourceConfig.maxResults,
					});
				for (const issue of result.issues || []) {
					const fields = issue.fields as {
						summary?: string;
						labels?: string[];
					};
					const labels = fields.labels || [];
					allItems.push({
						id: issue.key,
						summary: fields.summary || "No summary",
						model: parseModelFromLabels(labels, config.agents.defaultModel),
						thinking: hasThinking(labels),
						agentMode: parseAgentMode(labels),
						workflow: parseWorkflow(labels, config.agents.defaultWorkflow),
					});
				}
			}

			const newItems = allItems.filter((i) => !knownIds.has(i.id));
			knownIds = new Set(allItems.map((i) => i.id));

			const { agents } = useStore.getState();
			const activeIds = agents
				.filter((a) => a.status !== "queued")
				.map((a) => a.id);
			let doneIds: string[] = [];
			if (activeIds.length > 0) {
				const doneJql = buildDoneJql(sourceConfig.doneColumn, activeIds);
				const doneResult =
					await jiraClient.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
						jql: doneJql,
						fields: ["key"],
						maxResults: sourceConfig.maxResults,
					});
				doneIds = (doneResult.issues || []).map((i) => i.key);
			}

			return { items: newItems, doneIds } as JiraPollResult;
		}),
		filter(({ items, doneIds }) => items.length > 0 || doneIds.length > 0),
		share(),
	);
}
