import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// CLI usage
if (import.meta.main) {
  const PROJECTS_DIR = join(process.cwd(), 'project-registry', 'data');
  const fullMode = process.argv.includes('--full');

  try {
    if (!existsSync(PROJECTS_DIR)) {
      console.log(JSON.stringify({ projects: [] }));
      process.exit(0);
    }

    const files = readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.json'));

    if (fullMode) {
      const projects = files.map(file => {
        const content = readFileSync(join(PROJECTS_DIR, file), 'utf8');
        return JSON.parse(content);
      });
      console.log(JSON.stringify({ projects }));
    } else {
      const names = files.map(file => file.replace('.json', ''));
      console.log(JSON.stringify({ projects: names }));
    }
  } catch (error) {
    console.error(JSON.stringify({
      error: 'Failed to list projects',
      message: error instanceof Error ? error.message : String(error)
    }));
    process.exit(1);
  }
}
