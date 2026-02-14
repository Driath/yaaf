import figures from "figures";
import { Box, Text, useInput, useStdout } from "ink";
import { useLogStore } from "../log/store";
import { LogPanel } from "../log/ui/LogPanel";
import { useStore } from "../store";
import { WorkItemRow } from "../work-item/ui/WorkItemRow";

export function Dashboard() {
	const { stdout } = useStdout();
	const width = stdout?.columns || 80;
	const height = stdout?.rows || 24;

	const workItems = useStore((s) => s.workItems);
	const agents = useStore((s) => s.agents);
	const logs = useLogStore((s) => s.logs);
	const maxAgents = useStore((s) => s.maxAgents);
	const selectedIndex = useStore((s) => s.selectedIndex);
	const activeWorkItemId = useStore((s) => s.activeWorkItemId);
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

	const agentsByWorkItem = new Map(agents.map((a) => [a.workItemId, a]));
	const attached = agents.length;
	const queued = workItems.filter((w) => !agentsByWorkItem.has(w.id)).length;

	const itemLines = Math.max(workItems.length, 1);
	const logsAvailable = Math.max(0, height - 3 - itemLines - 2 - 1);
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
			<Box>
				<Box width={36}>
					<Text dimColor>{"      workitem"}</Text>
				</Box>
				<Box width={24}>
					<Text dimColor>workflow</Text>
				</Box>
				<Box width={9}>
					<Text dimColor>opts</Text>
				</Box>
				<Box flexGrow={1} marginLeft={1}>
					<Text dimColor>agent</Text>
				</Box>
			</Box>
			<Text dimColor>{"─".repeat(width - 2)}</Text>

			{workItems.length === 0 ? (
				<Text dimColor>(no work items)</Text>
			) : (
				workItems.map((item, index) => (
					<WorkItemRow
						key={item.id}
						workItem={item}
						agent={agentsByWorkItem.get(item.id)}
						isSelected={index === selectedIndex}
						isActive={item.id === activeWorkItemId}
						showActions={showActions}
						actionIndex={actionIndex}
						actions={actions}
					/>
				))
			)}

			<Box marginTop={1}>
				<Text dimColor>
					{attached}/{maxAgents} active | {queued} queued | {figures.arrowUp}/
					{figures.arrowDown} nav | enter focus | {figures.arrowRight} actions |
					q quit
				</Text>
			</Box>

			<LogPanel logs={visibleLogs} />
		</Box>
	);
}
