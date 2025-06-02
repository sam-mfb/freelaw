import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import type { DocumentSearchState } from '../documentSearchSlice';
import documentSearchReducer, {
  setSearchKeywords,
  addSearchKeyword,
  removeSearchKeyword,
  setSearchOperator,
  setSearchActive,
  selectDocument,
  setCurrentPage,
  setResultsPerPage,
  clearSearch,
  loadDocumentKeywords,
  searchDocuments,
  clearDocumentSearchCache,
  selectPaginatedResults,
  selectSearchState,
  selectKeywordSuggestions,
  selectSearchStats,
  selectSortedSearchResults,
  setSortBy,
  setSortOrder,
} from '../documentSearchSlice';
import type { Document } from '../../types/document.types';
import type { ThunkDispatch } from '@reduxjs/toolkit';
import type { AnyAction } from 'redux';
import type { ThunkExtra } from '../types';

// Helper to create valid mock documents
const createMockDocument = (overrides: Partial<Document> = {}): Document => ({
  id: 1,
  entryNumber: 1,
  documentNumber: '1',
  attachmentNumber: null,
  description: 'Test Document',
  dateFiled: '2023-01-01',
  pageCount: 10,
  fileSize: 1000,
  filePath: '/path/to/doc.pdf',
  sha1: 'abc123',
  caseId: 100877,
  caseName: 'Test Case',
  court: 'test-court',
  searchId: '100877-1-null',
  ...overrides,
});

// Mock services
const mockDocumentSearchService = {
  loadKeywords: vi.fn(),
  searchByKeyword: vi.fn(),
  searchByMultipleKeywords: vi.fn(),
  resolveDocuments: vi.fn(),
  clearCache: vi.fn(),
};

const mockDataService = {
  loadCaseIndex: vi.fn(),
  loadCaseDocuments: vi.fn(),
};

type TestState = {
  documentSearch: DocumentSearchState;
};

type TestDispatch = ThunkDispatch<TestState, ThunkExtra, AnyAction>;

type TestStore = ReturnType<typeof configureStore<TestState>> & {
  dispatch: TestDispatch;
};

const createTestStore = (): TestStore => {
  return configureStore({
    reducer: {
      documentSearch: documentSearchReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            services: {
              documentSearchService: mockDocumentSearchService,
              dataService: mockDataService,
            },
          } as ThunkExtra,
        },
      }),
  }) as TestStore;
};

describe('documentSearchSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('synchronous actions', () => {
    it('sets search keywords', () => {
      const store = createTestStore();

      store.dispatch(setSearchKeywords(['motion', 'summary']));

      const state = store.getState().documentSearch;
      expect(state.currentKeywords).toEqual(['motion', 'summary']);
      expect(state.currentPage).toBe(1);
    });

    it('adds search keyword without duplicates', () => {
      const store = createTestStore();

      store.dispatch(addSearchKeyword('motion'));
      store.dispatch(addSearchKeyword('summary'));
      store.dispatch(addSearchKeyword('motion')); // Duplicate should be ignored

      const state = store.getState().documentSearch;
      expect(state.currentKeywords).toEqual(['motion', 'summary']);
    });

    it('removes search keyword', () => {
      const store = createTestStore();

      store.dispatch(setSearchKeywords(['motion', 'summary', 'judgment']));
      store.dispatch(removeSearchKeyword('summary'));

      const state = store.getState().documentSearch;
      expect(state.currentKeywords).toEqual(['motion', 'judgment']);
      expect(state.currentPage).toBe(1);
    });

    it('sets search operator', () => {
      const store = createTestStore();

      expect(store.getState().documentSearch.searchOperator).toBe('OR');

      store.dispatch(setSearchOperator('AND'));
      expect(store.getState().documentSearch.searchOperator).toBe('AND');
      expect(store.getState().documentSearch.currentPage).toBe(1);
    });

    it('toggles search active state and clears data when deactivated', () => {
      const store = createTestStore();

      // Set up some search state
      store.dispatch(setSearchKeywords(['motion']));
      store.dispatch(selectDocument('100877-1-0'));

      // Activate search
      store.dispatch(setSearchActive(true));
      expect(store.getState().documentSearch.isSearchActive).toBe(true);

      // Deactivate search - should clear state
      store.dispatch(setSearchActive(false));
      const state = store.getState().documentSearch;
      expect(state.isSearchActive).toBe(false);
      expect(state.currentKeywords).toEqual([]);
      expect(state.searchResults).toEqual([]);
      expect(state.selectedDocumentId).toBe(null);
    });

    it('selects document', () => {
      const store = createTestStore();

      store.dispatch(selectDocument('100877-1-0'));
      expect(store.getState().documentSearch.selectedDocumentId).toBe('100877-1-0');

      store.dispatch(selectDocument(null));
      expect(store.getState().documentSearch.selectedDocumentId).toBe(null);
    });

    it('sets current page', () => {
      const store = createTestStore();

      store.dispatch(setCurrentPage(3));
      expect(store.getState().documentSearch.currentPage).toBe(3);
    });

    it('sets results per page and resets to first page', () => {
      const store = createTestStore();

      store.dispatch(setCurrentPage(3));
      store.dispatch(setResultsPerPage(50));

      const state = store.getState().documentSearch;
      expect(state.resultsPerPage).toBe(50);
      expect(state.currentPage).toBe(1);
    });

    it('clears search', () => {
      const store = createTestStore();

      // Set up state
      store.dispatch(setSearchKeywords(['motion', 'summary']));
      store.dispatch(selectDocument('100877-1-0'));
      store.dispatch(setCurrentPage(2));

      // Clear search
      store.dispatch(clearSearch());

      const state = store.getState().documentSearch;
      expect(state.currentKeywords).toEqual([]);
      expect(state.searchResults).toEqual([]);
      expect(state.selectedDocumentId).toBe(null);
      expect(state.currentPage).toBe(1);
      expect(state.searchError).toBe(null);
      expect(state.sortBy).toBe('relevance');
      expect(state.sortOrder).toBe('desc');
    });

    it('sets sort by and resets to first page', () => {
      const store = createTestStore();

      store.dispatch(setCurrentPage(3));
      store.dispatch(setSortBy('pageCount'));

      const state = store.getState().documentSearch;
      expect(state.sortBy).toBe('pageCount');
      expect(state.currentPage).toBe(1);
    });

    it('sets sort order and resets to first page', () => {
      const store = createTestStore();

      store.dispatch(setCurrentPage(3));
      store.dispatch(setSortOrder('asc'));

      const state = store.getState().documentSearch;
      expect(state.sortOrder).toBe('asc');
      expect(state.currentPage).toBe(1);
    });
  });

  describe('async thunks', () => {
    it('handles keyword loading', async () => {
      const store = createTestStore();
      const mockKeywords = ['motion', 'deposition', 'order'];

      mockDocumentSearchService.loadKeywords.mockResolvedValueOnce(mockKeywords);

      const result = await store.dispatch(loadDocumentKeywords());
      expect(result.type).toBe('documentSearch/loadKeywords/fulfilled');

      const state = store.getState().documentSearch;
      expect(state.availableKeywords).toEqual(mockKeywords);
      expect(state.keywordsLoading).toBe(false);
      expect(state.keywordsError).toBe(null);
    });

    it('handles keyword loading error', async () => {
      const store = createTestStore();

      mockDocumentSearchService.loadKeywords.mockRejectedValueOnce(new Error('Network error'));

      const result = await store.dispatch(loadDocumentKeywords());
      expect(result.type).toBe('documentSearch/loadKeywords/rejected');

      const state = store.getState().documentSearch;
      expect(state.availableKeywords).toEqual([]);
      expect(state.keywordsLoading).toBe(false);
      expect(state.keywordsError).toBe('Network error');
    });

    it('handles document search', async () => {
      const store = createTestStore();
      const mockDocuments: Document[] = [
        createMockDocument({
          id: 1,
          searchId: '100877-1-0',
          caseId: 100877,
          documentNumber: '1',
          attachmentNumber: 0,
          description: 'Motion for Summary Judgment',
          caseName: 'Test Case',
          court: 'cacd',
        }),
      ];

      mockDocumentSearchService.searchByMultipleKeywords.mockResolvedValueOnce(['100877-1-0']);

      mockDocumentSearchService.resolveDocuments.mockResolvedValueOnce(mockDocuments);

      const result = await store.dispatch(
        searchDocuments({
          keywords: ['motion', 'summary'],
          operator: 'AND',
        }),
      );
      expect(result.type).toBe('documentSearch/search/fulfilled');

      const state = store.getState().documentSearch;
      expect(state.searchResults).toEqual(mockDocuments);
      expect(state.totalResults).toBe(1);
      expect(state.searchLoading).toBe(false);
      expect(state.lastSearchTime).toBeDefined();
    });

    it('returns empty results for empty keywords', async () => {
      const store = createTestStore();

      const result = await store.dispatch(
        searchDocuments({
          keywords: [],
          operator: 'OR',
        }),
      );
      expect(result.type).toBe('documentSearch/search/fulfilled');

      const state = store.getState().documentSearch;
      expect(state.searchResults).toEqual([]);
      expect(state.totalResults).toBe(0);
      expect(mockDocumentSearchService.searchByMultipleKeywords).not.toHaveBeenCalled();
    });

    it('handles search error', async () => {
      const store = createTestStore();

      mockDocumentSearchService.searchByMultipleKeywords.mockRejectedValueOnce(
        new Error('Search failed'),
      );

      const result = await store.dispatch(
        searchDocuments({
          keywords: ['motion'],
          operator: 'OR',
        }),
      );
      expect(result.type).toBe('documentSearch/search/rejected');

      const state = store.getState().documentSearch;
      expect(state.searchResults).toEqual([]);
      expect(state.searchLoading).toBe(false);
      expect(state.searchError).toBe('Search failed');
    });

    it('clears cache', async () => {
      const store = createTestStore();

      const result = await store.dispatch(clearDocumentSearchCache());
      expect(result.type).toBe('documentSearch/clearCache/fulfilled');

      expect(mockDocumentSearchService.clearCache).toHaveBeenCalled();
      expect(store.getState().documentSearch.cacheSize).toBe(0);
    });
  });

  describe('selectors', () => {
    const mockState = {
      cases: {
        index: null,
        filteredCases: [],
        selectedCaseId: null,
        searchTerm: '',
        filters: {
          court: null,
          dateFrom: null,
          dateTo: null,
          onlyActive: false,
        },
        loading: false,
        error: null,
      },
      documents: {
        documents: {},
        currentDocuments: [],
        filteredDocuments: [],
        searchTerm: '',
        loading: false,
        error: null,
      },
      ui: {
        sidebarOpen: true,
        documentListView: 'list' as const,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
        casesPerPage: 25,
        currentPage: 1,
      },
      documentSearch: {
        availableKeywords: ['motion', 'deposition', 'order', 'summary'],
        keywordsLoading: false,
        keywordsError: null,
        currentKeywords: ['motion', 'summary'],
        searchOperator: 'AND' as const,
        searchResults: Array.from({ length: 25 }, (_, i) => 
          createMockDocument({
            id: i + 1,
            searchId: `${i + 1}-1-0`,
            caseId: i + 1,
            documentNumber: '1',
            attachmentNumber: 0,
            description: `Document ${i + 1}`,
            caseName: `Case ${i + 1}`,
            court: 'cacd',
          })
        ),
        searchLoading: false,
        searchError: null,
        isSearchActive: true,
        selectedDocumentId: '5-1-0',
        resultsPerPage: 10,
        currentPage: 2,
        totalResults: 25,
        sortBy: 'relevance' as const,
        sortOrder: 'desc' as const,
        lastSearchTime: Date.now(),
        cacheSize: 3,
      },
    };

    it('selects paginated results correctly', () => {
      const result = selectPaginatedResults(mockState);

      expect(result.results).toHaveLength(10);
      expect(result.results[0].searchId).toBe('11-1-0'); // First item on page 2
      expect(result.totalResults).toBe(25);
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('handles last page pagination', () => {
      const lastPageState = {
        ...mockState,
        documentSearch: {
          ...mockState.documentSearch,
          currentPage: 3,
        },
      };

      const result = selectPaginatedResults(lastPageState);

      expect(result.results).toHaveLength(5); // 25 total, 20 on first two pages
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('selects search state', () => {
      const result = selectSearchState(mockState);

      expect(result.loading).toBe(false);
      expect(result.error).toBe(null);
      expect(result.hasResults).toBe(true);
      expect(result.isEmpty).toBe(false);
    });

    it('identifies empty search state', () => {
      const emptyState = {
        ...mockState,
        documentSearch: {
          ...mockState.documentSearch,
          currentKeywords: [],
        },
      };

      const result = selectSearchState(emptyState);
      expect(result.isEmpty).toBe(true);
    });

    it('selects keyword suggestions', () => {
      const result = selectKeywordSuggestions(mockState);

      expect(result).toEqual(['deposition', 'order']);
    });

    it('selects search stats', () => {
      const result = selectSearchStats(mockState);

      expect(result.keywordsLoaded).toBe(4);
      expect(result.activeKeywords).toBe(2);
      expect(result.resultsFound).toBe(25);
      expect(result.cacheSize).toBe(3);
      expect(result.lastSearch).toBeInstanceOf(Date);
    });

    describe('selectSortedSearchResults', () => {
      it('sorts by relevance (original order) in descending order', () => {
        const state = {
          ...mockState,
          documentSearch: {
            ...mockState.documentSearch,
            sortBy: 'relevance' as const,
            sortOrder: 'desc' as const,
            searchResults: [
              createMockDocument({ id: 1, searchId: '1-1-0' }),
              createMockDocument({ id: 2, searchId: '2-1-0' }),
              createMockDocument({ id: 3, searchId: '3-1-0' }),
            ],
          },
        };

        const result = selectSortedSearchResults(state);
        expect(result.map(d => d.id)).toEqual([1, 2, 3]);
      });

      it('sorts by relevance (original order) in ascending order (reverses)', () => {
        const state = {
          ...mockState,
          documentSearch: {
            ...mockState.documentSearch,
            sortBy: 'relevance' as const,
            sortOrder: 'asc' as const,
            searchResults: [
              createMockDocument({ id: 1, searchId: '1-1-0' }),
              createMockDocument({ id: 2, searchId: '2-1-0' }),
              createMockDocument({ id: 3, searchId: '3-1-0' }),
            ],
          },
        };

        const result = selectSortedSearchResults(state);
        expect(result.map(d => d.id)).toEqual([3, 2, 1]);
      });

      it('sorts by page count ascending with null values at end', () => {
        const state = {
          ...mockState,
          documentSearch: {
            ...mockState.documentSearch,
            sortBy: 'pageCount' as const,
            sortOrder: 'asc' as const,
            searchResults: [
              createMockDocument({ id: 1, pageCount: 20 }),
              createMockDocument({ id: 2, pageCount: null }),
              createMockDocument({ id: 3, pageCount: 10 }),
              createMockDocument({ id: 4, pageCount: 5 }),
              createMockDocument({ id: 5, pageCount: null }),
            ],
          },
        };

        const result = selectSortedSearchResults(state);
        expect(result.map(d => d.id)).toEqual([4, 3, 1, 2, 5]);
      });

      it('sorts by page count descending with null values at end', () => {
        const state = {
          ...mockState,
          documentSearch: {
            ...mockState.documentSearch,
            sortBy: 'pageCount' as const,
            sortOrder: 'desc' as const,
            searchResults: [
              createMockDocument({ id: 1, pageCount: 20 }),
              createMockDocument({ id: 2, pageCount: null }),
              createMockDocument({ id: 3, pageCount: 10 }),
              createMockDocument({ id: 4, pageCount: 5 }),
            ],
          },
        };

        const result = selectSortedSearchResults(state);
        expect(result.map(d => d.id)).toEqual([1, 3, 4, 2]);
      });

      it('sorts by date filed ascending', () => {
        const state = {
          ...mockState,
          documentSearch: {
            ...mockState.documentSearch,
            sortBy: 'dateFiled' as const,
            sortOrder: 'asc' as const,
            searchResults: [
              createMockDocument({ id: 1, dateFiled: '2023-03-15' }),
              createMockDocument({ id: 2, dateFiled: '2023-01-01' }),
              createMockDocument({ id: 3, dateFiled: '2023-06-30' }),
            ],
          },
        };

        const result = selectSortedSearchResults(state);
        expect(result.map(d => d.id)).toEqual([2, 1, 3]);
      });

      it('sorts by file size with null values at end', () => {
        const state = {
          ...mockState,
          documentSearch: {
            ...mockState.documentSearch,
            sortBy: 'fileSize' as const,
            sortOrder: 'asc' as const,
            searchResults: [
              createMockDocument({ id: 1, fileSize: 5000 }),
              createMockDocument({ id: 2, fileSize: null }),
              createMockDocument({ id: 3, fileSize: 1000 }),
              createMockDocument({ id: 4, fileSize: 3000 }),
            ],
          },
        };

        const result = selectSortedSearchResults(state);
        expect(result.map(d => d.id)).toEqual([3, 4, 1, 2]);
      });

      it('sorts by description alphabetically', () => {
        const state = {
          ...mockState,
          documentSearch: {
            ...mockState.documentSearch,
            sortBy: 'description' as const,
            sortOrder: 'asc' as const,
            searchResults: [
              createMockDocument({ id: 1, description: 'Motion to Dismiss' }),
              createMockDocument({ id: 2, description: 'Answer' }),
              createMockDocument({ id: 3, description: 'Complaint' }),
            ],
          },
        };

        const result = selectSortedSearchResults(state);
        expect(result.map(d => d.id)).toEqual([2, 3, 1]);
      });

      it('returns empty array when no search results', () => {
        const state = {
          ...mockState,
          documentSearch: {
            ...mockState.documentSearch,
            searchResults: [],
          },
        };

        const result = selectSortedSearchResults(state);
        expect(result).toEqual([]);
      });
    });
  });
});
