#!/usr/bin/env bun
import { render, useApp, useInput } from "ink";
import { Dashboard } from "./components/Dashboard";
import { usePolling } from "./hooks/usePolling";
import { useWatch } from "./hooks/useWatch";

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
