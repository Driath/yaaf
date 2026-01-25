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

  if (!args.project || !args.key) {
    console.error(JSON.stringify({
      error: 'Missing required arguments',
      required: [
        { propertyName: 'project', description: 'Project name (e.g., DGD)' },
        { propertyName: 'key', description: 'Work item key (e.g., KAN-123)' }
      ],
      missing: [
        ...(!args.project ? [{ propertyName: 'project', description: 'Project name' }] : []),
        ...(!args.key ? [{ propertyName: 'key', description: 'Work item key' }] : [])
      ]
    }, null, 2));
    process.exit(1);
  }

  try {
    const project = args.project;
    const workItemKey = args.key;

    // Resolve config from registry + env vars (provider only)
    const config = resolveWorkItemConfig(project);

    // Load the appropriate adapter (Clean Architecture: Port & Adapter)
    const adapterPath = join(process.cwd(), 'work-item', 'adapters', config.provider, 'get.ts');
    const { getWorkItem } = await import(adapterPath);

    // Get work item through adapter (implements port interface)
    // Adapter will read credentials from env vars using envPrefix
    const result = await getWorkItem({
      envPrefix: project,
      key: workItemKey,
      fields: args.fields
    });

    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(JSON.stringify({
      error: 'Failed to get work item',
      message: error instanceof Error ? error.message : String(error)
    }, null, 2));
    process.exit(1);
  }
}
