import type {
  DocumentSearchKeywords,
  DocumentSearchResult,
  SearchableDocument,
} from '../types/document.types';
import { dataService } from './dataService';
import type { Document } from '../types/document.types';

export interface DocumentSearchService {
  loadKeywords(): Promise<string[]>;
  searchByKeyword(keyword: string): Promise<string[]>;
  searchByMultipleKeywords(keywords: string[], operator: 'AND' | 'OR'): Promise<string[]>;
  resolveDocuments(documentIds: string[]): Promise<Document[]>;
  clearCache(): void;
}

interface DocumentSearchState {
  keywordsCache: string[] | null;
  keywordFilesCache: Map<string, string[]>;
  documentsCache: Map<string, Document>;
}

function createDocumentSearchState(): DocumentSearchState {
  return {
    keywordsCache: null,
    keywordFilesCache: new Map<string, string[]>(),
    documentsCache: new Map<string, SearchableDocument>(),
  };
}

function parseDocumentId(documentId: string): {
  caseId: number;
  documentNumber: string;
  attachmentNumber: number | null;
} {
  const parts = documentId.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid document ID format: ${documentId}`);
  }

  const caseId = parseInt(parts[0], 10);
  const documentNumber = parts[1];
  const attachmentNumber = parts[2] === 'null' ? null : parseInt(parts[2], 10);

  if (isNaN(caseId)) {
    throw new Error(`Invalid case ID in document ID: ${documentId}`);
  }

  if (attachmentNumber !== null && isNaN(attachmentNumber)) {
    throw new Error(`Invalid attachment number in document ID: ${documentId}`);
  }

  return { caseId, documentNumber, attachmentNumber };
}

async function fetchDocumentsByIds(documentIds: string[]): Promise<Document[]> {
  // Group document IDs by case ID for efficient loading
  const caseGroups = new Map<number, string[]>();

  for (const id of documentIds) {
    const { caseId } = parseDocumentId(id);
    if (!caseGroups.has(caseId)) {
      caseGroups.set(caseId, []);
    }
    caseGroups.get(caseId)!.push(id);
  }

  const results: Document[] = [];

  // Load documents by case
  for (const [caseId, docIds] of caseGroups.entries()) {
    const caseDocuments = await dataService.loadCaseDocuments(caseId);

    for (const docId of docIds) {
      // Find the matching document by searchId
      const doc = caseDocuments.find((d) => d.searchId === docId);

      if (doc) {
        results.push(doc);
      }
    }
  }

  return results;
}

export function createDocumentSearchService(): DocumentSearchService {
  const state = createDocumentSearchState();

  const loadKeywords = async (): Promise<string[]> => {
    if (state.keywordsCache) return state.keywordsCache;

    const response = await fetch('/data/document-search/keywords.json');
    if (!response.ok) {
      throw new Error(`Failed to load keywords: ${response.statusText}`);
    }

    const data = (await response.json()) as DocumentSearchKeywords;
    state.keywordsCache = data.keywords;
    return data.keywords;
  };

  const searchByKeyword = async (keyword: string): Promise<string[]> => {
    if (state.keywordFilesCache.has(keyword)) {
      return state.keywordFilesCache.get(keyword)!;
    }

    const response = await fetch(`/data/document-search/keywords/${keyword}.json`);
    if (!response.ok) {
      if (response.status === 404) {
        state.keywordFilesCache.set(keyword, []);
        return [];
      }
      throw new Error(`Failed to load keyword '${keyword}': ${response.statusText}`);
    }

    const data = (await response.json()) as DocumentSearchResult;
    state.keywordFilesCache.set(keyword, data.documentIds);
    return data.documentIds;
  };

  const searchByMultipleKeywords = async (
    keywords: string[],
    operator: 'AND' | 'OR' = 'OR',
  ): Promise<string[]> => {
    if (keywords.length === 0) return [];
    if (keywords.length === 1) return searchByKeyword(keywords[0]);

    const results = await Promise.all(keywords.map((keyword) => searchByKeyword(keyword)));

    if (operator === 'AND') {
      // Intersection: documents that appear in ALL keyword results
      return results.reduce((intersection, currentSet) =>
        intersection.filter((id) => currentSet.includes(id)),
      );
    } else {
      // Union: documents that appear in ANY keyword result
      const unionSet = new Set<string>();
      results.forEach((result) => result.forEach((id) => unionSet.add(id)));
      return Array.from(unionSet);
    }
  };

  const resolveDocuments = async (documentIds: string[]): Promise<Document[]> => {
    const resolved: Document[] = [];
    const toFetch: string[] = [];

    // Check cache for already resolved documents
    for (const id of documentIds) {
      if (state.documentsCache.has(id)) {
        resolved.push(state.documentsCache.get(id)!);
      } else {
        toFetch.push(id);
      }
    }

    // Fetch missing documents
    if (toFetch.length > 0) {
      const newlyResolved = await fetchDocumentsByIds(toFetch);
      for (const doc of newlyResolved) {
        state.documentsCache.set(doc.searchId, doc);
        resolved.push(doc);
      }
    }

    return resolved;
  };

  const clearCache = (): void => {
    state.keywordsCache = null;
    state.keywordFilesCache.clear();
    state.documentsCache.clear();
  };

  return {
    loadKeywords,
    searchByKeyword,
    searchByMultipleKeywords,
    resolveDocuments,
    clearCache,
  };
}

// Default instance for convenience
export const documentSearchService = createDocumentSearchService();
