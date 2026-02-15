import {
	distinctUntilChanged,
	type Observable,
	share,
	switchMap,
	timer,
} from "rxjs";
import { getConfig, type WorkItemSourceConfig } from "../../config";
import { createJiraClient } from "../adapters/jira";
import {
	hasThinking,
	parseAgentMode,
	parseModelFromLabels,
	parseWorkflow,
} from "../labels";
import type { WorkItem } from "../types";

export function createJiraSource$(
	sourceConfig: WorkItemSourceConfig,
): Observable<WorkItem[]> {
	const config = getConfig();
	const jiraClient = createJiraClient(sourceConfig.providerConfig);

	return timer(0, config.polling.jiraInterval).pipe(
		switchMap(async () => {
			const items: WorkItem[] = [];
			for (const jql of sourceConfig.queries) {
				const result =
					await jiraClient.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
						jql,
						fields: [...sourceConfig.fields, "*navigable"],
						maxResults: sourceConfig.maxResults,
					});
				for (const issue of result.issues || []) {
					const fields = issue.fields as {
						summary?: string;
						labels?: string[];
						parent?: { key?: string };
						comment?: { total?: number };
					};
					const labels = fields.labels || [];
					items.push({
						id: issue.key,
						summary: fields.summary || "No summary",
						model: parseModelFromLabels(labels, config.agents.defaultModel),
						thinking: hasThinking(labels),
						agentMode: parseAgentMode(labels),
						workflow: parseWorkflow(labels, config.agents.defaultWorkflow),
						parentId: fields.parent?.key,
						commentCount: fields.comment?.total ?? 0,
					});
				}
			}
			const ids = new Set(items.map((i) => i.id));
			return items.filter((i) => !i.parentId || ids.has(i.parentId));
		}),
		distinctUntilChanged(
			(prev, curr) =>
				prev.map((i) => `${i.id}:${i.commentCount}`).join() ===
				curr.map((i) => `${i.id}:${i.commentCount}`).join(),
		),
		share(),
	);
}
