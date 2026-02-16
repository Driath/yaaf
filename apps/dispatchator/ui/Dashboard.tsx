import { spawnSync } from "node:child_process";
import figures from "figures";
import { Box, Text, useInput, useStdout } from "ink";
import { useEffect, useState } from "react";
import { useLogStore } from "../log/store";
import { LogPanel } from "../log/ui/LogPanel";
import { useStore } from "../store";
import { useColumns } from "../work-item/ui/columns";
import {
	type ChildAgent,
	WORK_ITEM_COLUMNS,
	WorkItemRow,
} from "../work-item/ui/WorkItemRow";

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

type Status = "success" | "warning" | "error";
const STATUS_COLOR: Record<Status, string> = {
	success: "green",
	warning: "yellow",
	error: "red",
};
const STATUS_ICON: Record<Status, string> = {
	success: figures.tick,
	warning: figures.warning,
	error: figures.cross,
};

function StatusText({
	status,
	children,
}: {
	status: Status;
	children: string;
}) {
	return (
		<Text color={STATUS_COLOR[status]}>
			{STATUS_ICON[status]} {children}
		</Text>
	);
}

function AgentCount({
	attached,
	max,
	queued,
}: {
	attached: number;
	max: number;
	queued: number;
}) {
	const status: Status =
		queued === 0 && attached === 0
			? "success"
			: attached === max
				? "success"
				: attached === 0
					? "error"
					: "warning";
	return <StatusText status={status}>{`A:${attached}/${max}`}</StatusText>;
}

function WaitingCount({ waiting, total }: { waiting: number; total: number }) {
	const status: Status =
		waiting === 0 ? "success" : waiting === total ? "error" : "warning";
	return <StatusText status={status}>{`W:${waiting}`}</StatusText>;
}

function QueueCount({ queued }: { queued: number }) {
	const status: Status = queued === 0 ? "success" : "warning";
	return <StatusText status={status}>{`Q:${queued}`}</StatusText>;
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
	const childAgentsByParent = new Map<string, ChildAgent[]>();
	for (const item of workItems) {
		if (!item.parentId) continue;
		const agent = agentsByWorkItem.get(item.id);
		if (!agent) continue;
		const list = childAgentsByParent.get(item.parentId) ?? [];
		list.push({ workItemId: item.id, agent });
		childAgentsByParent.set(item.parentId, list);
	}
	const waiting = agents.filter(
		(a) => a.hookStatus === "waiting" || a.hookStatus === "idle",
	).length;
	const active = agents.length - waiting;
	const queued = workItems.filter(
		(w) => !agentsByWorkItem.has(w.id) && w.status === "Agent-Ready",
	).length;
	const titleText = `dispatchator: ${active}/${maxAgents} active | ${waiting} waiting | ${queued} queued`;

	useEffect(() => {
		process.stdout.write(`\x1b]0;${titleText}\x07`);
		if (process.env.TMUX) {
			spawnSync("tmux", ["rename-window", titleText]);
		}
	}, [titleText]);

	const showHeader = layout.inline.filter((c) => c.label).length > 1;
	const headerLines = showHeader ? 2 : 0;
	const statusLines = 1;
	const overflowCount = layout.overflow.length;
	const linesPerItem = 1 + overflowCount + (overflowCount > 0 ? 1 : 0);
	const allItemLines = Math.max(workItems.length * linesPerItem, 1);
	const fixedLines = headerLines + statusLines;
	const allFit = allItemLines + fixedLines <= height;
	const visibleItems = allFit
		? workItems
		: workItems.slice(selectedIndex, selectedIndex + 1);
	const visibleOffset = allFit ? 0 : selectedIndex;
	const navPrev = !allFit && selectedIndex > 0 ? 1 : 0;
	const navNext = !allFit && selectedIndex < workItems.length - 1 ? 1 : 0;
	const itemLines = allFit ? allItemLines : linesPerItem + navPrev + navNext;
	const logsAvailable = Math.max(0, height - fixedLines - itemLines);

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
				<>
					{!allFit && selectedIndex > 0 && (
						<Text dimColor>
							{figures.arrowUp} {workItems[selectedIndex - 1].id}
						</Text>
					)}
					{visibleItems.map((item, i) => {
						const index = visibleOffset + i;
						return (
							<WorkItemRow
								key={item.id}
								workItem={item}
								agent={agentsByWorkItem.get(item.id)}
								childAgents={childAgentsByParent.get(item.id) ?? []}
								isSelected={index === selectedIndex}
								isActive={item.id === activeWorkItemId}
								showActions={showActions}
								actionIndex={actionIndex}
								actions={actions}
								layout={layout}
								width={width}
							/>
						);
					})}
					{!allFit && selectedIndex < workItems.length - 1 && (
						<Text dimColor>
							{figures.arrowDown} {workItems[selectedIndex + 1].id}
						</Text>
					)}
				</>
			)}

			{/* <LogPanel logs={logs} maxLines={logsAvailable} width={width} /> */}

			<Box flexShrink={0} width="100%">
				<AgentCount attached={active} max={maxAgents} queued={queued} />
				<Text>{` | `}</Text>
				<WaitingCount waiting={waiting} total={agents.length} />
				<Text>{` | `}</Text>
				<QueueCount queued={queued} />
			</Box>
		</Box>
	);
}
