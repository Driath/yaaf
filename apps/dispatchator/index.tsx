#!/usr/bin/env bun
import { render, useApp, useInput } from "ink";
import { Dashboard } from "./ui/Dashboard";
import { useSources } from "./ui/useSources";

function App() {
	const { exit } = useApp();

	useInput((input, key) => {
		if (key.ctrl && input === "c") {
			exit();
		}
	});

	useSources();

	return <Dashboard />;
}

render(<App />, { fullScreen: true } as Parameters<typeof render>[1]);
