import type { Case } from '../types/case.types';
import type { Document } from '../types/document.types';
import type { CaseIndex, RawCaseData } from '../types/index.types';
import { isCaseIndex, isDocumentArray, isRawCaseData, safeJsonParse } from '../types/guards';

// Helper functions
function transformToCase(data: RawCaseData): Case {
  return {
    id: data.id,
    caseName: data.case_name || '',
    caseNameShort: data.case_name_short || data.case_name || '',
    caseNameFull: data.case_name_full || data.case_name || '',
    court: data.court || '',
    docketNumber: data.docket_number || '',
    dateFiled: data.date_filed || '',
    dateTerminated: data.date_terminated || null,
    assignedTo: data.assigned_to_str || 'Unknown',
    documentCount: data.docket_entries?.length || 0,
    availableDocumentCount: countAvailableDocuments(data),
  };
}

function countAvailableDocuments(data: RawCaseData): number {
  let count = 0;
  for (const entry of data.docket_entries || []) {
    for (const doc of entry.recap_documents || []) {
      if (doc.is_available && doc.filepath_local) {
        count++;
      }
    }
  }
  return count;
}

// Factory function to create data service instances
export function createDataService() {
  let localCaseIndex: CaseIndex | null = null;
  const localDocumentCache = new Map<number, Document[]>();

  return {
    async loadCaseIndex(): Promise<CaseIndex> {
      if (localCaseIndex) return localCaseIndex;

      const response = await fetch('/data/case-index.json');
      if (!response.ok) {
        throw new Error(`Failed to load case index: ${response.statusText}`);
      }

      const data = await safeJsonParse(response);
      if (!isCaseIndex(data)) {
        throw new Error('Invalid case index format received from server');
      }

      localCaseIndex = data;
      return localCaseIndex;
    },

    async loadCaseDocuments(caseId: number): Promise<Document[]> {
      if (localDocumentCache.has(caseId)) {
        return localDocumentCache.get(caseId)!;
      }

      const response = await fetch(`/data/documents/${caseId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load documents for case ${caseId}`);
      }

      const data = await safeJsonParse(response);
      if (!isDocumentArray(data)) {
        throw new Error(`Invalid documents format received for case ${caseId}`);
      }

      localDocumentCache.set(caseId, data);
      return data;
    },

    async loadFullCase(caseId: number): Promise<Case> {
      const response = await fetch(`/data/docket-data/${caseId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load case ${caseId}`);
      }

      const data = await safeJsonParse(response);
      if (!isRawCaseData(data)) {
        throw new Error(`Invalid case data format received for case ${caseId}`);
      }

      return transformToCase(data);
    },

    clearCache(): void {
      localCaseIndex = null;
      localDocumentCache.clear();
    },
  };
}

// Default instance for convenience
export const dataService = createDataService();

// Re-export types for convenience
export type { Case, CaseIndex, Document };
