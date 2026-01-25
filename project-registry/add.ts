import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Project {
  name: string;
  path: string;
  [key: string]: string;
}

interface AddResult {
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

// Add project to registry
function addProject(args: Record<string, string>): AddResult {
  const { name, path, ...customProps } = args;

  if (!name || !path) {
    throw new Error('Missing required arguments: name and path are required');
  }

  // Prepare project data
  const project: Project = { name, path, ...customProps };

  // Ensure directory exists
  const projectsDir = join(process.cwd(), 'project-registry', 'data');
  if (!existsSync(projectsDir)) {
    mkdirSync(projectsDir, { recursive: true });
  }

  // Write project file
  const projectFile = join(projectsDir, `${name}.json`);
  writeFileSync(projectFile, JSON.stringify(project, null, 2));

  return { success: true, project, file: projectFile };
}

// CLI usage
if (import.meta.main) {
  const args = parseArgs();

  if (!args.name || !args.path) {
    console.error(JSON.stringify({
      error: 'Missing required arguments',
      required: [
        { propertyName: 'name', description: "Project identifier (e.g., 'DGD', 'my-app')" },
        { propertyName: 'path', description: "Relative path from yaaf/ (e.g., '../DGD', 'Projects/myapp')" }
      ],
      missing: [
        ...(!args.name ? [{ propertyName: 'name', description: "Project identifier" }] : []),
        ...(!args.path ? [{ propertyName: 'path', description: "Relative path" }] : [])
      ]
    }, null, 2));
    process.exit(1);
  }

  try {
    const result = addProject(args);
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(JSON.stringify({
      error: 'Failed to add project',
      message: error instanceof Error ? error.message : String(error)
    }));
    process.exit(1);
  }
}
