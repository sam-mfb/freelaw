import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { Document } from '../types/document.types';
import type { ThunkExtra } from './types';
import type { RootState } from './createAppStore';

export type SortBy = 'relevance' | 'pageCount' | 'dateFiled' | 'fileSize' | 'description';
export type SortOrder = 'asc' | 'desc';

export interface DocumentSearchState {
  // Keywords state
  availableKeywords: string[];
  keywordsLoading: boolean;
  keywordsError: string | null;

  // Search configuration
  currentKeywords: string[];
  searchOperator: 'AND' | 'OR';

  // Search results
  searchResults: Document[];
  searchLoading: boolean;
  searchError: string | null;

  // UI state
  isSearchActive: boolean;
  selectedDocumentId: string | null;

  // Pagination
  resultsPerPage: number;
  currentPage: number;
  totalResults: number;

  // Sorting
  sortBy: SortBy;
  sortOrder: SortOrder;

  // Cache metadata
  lastSearchTime: number | null;
  cacheSize: number;
}

const initialState: DocumentSearchState = {
  availableKeywords: [],
  keywordsLoading: false,
  keywordsError: null,

  currentKeywords: [],
  searchOperator: 'OR',

  searchResults: [],
  searchLoading: false,
  searchError: null,

  isSearchActive: false,
  selectedDocumentId: null,

  resultsPerPage: 20,
  currentPage: 1,
  totalResults: 0,

  sortBy: 'relevance',
  sortOrder: 'desc',

  lastSearchTime: null,
  cacheSize: 0,
};

// Async Thunks
export const loadDocumentKeywords = createAsyncThunk<string[], void, { extra: ThunkExtra }>(
  'documentSearch/loadKeywords',
  async (_, { extra }) => {
    const { services } = extra;
    return await services.documentSearchService.loadKeywords();
  },
);

export const searchDocuments = createAsyncThunk<
  Document[],
  { keywords: string[]; operator: 'AND' | 'OR' },
  { extra: ThunkExtra }
>('documentSearch/search', async (params, { extra }) => {
  const { services } = extra;

  if (params.keywords.length === 0) {
    return [];
  }

  const documentIds = await services.documentSearchService.searchByMultipleKeywords(
    params.keywords,
    params.operator,
  );

  const documents = await services.documentSearchService.resolveDocuments(documentIds);
  return documents;
});

export const clearDocumentSearchCache = createAsyncThunk<void, void, { extra: ThunkExtra }>(
  'documentSearch/clearCache',
  async (_, { extra }) => {
    const { services } = extra;
    services.documentSearchService.clearCache();
  },
);

// Slice
const documentSearchSlice = createSlice({
  name: 'documentSearch',
  initialState,
  reducers: {
    setSearchKeywords: (state, action: PayloadAction<string[]>) => {
      state.currentKeywords = action.payload;
      state.currentPage = 1;
    },

    addSearchKeyword: (state, action: PayloadAction<string>) => {
      if (!state.currentKeywords.includes(action.payload)) {
        state.currentKeywords.push(action.payload);
        state.currentPage = 1;
      }
    },

    removeSearchKeyword: (state, action: PayloadAction<string>) => {
      state.currentKeywords = state.currentKeywords.filter((k) => k !== action.payload);
      state.currentPage = 1;
    },

    setSearchOperator: (state, action: PayloadAction<'AND' | 'OR'>) => {
      state.searchOperator = action.payload;
      state.currentPage = 1;
    },

    setSearchActive: (state, action: PayloadAction<boolean>) => {
      state.isSearchActive = action.payload;
      if (!action.payload) {
        state.currentKeywords = [];
        state.searchResults = [];
        state.selectedDocumentId = null;
        state.searchError = null;
        state.totalResults = 0;
        state.lastSearchTime = null;
      }
    },

    selectDocument: (state, action: PayloadAction<string | null>) => {
      state.selectedDocumentId = action.payload;
    },

    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },

    setResultsPerPage: (state, action: PayloadAction<number>) => {
      state.resultsPerPage = action.payload;
      state.currentPage = 1;
    },

    clearSearch: (state) => {
      state.currentKeywords = [];
      state.searchResults = [];
      state.selectedDocumentId = null;
      state.currentPage = 1;
      state.searchError = null;
      state.totalResults = 0;
      state.lastSearchTime = null;
      state.sortBy = 'relevance';
      state.sortOrder = 'desc';
    },

    setSortBy: (state, action: PayloadAction<SortBy>) => {
      state.sortBy = action.payload;
      state.currentPage = 1;
    },

    setSortOrder: (state, action: PayloadAction<SortOrder>) => {
      state.sortOrder = action.payload;
      state.currentPage = 1;
    },
  },

  extraReducers: (builder) => {
    builder
      // Load keywords
      .addCase(loadDocumentKeywords.pending, (state) => {
        state.keywordsLoading = true;
        state.keywordsError = null;
      })
      .addCase(loadDocumentKeywords.fulfilled, (state, action) => {
        state.availableKeywords = action.payload;
        state.keywordsLoading = false;
      })
      .addCase(loadDocumentKeywords.rejected, (state, action) => {
        state.keywordsLoading = false;
        state.keywordsError = action.error.message || 'Failed to load keywords';
      })

      // Search documents
      .addCase(searchDocuments.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchDocuments.fulfilled, (state, action) => {
        state.searchResults = action.payload;
        state.totalResults = action.payload.length;
        state.searchLoading = false;
        state.lastSearchTime = Date.now();
      })
      .addCase(searchDocuments.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.error.message || 'Search failed';
      })

      // Clear cache
      .addCase(clearDocumentSearchCache.fulfilled, (state) => {
        state.cacheSize = 0;
      });
  },
});

// Export actions
export const {
  setSearchKeywords,
  addSearchKeyword,
  removeSearchKeyword,
  setSearchOperator,
  setSearchActive,
  selectDocument,
  setCurrentPage,
  setResultsPerPage,
  clearSearch,
  setSortBy,
  setSortOrder,
} = documentSearchSlice.actions;

// Selectors
export const selectAvailableKeywords = (state: RootState): string[] =>
  state.documentSearch.availableKeywords;

export const selectCurrentSearch = createSelector(
  [(state: RootState) => state.documentSearch],
  (documentSearch) => ({
    keywords: documentSearch.currentKeywords,
    operator: documentSearch.searchOperator,
    isActive: documentSearch.isSearchActive,
  }),
);

export const selectSearchResults = (state: RootState): Document[] =>
  state.documentSearch.searchResults;

// Sorting selector
export const selectSortedSearchResults = createSelector(
  [(state: RootState) => state.documentSearch.searchResults,
   (state: RootState) => state.documentSearch.sortBy,
   (state: RootState) => state.documentSearch.sortOrder],
  (searchResults, sortBy, sortOrder): Document[] => {
    if (searchResults.length === 0) return searchResults;
    
    // For relevance sorting, maintain original order (already sorted by relevance from search)
    if (sortBy === 'relevance') {
      return sortOrder === 'desc' ? [...searchResults] : [...searchResults].reverse();
    }

    const sorted = [...searchResults].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'pageCount': {
          // Handle null values - put them at the end regardless of sort order
          if (a.pageCount === null && b.pageCount === null) return 0;
          if (a.pageCount === null) return 1;
          if (b.pageCount === null) return -1;
          comparison = a.pageCount - b.pageCount;
          break;
        }
        case 'dateFiled': {
          // Assuming dateFiled is in ISO format or similar sortable string
          comparison = a.dateFiled.localeCompare(b.dateFiled);
          break;
        }
        case 'fileSize': {
          // Handle null values - put them at the end regardless of sort order
          if (a.fileSize === null && b.fileSize === null) return 0;
          if (a.fileSize === null) return 1;
          if (b.fileSize === null) return -1;
          comparison = a.fileSize - b.fileSize;
          break;
        }
        case 'description': {
          comparison = a.description.localeCompare(b.description);
          break;
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }
);

export interface PaginationResult {
  results: Document[];
  totalResults: number;
  currentPage: number;
  resultsPerPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const selectPaginatedResults = createSelector(
  [selectSortedSearchResults,
   (state: RootState) => state.documentSearch.currentPage,
   (state: RootState) => state.documentSearch.resultsPerPage],
  (sortedResults, currentPage, resultsPerPage): PaginationResult => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;

    return {
      results: sortedResults.slice(startIndex, endIndex),
      totalResults: sortedResults.length,
      currentPage,
      resultsPerPage,
      totalPages: Math.ceil(sortedResults.length / resultsPerPage),
      hasNextPage: endIndex < sortedResults.length,
      hasPreviousPage: currentPage > 1,
    };
  }
);

export interface SearchStatus {
  loading: boolean;
  error: string | null;
  hasResults: boolean;
  isEmpty: boolean;
}

export const selectSearchState = createSelector(
  [(state: RootState) => state.documentSearch],
  (documentSearch): SearchStatus => ({
    loading: documentSearch.searchLoading,
    error: documentSearch.searchError,
    hasResults: documentSearch.searchResults.length > 0,
    isEmpty: documentSearch.currentKeywords.length === 0,
  }),
);

export const selectSelectedDocument = createSelector(
  [(state: RootState) => state.documentSearch.selectedDocumentId,
   selectSortedSearchResults],
  (selectedDocumentId, sortedResults): Document | null => {
    return selectedDocumentId
      ? sortedResults.find((doc: Document) => doc.searchId === selectedDocumentId) || null
      : null;
  }
);

// Sorting state selector
export const selectSortingState = createSelector(
  [(state: RootState) => state.documentSearch.sortBy,
   (state: RootState) => state.documentSearch.sortOrder],
  (sortBy, sortOrder) => ({ sortBy, sortOrder })
);

// Memoized selectors
export const selectKeywordSuggestions = createSelector(
  [selectAvailableKeywords, selectCurrentSearch],
  (available, current) => available.filter((keyword) => !current.keywords.includes(keyword)),
);

export const selectSearchStats = createSelector(
  [(state: RootState) => state.documentSearch],
  (search) => ({
    keywordsLoaded: search.availableKeywords.length,
    activeKeywords: search.currentKeywords.length,
    resultsFound: search.searchResults.length,
    cacheSize: search.cacheSize,
    lastSearch: search.lastSearchTime ? new Date(search.lastSearchTime) : null,
  }),
);

export default documentSearchSlice.reducer;
