import { merge } from "rxjs";
import type { DispatchatorConfig } from "../../config";
import { createJiraSource$ } from "./jira";

const providers = {
	jira: createJiraSource$,
} as const;

export function getWorkItems$(config: DispatchatorConfig) {
	return merge(
		...config.workItems.map((sourceConfig) => {
			const create = providers[sourceConfig.provider];
			return create(sourceConfig);
		}),
	);
}
