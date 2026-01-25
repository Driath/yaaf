import { execSync } from 'child_process';
import { join } from 'path';
import { resolveWorkItemConfig } from './config/resolve';

// Parse CLI args (key=value format)
function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  process.argv.slice(2).forEach(arg => {
    const match = arg.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      args[key] = value;
    }
  });
  return args;
}

// CLI usage
if (import.meta.main) {
  const args = parseArgs();

  if (!args.project) {
    console.error(JSON.stringify({
      error: 'Missing required arguments',
      required: [
        { propertyName: 'project', description: 'Project name (e.g., DGD)' }
      ],
      missing: [
        { propertyName: 'project', description: 'Project name' }
      ]
    }, null, 2));
    process.exit(1);
  }

  try {
    const project = args.project;

    // Resolve config from registry + env vars (provider, projectKey, status)
    const config = resolveWorkItemConfig(project);

    // Call the appropriate adapter
    const adapterPath = join(process.cwd(), 'work-item', 'adapters', config.provider, 'query.ts');
    const envPrefix = project;

    // Build query from resolved config
    const projectKey = config.projectKey || project;
    const status = config.status || 'À faire';
    const jql = `project = ${projectKey} AND status = '${status}' ORDER BY priority DESC, created DESC`;

    // Adapter will read credentials from env vars using envPrefix
    const command = `bun ${adapterPath} envPrefix=${envPrefix} jql="${jql}" fields="key,summary,priority,status"`;
    const output = execSync(command, { encoding: 'utf8' });

    console.log(output);
  } catch (error) {
    console.error(JSON.stringify({
      error: 'Failed to list work items',
      message: error instanceof Error ? error.message : String(error)
    }, null, 2));
    process.exit(1);
  }
}
