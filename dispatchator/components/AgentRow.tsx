import figures from "figures";
import { Box, Text } from "ink";
import type { Agent, AgentStatus } from "../agent/types";

const STATUS: Record<AgentStatus, { icon: string; color: string }> = {
	queued: { icon: figures.circle, color: "yellow" },
	working: { icon: figures.play, color: "blue" },
	waiting: { icon: "?", color: "magenta" },
	idle: { icon: figures.tick, color: "green" },
};

const MODEL_ICON: Record<string, string> = {
	small: "★   ",
	medium: "★★  ",
	strong: "★★★ ",
};

interface AgentRowProps {
	agent: Agent;
	isSelected: boolean;
	isActive: boolean;
	showActions: boolean;
	actionIndex: number;
	actions: { id: string; icon: string }[];
}

export function AgentRow({
	agent,
	isSelected,
	isActive,
	showActions,
	actionIndex,
	actions,
}: AgentRowProps) {
	const pointer = isSelected ? figures.pointer : " ";
	const activeIcon = isActive ? figures.radioOn : figures.radioOff;

	return (
		<Box>
			<Box width={3}>
				<Text color="cyan">{pointer}</Text>
			</Box>
			<Box width={3}>
				<Text color={isActive ? "green" : "gray"}>{activeIcon}</Text>
			</Box>
			<Box width={3}>
				<Text color={STATUS[agent.status].color}>
					{STATUS[agent.status].icon}
				</Text>
			</Box>
			<Box width={5}>
				<Text dimColor>{MODEL_ICON[agent.model]}</Text>
			</Box>
			<Box width={2}>
				<Text>{agent.thinking ? "🧠" : " "}</Text>
			</Box>
			<Box width={2}>
				<Text>{agent.agentMode === "plan" ? "📋" : " "}</Text>
			</Box>
			<Box flexGrow={1} marginLeft={1}>
				<Text>{agent.title || agent.id}</Text>
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
