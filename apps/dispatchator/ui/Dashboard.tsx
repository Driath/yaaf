import figures from "figures";
import { Box, Text, useInput, useStdout } from "ink";
import { useEffect, useState } from "react";
import { useLogStore } from "../log/store";
import { LogPanel } from "../log/ui/LogPanel";
import { useStore } from "../store";
import { useColumns } from "../work-item/ui/columns";
import { WORK_ITEM_COLUMNS, WorkItemRow } from "../work-item/ui/WorkItemRow";

function useTerminalSize() {
	const { stdout } = useStdout();
	const [size, setSize] = useState({
		width: stdout?.columns || 80,
		height: stdout?.rows || 24,
	});

	useEffect(() => {
		if (!stdout) return;
		const onResize = () =>
			setSize({ width: stdout.columns, height: stdout.rows });
		stdout.on("resize", onResize);
		return () => {
			stdout.off("resize", onResize);
		};
	}, [stdout]);

	return size;
}

export function Dashboard() {
	const { width, height } = useTerminalSize();

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

	const layout = useColumns(WORK_ITEM_COLUMNS, width);
	const agentsByWorkItem = new Map(agents.map((a) => [a.workItemId, a]));
	const attached = agents.length;
	const queued = workItems.filter((w) => !agentsByWorkItem.has(w.id)).length;

	const overflowCount = layout.overflow.length;
	const linesPerItem = 1 + overflowCount + (overflowCount > 0 ? 1 : 0);
	const itemLines = Math.max(workItems.length * linesPerItem, 1);
	const showHeader = layout.inline.filter((c) => c.label).length > 1;
	const headerLines = showHeader ? 2 : 0;
	const statusLines = 2;
	const logsAvailable = Math.max(
		0,
		height - headerLines - itemLines - statusLines,
	);

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
			{layout.inline.filter((c) => c.label).length > 1 && (
				<>
					<Box flexShrink={0}>
						{layout.inline.map((c) => (
							<Box key={c.key} width={c.width}>
								<Text dimColor>{c.label ?? ""}</Text>
							</Box>
						))}
					</Box>
					<Box flexShrink={0}>
						<Text dimColor>{"─".repeat(width - 2)}</Text>
					</Box>
				</>
			)}

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
						layout={layout}
						width={width}
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

			<LogPanel logs={logs} maxLines={logsAvailable} width={width} />
		</Box>
	);
}
