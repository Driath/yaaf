import { execSync } from 'child_process';

/**
 * Work-item configuration resolved from project registry + environment variables
 *
 * Note: This only resolves provider, projectKey, and status.
 * All other config (site, email, token, etc.) is read by adapters from env vars using envPrefix.
 */
export interface WorkItemConfig {
  provider: string;
  projectKey?: string;
  status?: string;
}

/**
 * Project structure from registry
 */
interface Project {
  name: string;
  path: string;
  [key: string]: string;
}

/**
 * Resolve work-item configuration from project registry and environment variables
 *
 * Resolution order:
 * 1. Project registry (non-sensitive config)
 * 2. Environment variables (fallback)
 *
 * Note: Adapters will read credentials and other config from env vars using envPrefix.
 *
 * @param projectName - Name of the project to resolve config for
 * @returns Resolved work-item configuration (provider, projectKey, status)
 * @throws Error if provider not configured in either registry or env vars
 */
export function resolveWorkItemConfig(projectName: string): WorkItemConfig {
  const envPrefix = projectName;

  // Try to load project from registry
  let project: Project | null = null;
  try {
    const result = execSync(`bun project-registry/get.ts project=${projectName}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    project = JSON.parse(result);
  } catch (error) {
    // Project not in registry, will fallback to env vars
    project = null;
  }

  // Helper to get config value: registry first, then env var
  const getConfig = (registryKey: string, envKey: string): string | undefined => {
    // First try registry
    if (project && project[registryKey]) {
      return project[registryKey];
    }
    // Fallback to environment variable
    return process.env[`${envPrefix}_WORK_ITEM_${envKey}`];
  };

  // Resolve provider (required)
  const provider = getConfig('workItemProvider', 'PROVIDER');

  if (!provider) {
    throw new Error(
      `Provider not configured. Set either:\n` +
      `  1. Registry: /project:add name=${projectName} workItemProvider=jira\n` +
      `  2. Env var: ${envPrefix}_WORK_ITEM_PROVIDER=jira`
    );
  }

  // Build minimal config object
  const config: WorkItemConfig = {
    provider: provider.toLowerCase(),
    projectKey: getConfig('workItemProjectKey', 'PROJECT_KEY'),
    status: getConfig('workItemStatus', 'STATUS'),
  };

  return config;
}
