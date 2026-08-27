export interface AccountDataExport {
  format: 'drama-watch-account-export';
  version: 1;
  exportedAt: string;
  account: Record<string, unknown>;
  settings: Record<string, unknown>;
  categories: unknown[];
  priorityLanes: unknown[];
  library: unknown[];
}
