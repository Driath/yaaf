import { Box, Text } from "ink";
import type { LogEntry } from "../types";

interface LogPanelProps {
	logs: LogEntry[];
}

export function LogPanel({ logs }: LogPanelProps) {
	if (logs.length === 0) return null;

	return (
		<Box flexDirection="column" flexGrow={1} marginTop={1}>
			{logs.map((entry, i) => (
				<Box key={i}>
					<Text dimColor>{entry.timestamp} </Text>
					{entry.type === "source" ? (
						<Text color="green" dimColor>
							[source] {entry.source}
						</Text>
					) : (
						<Text>
							<Text color="blue" dimColor>
								[event]
							</Text>{" "}
							<Text bold>{entry.source}</Text>
							{entry.action && (
								<Text>
									<Text dimColor> → </Text>
									{entry.action}
								</Text>
							)}
							{entry.detail && <Text dimColor> {entry.detail}</Text>}
						</Text>
					)}
				</Box>
			))}
		</Box>
	);
}
