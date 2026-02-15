import figures from "figures";
import { Box, Text } from "ink";
import type { AgentProcess } from "../../agent/types";
import type { WorkItem } from "../types";
import type { ColumnDef, ColumnLayout } from "./columns";

const MODEL_ICON: Record<string, string> = {
	small: "★",
	medium: "★★",
	strong: "★★★",
};

const STATUS_ICON: Record<string, string> = {
	working: figures.play,
	waiting: "?",
	idle: figures.tick,
};

export type WorkItemCellCtx = {
	workItem: WorkItem;
	agent?: AgentProcess;
	isSelected: boolean;
	isActive: boolean;
};

export const WORK_ITEM_COLUMNS: ColumnDef<WorkItemCellCtx>[] = [
	{
		key: "pointer",
		width: 3,
		render: (ctx) => (
			<Text color="cyan">{ctx.isSelected ? figures.pointer : " "}</Text>
		),
	},
	{
		key: "workitem",
		width: 30,
		label: "workitem",
		render: (ctx) => (
			<Text wrap="truncate-end">
				<Text bold>{ctx.workItem.id}</Text>
				{` - ${ctx.workItem.summary}`}
			</Text>
		),
	},
	{
		key: "workflow",
		width: 24,
		label: "workflow",
		render: (ctx) => (
			<Text dimColor wrap="truncate-end">
				{ctx.workItem.workflow}
			</Text>
		),
	},
	{
		key: "opts",
		width: 9,
		label: "opts",
		render: (ctx) => {
			const flags = [
				ctx.workItem.thinking ? "T" : "",
				ctx.workItem.agentMode === "plan" ? "P" : "",
			]
				.filter(Boolean)
				.join("");
			return (
				<Text dimColor>
					{MODEL_ICON[ctx.workItem.model]}
					{flags && ` `}
					{flags && <Text color="yellow">{flags}</Text>}
				</Text>
			);
		},
	},
	{
		key: "agent",
		flex: 1,
		label: "agent",
		render: (ctx) => {
			if (!ctx.agent) return null;
			const icon = ctx.isActive ? figures.radioOn : figures.radioOff;
			const isWaiting = ctx.agent.hookStatus === "waiting";
			const status =
				STATUS_ICON[ctx.agent.hookStatus] ?? (ctx.agent.hookStatus || "?");
			return (
				<Text wrap="truncate-end">
					<Text color={ctx.isActive ? "green" : "gray"}>{icon}</Text>{" "}
					{isWaiting ? (
						<Text color="yellow" bold>
							{status} {ctx.agent.title}
						</Text>
					) : (
						<Text dimColor>
							{status} {ctx.agent.title}
						</Text>
					)}
				</Text>
			);
		},
	},
];

interface WorkItemRowProps {
	workItem: WorkItem;
	agent?: AgentProcess;
	isSelected: boolean;
	isActive: boolean;
	showActions: boolean;
	actionIndex: number;
	actions: { id: string; icon: string }[];
	layout: ColumnLayout<WorkItemCellCtx>;
	width: number;
}

export function WorkItemRow({
	workItem,
	agent,
	isSelected,
	isActive,
	showActions,
	actionIndex,
	actions,
	layout,
	width,
}: WorkItemRowProps) {
	const ctx: WorkItemCellCtx = { workItem, agent, isSelected, isActive };
	const overflowRows = layout.overflow
		.map((c) => ({ col: c, content: c.render(ctx) }))
		.filter((r) => r.content != null);

	const hasChildren = overflowRows.length > 0;
	let seenContent = false;

	return (
		<Box
			flexDirection="column"
			width={width}
			marginBottom={hasChildren ? 1 : 0}
		>
			<Box>
				{layout.inline.map((c) => {
					const content = c.render(ctx) ?? <Text dimColor>-</Text>;
					if (c.key !== "pointer" && hasChildren && !seenContent) {
						seenContent = true;
						return (
							<Box key={c.key} width={c.width}>
								<Text dimColor>┌ </Text>
								<Box width={Math.max(1, c.width - 2)}>{content}</Box>
							</Box>
						);
					}
					return (
						<Box key={c.key} width={c.width}>
							{content}
						</Box>
					);
				})}
			</Box>
			{overflowRows.map((r, i) => {
				const prefix = i === overflowRows.length - 1 ? "   └─ " : "   ├─ ";
				const label = r.col.label ? `${r.col.label}: ` : "";
				const prefixWidth = prefix.length + label.length;
				return (
					<Box key={r.col.key}>
						<Text dimColor>
							{prefix}
							{label}
						</Text>
						<Box width={Math.max(1, width - prefixWidth)}>{r.content}</Box>
					</Box>
				);
			})}
			{isSelected && showActions && (
				<Box marginLeft={3}>
					{actions.map((action, i) => (
						<Text
							key={action.id}
							color={i === actionIndex ? "cyan" : "gray"}
							inverse={i === actionIndex}
						>
							{" "}
							{action.icon}{" "}
						</Text>
					))}
				</Box>
			)}
		</Box>
	);
}
