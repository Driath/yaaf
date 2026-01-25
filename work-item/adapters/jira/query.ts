import { execSync } from 'child_process';
import type { QueryConfig, QueryResult, WorkItem, QueryWorkItems } from '../../ports/query';

/**
 * Jira Adapter: Query work items using Atlassian CLI
 */
export const queryWorkItems: QueryWorkItems = async (config: QueryConfig): Promise<QueryResult> => {
  // Load env
  const site = process.env[`${config.envPrefix}_WORK_ITEM_SITE`];
  const email = process.env[`${config.envPrefix}_WORK_ITEM_EMAIL`];
  const token = process.env[`${config.envPrefix}_WORK_ITEM_TOKEN`];

  if (!site || !email || !token) {
    throw new Error(
      `Missing Jira credentials for ${config.envPrefix}. ` +
      `Required: ${config.envPrefix}_WORK_ITEM_SITE, ${config.envPrefix}_WORK_ITEM_EMAIL, ${config.envPrefix}_WORK_ITEM_TOKEN`
    );
  }

  // Auth
  try {
    execSync(
      `echo "${token}" | acli jira auth login --site "${site}" --email "${email}" --token`,
      { stdio: 'pipe' }
    );
  } catch (error) {
    throw new Error(`Failed to authenticate with Jira: ${error}`);
  }

  // Query
  const fields = config.fields || 'key,summary,priority,status';
  const result = execSync(
    `acli jira workitem search --jql "${config.jql}" --fields "${fields}" --json`,
    { encoding: 'utf-8' }
  );

  // Parse and normalize to port interface
  const raw = JSON.parse(result);
  const workItems: WorkItem[] = raw.map((issue: any) => ({
    key: issue.key,
    title: issue.fields.summary,
    priority: issue.fields.priority?.name,
    status: issue.fields.status?.name
  }));

  return { workItems };
};

// CLI usage
if (import.meta.main) {
  const args: Record<string, string> = {};

  process.argv.slice(2).forEach(arg => {
    const match = arg.match(/^([^=]+)=(.+)$/);
    if (match) {
      const [, key, value] = match;
      args[key] = value;
    }
  });

  if (!args.envPrefix || !args.jql) {
    console.error(JSON.stringify({
      error: 'Missing required arguments',
      usage: 'query.ts envPrefix=<prefix> jql=<query> [fields=<fields>]',
      example: 'query.ts envPrefix=DGD jql="project = KAN AND status = \'To Do\'" fields="key,summary,priority"'
    }));
    process.exit(1);
  }

  try {
    const result = await queryWorkItems({
      envPrefix: args.envPrefix,
      jql: args.jql,
      fields: args.fields
    });
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(JSON.stringify({
      error: 'Query failed',
      message: error instanceof Error ? error.message : String(error)
    }));
    process.exit(1);
  }
}
