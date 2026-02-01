// Spawn agents in a dedicated tmux session (yaaf-agents)
// The orchestrator runs in a separate Warp window without tmux

import { spawn, spawnSync } from 'child_process'

const AGENTS_SESSION = 'yaaf-agents'

// Check if agents session exists
function hasAgentsSession(): boolean {
  const result = spawnSync('tmux', ['has-session', '-t', AGENTS_SESSION], { stdio: 'ignore' })
  return result.status === 0
}

// Check if an agent window already exists
function hasAgentWindow(ticketId: string): boolean {
  const result = spawnSync('tmux', ['list-windows', '-t', AGENTS_SESSION, '-F', '#{window_name}'])
  if (result.status !== 0) return false
  const windows = result.stdout.toString().split('\n')
  return windows.includes(ticketId)
}

// Get all running agent windows
export function getRunningAgents(): string[] {
  const result = spawnSync('tmux', ['list-windows', '-t', AGENTS_SESSION, '-F', '#{window_name}'])
  if (result.status !== 0) return []
  return result.stdout.toString().trim().split('\n').filter(w => w && w !== 'bash')
}

export async function spawnAgent(ticketId: string, summary: string): Promise<string | null> {
  const claudePath = '/Users/matthieuczeski/.nvm/versions/node/v22.16.0/bin/claude'
  const cwd = process.cwd()
  const prompt = `Coucou ! Je suis l'agent pour le ticket ${ticketId}`
  const cmd = `cd ${cwd} && ${claudePath} "${prompt}"`

  // Check if agents session is running
  if (!hasAgentsSession()) {
    return Promise.reject(new Error('yaaf-agents session not running. Run: bun start:agents'))
  }

  // Skip if agent window already exists
  if (hasAgentWindow(ticketId)) {
    return Promise.resolve(ticketId)
  }

  return new Promise((resolve, reject) => {
    // Create a new window for this agent
    const proc = spawn('tmux', [
      'new-window',
      '-t', AGENTS_SESSION,
      '-n', ticketId,
      cmd
    ])

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(ticketId)
      } else {
        reject(new Error(`tmux new-window exited with code ${code}`))
      }
    })
    proc.on('error', reject)
  })
}

// Switch to a specific agent window
export function focusAgent(ticketId: string): void {
  spawnSync('tmux', ['select-window', '-t', `${AGENTS_SESSION}:${ticketId}`])
}

// Get the currently active agent window
export function getActiveAgent(): string | null {
  const result = spawnSync('tmux', [
    'display-message', '-t', AGENTS_SESSION, '-p', '#{window_name}'
  ])
  if (result.status !== 0) return null
  const name = result.stdout.toString().trim()
  return name && name !== 'bash' ? name : null
}

// Kill an agent window
export function killAgent(ticketId: string): boolean {
  const result = spawnSync('tmux', ['kill-window', '-t', `${AGENTS_SESSION}:${ticketId}`])
  return result.status === 0
}


// Get the currently focused agent window
export function getFocusedAgent(): string | null {
  const result = spawnSync('tmux', [
    'display-message', '-t', AGENTS_SESSION, '-p', '#{window_name}'
  ])
  if (result.status !== 0) return null
  const name = result.stdout.toString().trim()
  return name && name !== 'bash' ? name : null
}
