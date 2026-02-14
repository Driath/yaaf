import { Box, Text } from "ink";

interface LogPanelProps {
	logs: string[];
}

export function LogPanel({ logs }: LogPanelProps) {
	if (logs.length === 0) return null;

	return (
		<Box flexDirection="column" flexGrow={1} marginTop={1}>
			{logs.map((log, i) => (
				<Text key={i} dimColor>
					&gt; {log}
				</Text>
			))}
		</Box>
	);
}
