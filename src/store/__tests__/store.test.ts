import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';
import { loadCaseIndex, setSearchTerm, setCourtFilter } from '../casesSlice';
import { loadDocuments, setDocumentSearch } from '../documentsSlice';
import { toggleSidebar, setDocumentView } from '../uiSlice';
import { createAppStore, type AppStore } from '../createAppStore';
import type { AppServices } from '../../services/types';

const mockCaseIndex = {
  cases: [
    {
      id: 1,
      name: 'Test v. Example',
      nameShort: 'Test v. Example',
      court: 'test',
      filed: '2023-01-01',
      terminated: null,
      docCount: 5,
      availCount: 3,
    },
    {
      id: 2,
      name: 'Demo v. Sample',
      nameShort: 'Demo v. Sample',
      court: 'demo',
      filed: '2023-02-01',
      terminated: '2023-03-01',
      docCount: 2,
      availCount: 2,
    },
  ],
  courts: [
    { code: 'test', name: 'Test Court' },
    { code: 'demo', name: 'Demo Court' },
  ],
  dateRange: { min: '2023-01-01', max: '2023-02-01' },
};

const mockDocuments = [
  {
    id: 1,
    entryNumber: 1,
    documentNumber: '1',
    description: 'Initial Complaint',
    dateFiled: '2023-01-01',
    pageCount: 10,
    fileSize: 1024,
    filePath: '/test/1.pdf',
    sha1: 'abc123',
  },
  {
    id: 2,
    entryNumber: 2,
    documentNumber: '2',
    description: 'Motion to Dismiss',
    dateFiled: '2023-01-05',
    pageCount: 5,
    fileSize: 512,
    filePath: '/test/2.pdf',
    sha1: 'def456',
  },
];

describe('Redux Store', () => {
  let store: AppStore;
  let mockServices: AppServices;

  beforeEach(() => {
    mockServices = {
      dataService: {
        loadCaseIndex: vi.fn(() => Promise.resolve(mockCaseIndex)),
        loadCaseDocuments: vi.fn(() => Promise.resolve(mockDocuments)),
      },
      documentSearchService: {
        loadKeywords: vi.fn(() => Promise.resolve([])),
        searchByKeyword: vi.fn(() => Promise.resolve([])),
        searchByMultipleKeywords: vi.fn(() => Promise.resolve([])),
        resolveDocuments: vi.fn(() => Promise.resolve([])),
        clearCache: vi.fn(),
      },
    };

    store = createAppStore(mockServices);
  });

  describe('Cases Slice', () => {
    it('should load case index successfully', async () => {
      await store.dispatch(loadCaseIndex());
      const state = store.getState();

      expect(state.cases.loading).toBe(false);
      expect(state.cases.index?.cases).toHaveLength(2);
      expect(state.cases.filteredCases).toHaveLength(2);
      expect(mockServices.dataService.loadCaseIndex).toHaveBeenCalledOnce();
    });

    it('should filter cases by search term', async () => {
      await store.dispatch(loadCaseIndex());
      store.dispatch(setSearchTerm('Test'));

      const state = store.getState();
      expect(state.cases.filteredCases).toHaveLength(1);
      expect(state.cases.filteredCases[0].name).toBe('Test v. Example');
    });

    it('should filter cases by court', async () => {
      await store.dispatch(loadCaseIndex());
      store.dispatch(setCourtFilter('demo'));

      const state = store.getState();
      expect(state.cases.filteredCases).toHaveLength(1);
      expect(state.cases.filteredCases[0].court).toBe('demo');
    });
  });

  describe('Documents Slice', () => {
    it('should load documents successfully', async () => {
      await store.dispatch(loadDocuments(1));
      const state = store.getState();

      expect(state.documents.loading).toBe(false);
      expect(state.documents.documents[1]).toHaveLength(2);
      expect(state.documents.currentDocuments).toHaveLength(2);
      expect(mockServices.dataService.loadCaseDocuments).toHaveBeenCalledWith(1);
    });

    it('should filter documents by search term', async () => {
      await store.dispatch(loadDocuments(1));
      store.dispatch(setDocumentSearch('Complaint'));

      const state = store.getState();
      expect(state.documents.filteredDocuments).toHaveLength(1);
      expect(state.documents.filteredDocuments[0].description).toBe('Initial Complaint');
    });
  });

  describe('UI Slice', () => {
    it('should toggle sidebar', () => {
      const state1 = store.getState();
      expect(state1.ui.sidebarOpen).toBe(true);

      store.dispatch(toggleSidebar());
      const state2 = store.getState();
      expect(state2.ui.sidebarOpen).toBe(false);

      store.dispatch(toggleSidebar());
      const state3 = store.getState();
      expect(state3.ui.sidebarOpen).toBe(true);
    });

    it('should change document view', () => {
      const state1 = store.getState();
      expect(state1.ui.documentListView).toBe('list');

      store.dispatch(setDocumentView('grid'));
      const state2 = store.getState();
      expect(state2.ui.documentListView).toBe('grid');
    });
  });
});
