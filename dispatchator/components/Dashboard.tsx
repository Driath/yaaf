import figures from "figures";
import { Box, Text, useInput, useStdout } from "ink";
import { useStore } from "../store";
import { AgentRow } from "./AgentRow";
import { LogPanel } from "./LogPanel";

export function Dashboard() {
	const { stdout } = useStdout();
	const width = stdout?.columns || 80;
	const height = stdout?.rows || 24;

	const agents = useStore((s) => s.agents);
	const logs = useStore((s) => s.logs);
	const maxAgents = useStore((s) => s.maxAgents);
	const selectedIndex = useStore((s) => s.selectedIndex);
	const activeAgentId = useStore((s) => s.activeAgentId);
	const showActions = useStore((s) => s.showActions);
	const actionIndex = useStore((s) => s.actionIndex);
	const selectNext = useStore((s) => s.selectNext);
	const selectPrev = useStore((s) => s.selectPrev);
	const focusSelected = useStore((s) => s.focusSelected);
	const toggleActions = useStore((s) => s.toggleActions);
	const nextAction = useStore((s) => s.nextAction);
	const prevAction = useStore((s) => s.prevAction);
	const executeAction = useStore((s) => s.executeAction);
	const actions = useStore((s) => s.getActions());

	const working = agents.filter((a) => a.status === "working").length;
	const waiting = agents.filter((a) => a.status === "waiting").length;
	const queued = agents.filter((a) => a.status === "queued").length;

	const agentLines = Math.max(agents.length, 1);
	const logsAvailable = Math.max(0, height - 2 - agentLines - 2 - 1);
	const visibleLogs = logs.slice(-logsAvailable);

	useInput((_input, key) => {
		if (showActions) {
			if (key.leftArrow) prevAction();
			else if (key.rightArrow) nextAction();
			else if (key.return) executeAction();
			else if (key.escape || key.upArrow || key.downArrow) toggleActions();
		} else {
			if (key.downArrow) selectNext();
			else if (key.upArrow) selectPrev();
			else if (key.return) focusSelected();
			else if (key.rightArrow) toggleActions();
		}
	});

	return (
		<Box flexDirection="column" width={width} height={height}>
			<Text dimColor>{"─".repeat(width - 2)}</Text>

			{agents.length === 0 ? (
				<Text dimColor>(no agents)</Text>
			) : (
				agents.map((agent, index) => (
					<AgentRow
						key={agent.id}
						agent={agent}
						isSelected={index === selectedIndex}
						isActive={agent.id === activeAgentId}
						showActions={showActions}
						actionIndex={actionIndex}
						actions={actions}
					/>
				))
			)}

			<Box marginTop={1}>
				<Text dimColor>
					{working + waiting}/{maxAgents} active | {waiting} waiting | {queued}{" "}
					queued | {figures.arrowUp}/{figures.arrowDown} nav | enter focus |{" "}
					{figures.arrowRight} actions | q quit
				</Text>
			</Box>

			<LogPanel logs={visibleLogs} />
		</Box>
	);
}
