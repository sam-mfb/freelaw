import type { CaseIndex } from '../types/index.types';
import type { Document } from '../types/document.types';

export interface AppServices {
  dataService: {
    loadCaseIndex: () => Promise<CaseIndex>;
    loadCaseDocuments: (caseId: number) => Promise<Document[]>;
  };
  documentSearchService: {
    loadKeywords: () => Promise<string[]>;
    searchByKeyword: (keyword: string) => Promise<string[]>;
    searchByMultipleKeywords: (keywords: string[], operator: 'AND' | 'OR') => Promise<string[]>;
    resolveDocuments: (documentIds: string[]) => Promise<Document[]>;
    clearCache: () => void;
  };
}
