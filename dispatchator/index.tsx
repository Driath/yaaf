#!/usr/bin/env bun
import { render, useApp, useInput } from "ink";
import { Dashboard } from "./Dashboard";
import { usePolling } from "./usePolling";
import { useWatch } from "./useWatch";

// Validate env
if (!process.env.JIRA_EMAIL || !process.env.JIRA_TOKEN) {
	console.error("❌ Missing JIRA credentials in .env");
	console.error("Required: JIRA_EMAIL, JIRA_TOKEN, JIRA_SITE");
	process.exit(1);
}

function App() {
	const { exit } = useApp();

	useInput((input, key) => {
		if (input === "q" || (key.ctrl && input === "c")) {
			exit();
		}
	});

	usePolling();
	useWatch();

	return <Dashboard />;
}

render(<App />, { fullScreen: true } as Parameters<typeof render>[1]);
