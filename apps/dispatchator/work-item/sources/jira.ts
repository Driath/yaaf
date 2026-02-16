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
	parseProject,
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
			const { draft, done } = sourceConfig.excludeStatuses;
			const jql = `project = ${sourceConfig.project} AND status not in ("${draft}", "${done}") ORDER BY rank ASC`;
			const result =
				await jiraClient.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
					jql,
					fields: [...sourceConfig.fields, "*navigable"],
					maxResults: sourceConfig.maxResults,
				});
			const items: WorkItem[] = (result.issues || []).map((issue) => {
				const fields = issue.fields as {
					summary?: string;
					labels?: string[];
					status?: { name?: string };
					parent?: { key?: string };
					comment?: { total?: number };
				};
				const labels = fields.labels || [];
				return {
					id: issue.key,
					summary: fields.summary || "No summary",
					status: fields.status?.name ?? "",
					model: parseModelFromLabels(labels, config.agents.defaultModel),
					thinking: hasThinking(labels),
					agentMode: parseAgentMode(labels),
					workflow: parseWorkflow(labels, config.agents.defaultWorkflow),
					project: parseProject(labels),
					parentId: fields.parent?.key,
					commentCount: fields.comment?.total ?? 0,
				};
			});
			const ids = new Set(items.map((i) => i.id));
			return items.filter((i) => !i.parentId || ids.has(i.parentId));
		}),
		distinctUntilChanged(
			(prev, curr) =>
				prev.map((i) => `${i.id}:${i.status}`).join() ===
				curr.map((i) => `${i.id}:${i.status}`).join(),
		),
		share(),
	);
}
