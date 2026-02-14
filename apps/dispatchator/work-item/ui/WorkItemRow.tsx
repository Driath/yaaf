import figures from "figures";
import { Box, Text } from "ink";
import type { AgentProcess } from "../../agent/types";
import type { WorkItem } from "../types";

const MODEL_ICON: Record<string, string> = {
	small: "★   ",
	medium: "★★  ",
	strong: "★★★ ",
};

const STATUS_ICON: Record<string, string> = {
	working: figures.play,
	waiting: "?",
	idle: figures.tick,
};

interface WorkItemRowProps {
	workItem: WorkItem;
	agent?: AgentProcess;
	isSelected: boolean;
	isActive: boolean;
	showActions: boolean;
	actionIndex: number;
	actions: { id: string; icon: string }[];
}

export function WorkItemRow({
	workItem,
	agent,
	isSelected,
	isActive,
	showActions,
	actionIndex,
	actions,
}: WorkItemRowProps) {
	const pointer = isSelected ? figures.pointer : " ";
	const activeIcon = isActive ? figures.radioOn : figures.radioOff;

	return (
		<Box>
			{/* workitem */}
			<Box width={3}>
				<Text color="cyan">{pointer}</Text>
			</Box>
			<Box width={3}>
				<Text color={isActive ? "green" : "gray"}>{activeIcon}</Text>
			</Box>
			<Box width={30}>
				<Text wrap="truncate-end">
					<Text bold>{workItem.id}</Text>
					{` - ${workItem.summary}`}
				</Text>
			</Box>

			{/* workflow */}
			<Box width={24}>
				<Text dimColor wrap="truncate-end">
					{workItem.workflow}
				</Text>
			</Box>

			{/* opts */}
			<Box width={5}>
				<Text dimColor>{MODEL_ICON[workItem.model]}</Text>
			</Box>
			<Box width={2}>
				<Text>{workItem.thinking ? "🧠" : " "}</Text>
			</Box>
			<Box width={2}>
				<Text>{workItem.agentMode === "plan" ? "📋" : " "}</Text>
			</Box>

			{/* agent */}
			<Box flexGrow={1} marginLeft={1}>
				{agent ? (
					<Text dimColor wrap="truncate-end">
						{STATUS_ICON[agent.hookStatus] ?? (agent.hookStatus || "?")}{" "}
						{agent.title}
					</Text>
				) : (
					<Text dimColor>-</Text>
				)}
			</Box>

			{isSelected && showActions && (
				<Box marginLeft={1}>
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
