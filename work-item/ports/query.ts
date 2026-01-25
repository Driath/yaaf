/**
 * Port: Work Item Query Interface
 * Defines the contract for querying work items from any provider
 */

export interface WorkItem {
  key: string;
  title: string;
  priority?: string;
  status: string;
}

export interface QueryConfig {
  envPrefix: string;
  jql: string;
  fields?: string;
}

export interface QueryResult {
  workItems: WorkItem[];
}

/**
 * Query work items from a provider
 */
export type QueryWorkItems = (config: QueryConfig) => Promise<QueryResult>;
