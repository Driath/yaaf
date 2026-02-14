import { useEffect } from "react";
import type { Observable } from "rxjs";
import { getConfig } from "../config";
import { useLogStore } from "../log/store";
import type { JiraPollResult } from "../work-item/sources/jira";
import { createJiraSource$ } from "../work-item/sources/jira";

const config = getConfig();
const workItemSources$: Observable<JiraPollResult>[] = config.workItems
	.filter((s) => s.provider === "jira")
	.map((s) => createJiraSource$(s));

export { workItemSources$ };

export function useSources() {
	useEffect(() => {
		const { log } = useLogStore.getState();
		log({ type: "source", source: "FS" });
		log({ type: "source", source: "SlotsAvailable" });
		for (const _ of workItemSources$) {
			log({ type: "source", source: "Jira" });
		}
	}, []);
}
