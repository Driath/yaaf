import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

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
    const ARCHITECTURE_DIR = join(process.cwd(), 'architecture', 'data');
    const architectureFile = join(ARCHITECTURE_DIR, `${project}.md`);

    if (!existsSync(architectureFile)) {
      console.error(JSON.stringify({
        error: 'Architecture not found',
        message: `Architecture file for project '${project}' not found at ${architectureFile}`,
        suggestion: `Create architecture/data/${project}.md with project architecture documentation`
      }, null, 2));
      process.exit(1);
    }

    const content = readFileSync(architectureFile, 'utf8');

    console.log(JSON.stringify({
      success: true,
      project,
      file: architectureFile,
      content
    }));
  } catch (error) {
    console.error(JSON.stringify({
      error: 'Failed to get architecture',
      message: error instanceof Error ? error.message : String(error)
    }, null, 2));
    process.exit(1);
  }
}
