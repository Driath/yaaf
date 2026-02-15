import { Box, Text } from "ink";
import type { LogEntry } from "../types";

interface LogPanelProps {
	logs: LogEntry[];
	maxLines: number;
	width: number;
}

export function LogPanel({ logs, maxLines, width }: LogPanelProps) {
	const visible = logs.slice(-maxLines);
	if (visible.length === 0) return null;

	return (
		<Box flexDirection="column" height={maxLines} marginTop={1}>
			{visible.map((entry, i) => (
				<Box key={i} width={width}>
					<Text wrap="truncate-end">
						<Text dimColor>{entry.timestamp} </Text>
						{entry.type === "source" ? (
							<Text color="green" dimColor>
								[source] {entry.source}
							</Text>
						) : (
							<>
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
							</>
						)}
					</Text>
				</Box>
			))}
		</Box>
	);
}
