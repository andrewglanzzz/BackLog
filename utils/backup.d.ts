export interface BacklogImportResult {
  importedCount: number;
  newCount: number;
  updatedCount: number;
  entries: Array<{ url: string; [key: string]: unknown }>;
}

export function importBacklogFile(file: File): Promise<BacklogImportResult>;
