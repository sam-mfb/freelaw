import { createAppStore } from './createAppStore';
import { dataService } from '../services/dataService';
import type { AppServices } from '../services/types';

// Mock documentSearchService until the real implementation is ready
const mockDocumentSearchService = {
  loadKeywords: async () => [],
  searchByKeyword: async () => [],
  searchByMultipleKeywords: async () => [],
  resolveDocuments: async () => [],
  clearCache: () => {},
};

const services: AppServices = {
  dataService,
  documentSearchService: mockDocumentSearchService,
};

export const store = createAppStore(services);
