import { Case, CaseSummary } from '../types/case.types';
import { Document } from '../types/document.types';
import { Court } from '../types/court.types';
import { CaseIndex, RawCaseData } from '../types/index.types';

// Re-export types for convenience
export type { Case, CaseSummary, Document, Court, CaseIndex };

// Cache storage
let caseIndex: CaseIndex | null = null;
const documentCache = new Map<number, Document[]>();

/**
 * Load the case index. Caches result for subsequent calls.
 */
export async function loadCaseIndex(): Promise<CaseIndex> {
  if (caseIndex) return caseIndex;

  const response = await fetch("/data/case-index.json");
  if (!response.ok) {
    throw new Error(`Failed to load case index: ${response.statusText}`);
  }

  caseIndex = await response.json();
  return caseIndex!;
}

/**
 * Load documents for a specific case. Caches results.
 */
export async function loadCaseDocuments(caseId: number): Promise<Document[]> {
  if (documentCache.has(caseId)) {
    return documentCache.get(caseId)!;
  }

  const response = await fetch(`/data/documents/${caseId}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load documents for case ${caseId}`);
  }

  const documents = await response.json();
  documentCache.set(caseId, documents);
  return documents;
}

/**
 * Load full case details from original JSON (optional method)
 */
export async function loadFullCase(caseId: number): Promise<Case> {
  const response = await fetch(`/data/docket-data/${caseId}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load case ${caseId}`);
  }

  const data = await response.json();
  return transformToCase(data);
}

/**
 * Clear all caches
 */
export function clearCache(): void {
  caseIndex = null;
  documentCache.clear();
}

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
    assignedTo: data.assigned_to_str || "Unknown",
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

// Export factory function to create isolated instances if needed
export function createDataService() {
  let localCaseIndex: CaseIndex | null = null;
  const localDocumentCache = new Map<number, Document[]>();

  return {
    async loadCaseIndex(): Promise<CaseIndex> {
      if (localCaseIndex) return localCaseIndex;

      const response = await fetch("/data/case-index.json");
      if (!response.ok) {
        throw new Error(`Failed to load case index: ${response.statusText}`);
      }

      localCaseIndex = await response.json();
      return localCaseIndex!;
    },

    async loadCaseDocuments(caseId: number): Promise<Document[]> {
      if (localDocumentCache.has(caseId)) {
        return localDocumentCache.get(caseId)!;
      }

      const response = await fetch(`/data/documents/${caseId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load documents for case ${caseId}`);
      }

      const documents = await response.json();
      localDocumentCache.set(caseId, documents);
      return documents;
    },

    async loadFullCase(caseId: number): Promise<Case> {
      const response = await fetch(`/data/docket-data/${caseId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load case ${caseId}`);
      }

      const data = await response.json();
      return transformToCase(data);
    },

    clearCache(): void {
      localCaseIndex = null;
      localDocumentCache.clear();
    },
  };
}