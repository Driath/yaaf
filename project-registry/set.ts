import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Project {
  name: string;
  path: string;
  [key: string]: string;
}

interface SetResult {
  success: boolean;
  project: Project;
  file: string;
}

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

// Set project property
function setProjectProperty(projectName: string, property: string, value: string): SetResult {
  const PROJECTS_DIR = join(process.cwd(), 'project-registry', 'data');
  const projectFile = join(PROJECTS_DIR, `${projectName}.json`);

  if (!existsSync(projectFile)) {
    throw new Error(`Project '${projectName}' not found`);
  }

  const config: Project = JSON.parse(readFileSync(projectFile, 'utf8'));

  if (value === "") {
    delete config[property];
  } else {
    config[property] = value;
  }

  writeFileSync(projectFile, JSON.stringify(config, null, 2));

  return { success: true, project: config, file: projectFile };
}

// CLI usage
if (import.meta.main) {
  const args = parseArgs();

  if (!args.project || !args.property || args.value === undefined) {
    console.error(JSON.stringify({
      error: 'Missing required arguments',
      required: [
        { propertyName: 'project', description: 'Project name' },
        { propertyName: 'property', description: 'Property name to set' },
        { propertyName: 'value', description: 'Property value (empty string to remove)' }
      ],
      missing: [
        ...(!args.project ? [{ propertyName: 'project', description: 'Project name' }] : []),
        ...(!args.property ? [{ propertyName: 'property', description: 'Property name' }] : []),
        ...(args.value === undefined ? [{ propertyName: 'value', description: 'Property value' }] : [])
      ]
    }, null, 2));
    process.exit(1);
  }

  try {
    const result = setProjectProperty(args.project, args.property, args.value);
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(JSON.stringify({
      error: 'Failed to set project property',
      message: error instanceof Error ? error.message : String(error)
    }));
    process.exit(1);
  }
}
