import { slotsAvailable$ } from "../agent/events/slots";
import { fs$ } from "../agent/sources/fs";
import { tmux$ } from "../agent/sources/tmux";
import { getConfig } from "../config";
import { createJiraSource$ } from "../work-item/sources/jira";

const config = getConfig();

export const sources = {
	fs$,
	tmux$,
	slotsAvailable$,
	jira$: config.workItems
		.filter((s) => s.provider === "jira")
		.map((s) => createJiraSource$(s)),
};
