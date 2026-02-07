import React from 'react'
import { Box, Text, useStdout, useInput } from 'ink'
import figures from 'figures'
import { useStore, type AgentStatus } from './store'

const STATUS: Record<AgentStatus, { icon: string; color: string }> = {
  queued: { icon: figures.circle, color: 'yellow' },
  working: { icon: figures.play, color: 'blue' },
  waiting: { icon: '?', color: 'magenta' },
  idle: { icon: figures.tick, color: 'green' }
}

const MODEL_ICON: Record<string, string> = {
  small: '★   ',
  medium: '★★  ',
  strong: '★★★ '
}

export function Dashboard() {
  const { stdout } = useStdout()
  const width = stdout?.columns || 80
  const height = stdout?.rows || 24

  const agents = useStore((s) => s.agents)
  const logs = useStore((s) => s.logs)
  const maxAgents = useStore((s) => s.maxAgents)
  const selectedIndex = useStore((s) => s.selectedIndex)
  const activeAgentId = useStore((s) => s.activeAgentId)
  const showActions = useStore((s) => s.showActions)
  const actionIndex = useStore((s) => s.actionIndex)
  const selectNext = useStore((s) => s.selectNext)
  const selectPrev = useStore((s) => s.selectPrev)
  const focusSelected = useStore((s) => s.focusSelected)
  const toggleActions = useStore((s) => s.toggleActions)
  const nextAction = useStore((s) => s.nextAction)
  const prevAction = useStore((s) => s.prevAction)
  const executeAction = useStore((s) => s.executeAction)
  const actions = useStore((s) => s.getActions())

  const working = agents.filter(a => a.status === 'working').length
  const waiting = agents.filter(a => a.status === 'waiting').length
  const queued = agents.filter(a => a.status === 'queued').length

  // Calculate available lines for logs
  // height - header(2) - agents - footer(2) - separator(1)
  const agentLines = Math.max(agents.length, 1)
  const logsAvailable = Math.max(0, height - 2 - agentLines - 2 - 1)
  const visibleLogs = logs.slice(-logsAvailable)

  // Handle arrow keys and enter
  useInput((input, key) => {
    if (showActions) {
      if (key.leftArrow) prevAction()
      else if (key.rightArrow) nextAction()
      else if (key.return) executeAction()
      else if (key.escape || key.upArrow || key.downArrow) toggleActions()
    } else {
      if (key.downArrow) selectNext()
      else if (key.upArrow) selectPrev()
      else if (key.return) focusSelected()
      else if (key.rightArrow) toggleActions()
    }
  })

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Separator */}
      <Text dimColor>{'─'.repeat(width - 2)}</Text>

      {/* Rows */}
      {agents.length === 0 ? (
        <Text dimColor>(no agents)</Text>
      ) : (
        agents.map((agent, index) => {
          const isSelected = index === selectedIndex
          const isActive = agent.id === activeAgentId
          const pointer = isSelected ? figures.pointer : ' '
          const activeIcon = isActive ? figures.radioOn : figures.radioOff

          return (
            <Box key={agent.id}>
              <Box width={3}>
                <Text color="cyan">{pointer}</Text>
              </Box>
              <Box width={3}>
                <Text color={isActive ? 'green' : 'gray'}>{activeIcon}</Text>
              </Box>
              <Box width={3}>
                <Text color={STATUS[agent.status].color}>{STATUS[agent.status].icon}</Text>
              </Box>
              <Box width={5}>
                <Text dimColor>{MODEL_ICON[agent.model]}</Text>
              </Box>
              <Box width={2}>
                <Text>{agent.thinking ? '🧠' : ' '}</Text>
              </Box>
              <Box width={2}>
                <Text>{agent.agentMode === 'plan' ? '📋' : ' '}</Text>
              </Box>
              <Box flexGrow={1} marginLeft={1}>
                <Text>{agent.title || agent.id}</Text>
              </Box>
              {isSelected && showActions && (
                <Box marginLeft={1}>
                  {actions.map((action, i) => (
                    <Text key={action.id} color={i === actionIndex ? 'cyan' : 'gray'} inverse={i === actionIndex}>
                      {' '}{action.icon}{' '}
                    </Text>
                  ))}
                </Box>
              )}
            </Box>
          )
        })
      )}

      {/* Footer stats */}
      <Box marginTop={1}>
        <Text dimColor>
          {working + waiting}/{maxAgents} active | {waiting} waiting | {queued} queued | {figures.arrowUp}/{figures.arrowDown} nav | enter focus | {figures.arrowRight} actions | q quit
        </Text>
      </Box>

      {/* Logs */}
      {visibleLogs.length > 0 && (
        <Box flexDirection="column" flexGrow={1} marginTop={1}>
          {visibleLogs.map((log, i) => (
            <Text key={i} dimColor>&gt; {log}</Text>
          ))}
        </Box>
      )}
    </Box>
  )
}
