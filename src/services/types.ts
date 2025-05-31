import type { CaseIndex } from '../types/index.types';
import type { Document } from '../types/document.types';

export interface AppServices {
  dataService: {
    loadCaseIndex: () => Promise<CaseIndex>;
    loadCaseDocuments: (caseId: number) => Promise<Document[]>;
  };
}
