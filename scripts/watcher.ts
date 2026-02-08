#!/usr/bin/env bun
import { Version3Client } from 'jira.js';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

// Config
const POLL_INTERVAL = 10_000; // 10s
const JIRA_HOST = `https://${process.env.JIRA_SITE}`;
const PROJECT_KEY = process.env.WI_PROJECT_KEY || 'KAN';
const STATUS_COLUMN = process.env.WI_COLUMN || 'Agent-Ready';

// Validate env
if (!process.env.JIRA_EMAIL || !process.env.JIRA_TOKEN) {
  console.error('❌ Missing JIRA credentials in .env');
  console.error('Required: JIRA_EMAIL, JIRA_TOKEN, JIRA_SITE');
  process.exit(1);
}

// Jira client
const jira = new Version3Client({
  host: JIRA_HOST,
  authentication: {
    basic: {
      email: process.env.JIRA_EMAIL,
      apiToken: process.env.JIRA_TOKEN
    }
  }
});

// Event bus
const queue = new EventEmitter();
const runningAgents = new Map<string, ChildProcess>();
const processedTickets = new Set<string>();

interface JiraIssue {
  key: string;
  fields: {
    summary?: { toString(): string } | string;
    description?: { toString(): string } | string;
  };
}

interface AgentConfig {
  workflow?: string;
  model?: string;
  cwd?: string;
  target?: string;
}

// Poll Jira for Agent-Ready tickets using enhanced search API
async function poll() {
  try {
    // Use enhanced search API (the old one is deprecated and returns 410)
    // Enhanced search requires a bounded query (must include a restriction)
    const jql = `project = ${PROJECT_KEY} AND status = "${STATUS_COLUMN}"`;
    const result = await jira.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
      jql,
      fields: ['key', 'summary', 'description'],
      maxResults: 50
    });

    const issues = result.issues || [];
    const newIssues = issues.filter(i => !processedTickets.has(i.key));

    // Update display state
    currentIssues = issues.map(issue => ({
      key: issue.key,
      summary: (issue.fields as { summary?: string }).summary || 'No summary',
      processed: processedTickets.has(issue.key)
    }));

    // Render dashboard
    render(currentIssues);

    // Process new issues
    for (const issue of newIssues) {
      processedTickets.add(issue.key);
      queue.emit('ready', issue as unknown as JiraIssue);
    }
  } catch (err) {
    console.error('❌ Poll error:', err instanceof Error ? err.message : err);
  }
}

// Extract text from description (might be ADF object or plain string)
function extractDescriptionText(description: unknown): string {
  if (!description) return '';
  if (typeof description === 'string') return description;

  // Handle Atlassian Document Format (ADF)
  if (typeof description === 'object' && description !== null) {
    const adf = description as { content?: Array<{ content?: Array<{ text?: string }> }> };
    if (adf.content) {
      return adf.content
        .flatMap(block => block.content?.map(inline => inline.text || '') || [])
        .join('\n');
    }
  }

  return String(description);
}

// Parse Agent Config from description markdown
function parseAgentConfig(description: string): AgentConfig {
  const config: AgentConfig = {};
  const regex = /- (\w+): (.+)/g;
  let match;
  while ((match = regex.exec(description))) {
    const key = match[1] as keyof AgentConfig;
    config[key] = match[2].trim();
  }
  return config;
}

// Spawn Claude agent
queue.on('ready', (issue: JiraIssue) => {
  const summary = typeof issue.fields.summary === 'string'
    ? issue.fields.summary
    : issue.fields.summary?.toString() || 'No summary';
  console.log(`🚀 Spawning agent for ${issue.key}: ${summary}`);

  const descriptionText = extractDescriptionText(issue.fields.description);
  const config = parseAgentConfig(descriptionText);
  const workflow = config.workflow || 'code:implement';
  const target = config.target || '.';

  const args = ['-p', `Execute /${workflow} target="${target}"`];

  if (config.model) {
    args.unshift('--model', config.model);
  }

  const proc = spawn('claude', args, {
    cwd: config.cwd || '.',
    stdio: 'inherit',
    env: { ...process.env }
  });

  runningAgents.set(issue.key, proc);

  proc.on('exit', (code) => {
    console.log(`✅ Agent ${issue.key} exited with code ${code}`);
    runningAgents.delete(issue.key);
  });

  proc.on('error', (err) => {
    console.error(`❌ Agent ${issue.key} error:`, err.message);
    runningAgents.delete(issue.key);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping watcher...');
  for (const [key, proc] of runningAgents) {
    console.log(`  Killing agent ${key}`);
    proc.kill('SIGTERM');
  }
  process.exit(0);
});

// Clear screen and move cursor to top
function clearScreen() {
  process.stdout.write('\x1B[2J\x1B[H');
}

// Render dashboard as table
function render(issues: Array<{ key: string; summary: string; processed: boolean }>) {
  clearScreen();

  const ticketCol = 20;
  const terminalCol = 50;
  const line = '─';

  // Header
  console.log('┌' + line.repeat(ticketCol) + '┬' + line.repeat(terminalCol) + '┐');
  console.log('│' + ' TICKET'.padEnd(ticketCol) + '│' + ' TERMINAL'.padEnd(terminalCol) + '│');
  console.log('├' + line.repeat(ticketCol) + '┼' + line.repeat(terminalCol) + '┤');

  // Rows
  if (issues.length === 0) {
    console.log('│' + ' (no tickets)'.padEnd(ticketCol) + '│' + ''.padEnd(terminalCol) + '│');
  } else {
    for (const issue of issues) {
      const icon = runningAgents.has(issue.key) ? '⚙️' : (issue.processed ? '✅' : '🆕');
      const ticket = ` ${icon} ${issue.key}`.slice(0, ticketCol).padEnd(ticketCol);
      const terminal = ' (output here)'.padEnd(terminalCol);
      console.log('│' + ticket + '│' + terminal + '│');
    }
  }

  // Footer
  console.log('└' + line.repeat(ticketCol) + '┴' + line.repeat(terminalCol) + '┘');
  console.log(`\n${runningAgents.size} agent(s) running | ${processedTickets.size} processed | Ctrl+C to stop`);
}

// Track current issues for display
let currentIssues: Array<{ key: string; summary: string; processed: boolean }> = [];

// Start
clearScreen();
console.log(`👀 Starting watcher...`);
setInterval(poll, POLL_INTERVAL);
poll(); // Initial poll
