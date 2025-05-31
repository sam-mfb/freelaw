# Phase 3: Redux Store for Document Search

## Objective
Extend the Redux store to manage document search state, including keywords, search queries, results, and UI state for the document search features.

## Deliverables
1. **New slice `documentSearchSlice.ts`** - Redux state management for document search
2. **Enhanced store configuration** - Integrate document search into existing store
3. **Async thunks** - Handle asynchronous document search operations
4. **Selectors** - Provide optimized state access for components

## State Structure

### Document Search State

```typescript
interface DocumentSearchState {
  // Keywords and search capabilities
  availableKeywords: string[];
  keywordsLoading: boolean;
  keywordsError: string | null;
  
  // Current search
  currentKeywords: string[];        // Active search keywords
  searchOperator: 'AND' | 'OR';    // How to combine keywords
  
  // Search results
  searchResults: SearchableDocument[];
  searchLoading: boolean;
  searchError: string | null;
  
  // UI state
  isSearchActive: boolean;          // Whether document search is open/active
  selectedDocumentId: string | null;
  
  // Pagination and filtering
  resultsPerPage: number;
  currentPage: number;
  totalResults: number;
  
  // Cache management
  lastSearchTime: number | null;
  cacheSize: number;               // Number of cached keyword results
}
```

### Integration with Existing Store

```typescript
// Add to src/store/types.ts
export interface AppState {
  cases: CasesState;
  documents: DocumentsState;
  ui: UiState;
  documentSearch: DocumentSearchState;  // New slice
}
```

## Implementation

### 1. Document Search Slice

Create `src/store/documentSearchSlice.ts`:

```typescript
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { SearchableDocument } from '../types/document.types';
import type { ThunkExtra } from './types';

interface DocumentSearchState {
  // Keywords
  availableKeywords: string[];
  keywordsLoading: boolean;
  keywordsError: string | null;
  
  // Current search
  currentKeywords: string[];
  searchOperator: 'AND' | 'OR';
  
  // Results
  searchResults: SearchableDocument[];
  searchLoading: boolean;
  searchError: string | null;
  
  // UI state
  isSearchActive: boolean;
  selectedDocumentId: string | null;
  
  // Pagination
  resultsPerPage: number;
  currentPage: number;
  totalResults: number;
  
  // Cache info
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
  
  lastSearchTime: null,
  cacheSize: 0,
};

// Async Thunks
export const loadDocumentKeywords = createAsyncThunk(
  'documentSearch/loadKeywords',
  async (_, { extra }) => {
    const { services } = extra as ThunkExtra;
    return await services.dataService.loadDocumentSearchKeywords();
  }
);

export const searchDocuments = createAsyncThunk(
  'documentSearch/search',
  async (params: { keywords: string[]; operator: 'AND' | 'OR' }, { extra }) => {
    const { services } = extra as ThunkExtra;
    
    if (params.keywords.length === 0) {
      return [];
    }
    
    // Get document IDs for all keywords
    const documentIdSets = await Promise.all(
      params.keywords.map(keyword => services.dataService.searchDocumentsByKeyword(keyword))
    );
    
    // Combine results based on operator
    let combinedIds: string[];
    if (params.operator === 'AND') {
      // Intersection - documents that appear in ALL keyword results
      combinedIds = documentIdSets.reduce((intersection, currentSet) => 
        intersection.filter(id => currentSet.includes(id))
      );
    } else {
      // Union - documents that appear in ANY keyword result
      const unionSet = new Set<string>();
      documentIdSets.forEach(idSet => idSet.forEach(id => unionSet.add(id)));
      combinedIds = Array.from(unionSet);
    }
    
    // Resolve document IDs to full document objects
    const documents = await services.dataService.resolveDocumentIds(combinedIds);
    return documents;
  }
);

export const clearDocumentSearchCache = createAsyncThunk(
  'documentSearch/clearCache',
  async (_, { extra }) => {
    const { services } = extra as ThunkExtra;
    services.dataService.clearDocumentSearchCache();
    return null;
  }
);

// Slice
const documentSearchSlice = createSlice({
  name: 'documentSearch',
  initialState,
  reducers: {
    // Search configuration
    setSearchKeywords: (state, action: PayloadAction<string[]>) => {
      state.currentKeywords = action.payload;
      state.currentPage = 1; // Reset to first page on new search
    },
    
    addSearchKeyword: (state, action: PayloadAction<string>) => {
      if (!state.currentKeywords.includes(action.payload)) {
        state.currentKeywords.push(action.payload);
        state.currentPage = 1;
      }
    },
    
    removeSearchKeyword: (state, action: PayloadAction<string>) => {
      state.currentKeywords = state.currentKeywords.filter(k => k !== action.payload);
      state.currentPage = 1;
    },
    
    setSearchOperator: (state, action: PayloadAction<'AND' | 'OR'>) => {
      state.searchOperator = action.payload;
      state.currentPage = 1;
    },
    
    // UI state
    setSearchActive: (state, action: PayloadAction<boolean>) => {
      state.isSearchActive = action.payload;
      if (!action.payload) {
        // Clear search when closing
        state.currentKeywords = [];
        state.searchResults = [];
        state.selectedDocumentId = null;
      }
    },
    
    selectDocument: (state, action: PayloadAction<string | null>) => {
      state.selectedDocumentId = action.payload;
    },
    
    // Pagination
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    
    setResultsPerPage: (state, action: PayloadAction<number>) => {
      state.resultsPerPage = action.payload;
      state.currentPage = 1; // Reset to first page when changing page size
    },
    
    // Clear state
    clearSearch: (state) => {
      state.currentKeywords = [];
      state.searchResults = [];
      state.selectedDocumentId = null;
      state.currentPage = 1;
      state.searchError = null;
    },
    
    clearAllState: (state) => {
      return { ...initialState };
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
  clearAllState,
} = documentSearchSlice.actions;

export default documentSearchSlice.reducer;
```

### 2. Selectors

Add to `src/store/documentSearchSlice.ts`:

```typescript
// Selectors
export const selectDocumentSearch = (state: AppState) => state.documentSearch;

export const selectAvailableKeywords = (state: AppState) => state.documentSearch.availableKeywords;

export const selectCurrentSearch = (state: AppState) => ({
  keywords: state.documentSearch.currentKeywords,
  operator: state.documentSearch.searchOperator,
  isActive: state.documentSearch.isSearchActive,
});

export const selectSearchResults = (state: AppState) => state.documentSearch.searchResults;

export const selectPaginatedResults = (state: AppState) => {
  const { searchResults, currentPage, resultsPerPage } = state.documentSearch;
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  
  return {
    results: searchResults.slice(startIndex, endIndex),
    totalResults: searchResults.length,
    currentPage,
    resultsPerPage,
    totalPages: Math.ceil(searchResults.length / resultsPerPage),
    hasNextPage: endIndex < searchResults.length,
    hasPreviousPage: currentPage > 1,
  };
};

export const selectSearchState = (state: AppState) => ({
  loading: state.documentSearch.searchLoading,
  error: state.documentSearch.searchError,
  hasResults: state.documentSearch.searchResults.length > 0,
  isEmpty: state.documentSearch.currentKeywords.length === 0,
});

export const selectSelectedDocument = (state: AppState) => {
  const { selectedDocumentId, searchResults } = state.documentSearch;
  return selectedDocumentId 
    ? searchResults.find(doc => doc.id === selectedDocumentId) || null
    : null;
};

// Memoized selectors for performance
import { createSelector } from '@reduxjs/toolkit';

export const selectKeywordSuggestions = createSelector(
  [selectAvailableKeywords, selectCurrentSearch],
  (available, current) => 
    available.filter(keyword => !current.keywords.includes(keyword))
);

export const selectSearchStats = createSelector(
  [selectDocumentSearch],
  (search) => ({
    keywordsLoaded: search.availableKeywords.length,
    activeKeywords: search.currentKeywords.length,
    resultsFound: search.searchResults.length,
    cacheSize: search.cacheSize,
    lastSearch: search.lastSearchTime ? new Date(search.lastSearchTime) : null,
  })
);
```

### 3. Enhanced Store Configuration

Update `src/store/index.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import casesReducer from './casesSlice';
import documentsReducer from './documentsSlice';
import uiReducer from './uiSlice';
import documentSearchReducer from './documentSearchSlice';  // New import
import type { ThunkExtra } from './types';
import { createDataService } from '../services/dataService';

export function createAppStore(services?: Partial<ThunkExtra['services']>) {
  const defaultServices = {
    dataService: createDataService(),
  };

  const store = configureStore({
    reducer: {
      cases: casesReducer,
      documents: documentsReducer,
      ui: uiReducer,
      documentSearch: documentSearchReducer,  // Add new reducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            services: { ...defaultServices, ...services },
          } as ThunkExtra,
        },
      }),
  });

  return store;
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
export type AppState = ReturnType<AppStore['getState']>;

// Export store instance
export const store = createAppStore();
```

### 4. Type Safety Updates

Update `src/hooks/redux.ts`:

```typescript
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, AppState } from '../store';

// Typed hooks that include document search state
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<AppState>();

// Convenience hooks for document search
export const useDocumentSearch = () => useAppSelector(state => state.documentSearch);
export const useDocumentSearchKeywords = () => useAppSelector(state => state.documentSearch.availableKeywords);
export const useDocumentSearchResults = () => useAppSelector(state => state.documentSearch.searchResults);
```

## Testing Strategy

### 1. Slice Unit Tests

Create `src/store/__tests__/documentSearchSlice.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import documentSearchReducer, {
  setSearchKeywords,
  addSearchKeyword,
  removeSearchKeyword,
  setSearchOperator,
  setSearchActive,
  selectDocument,
  clearSearch,
  loadDocumentKeywords,
  searchDocuments,
} from '../documentSearchSlice';

// Mock services
const mockDataService = {
  loadDocumentSearchKeywords: vi.fn(),
  searchDocumentsByKeyword: vi.fn(),
  resolveDocumentIds: vi.fn(),
  clearDocumentSearchCache: vi.fn(),
};

const createTestStore = () => {
  return configureStore({
    reducer: {
      documentSearch: documentSearchReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            services: { dataService: mockDataService },
          },
        },
      }),
  });
};

describe('documentSearchSlice', () => {
  it('should set search keywords', () => {
    const store = createTestStore();
    
    store.dispatch(setSearchKeywords(['motion', 'summary']));
    
    const state = store.getState().documentSearch;
    expect(state.currentKeywords).toEqual(['motion', 'summary']);
    expect(state.currentPage).toBe(1); // Should reset page
  });

  it('should add search keyword', () => {
    const store = createTestStore();
    
    store.dispatch(addSearchKeyword('motion'));
    store.dispatch(addSearchKeyword('summary'));
    store.dispatch(addSearchKeyword('motion')); // Duplicate should be ignored
    
    const state = store.getState().documentSearch;
    expect(state.currentKeywords).toEqual(['motion', 'summary']);
  });

  it('should remove search keyword', () => {
    const store = createTestStore();
    
    store.dispatch(setSearchKeywords(['motion', 'summary', 'judgment']));
    store.dispatch(removeSearchKeyword('summary'));
    
    const state = store.getState().documentSearch;
    expect(state.currentKeywords).toEqual(['motion', 'judgment']);
  });

  it('should toggle search active state', () => {
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
    expect(state.selectedDocumentId).toBe(null);
  });

  it('should handle async keyword loading', async () => {
    const store = createTestStore();
    const mockKeywords = ['motion', 'deposition', 'order'];
    
    mockDataService.loadDocumentSearchKeywords.mockResolvedValueOnce(mockKeywords);
    
    await store.dispatch(loadDocumentKeywords());
    
    const state = store.getState().documentSearch;
    expect(state.availableKeywords).toEqual(mockKeywords);
    expect(state.keywordsLoading).toBe(false);
    expect(state.keywordsError).toBe(null);
  });

  it('should handle async document search', async () => {
    const store = createTestStore();
    const mockDocuments = [
      {
        id: '100877-1-0',
        caseId: 100877,
        documentNumber: '1',
        attachmentNumber: 0,
        description: 'Motion for Summary Judgment',
        caseName: 'Test Case',
        court: 'cacd',
      },
    ];
    
    // Mock the service chain
    mockDataService.searchDocumentsByKeyword
      .mockResolvedValueOnce(['100877-1-0'])  // motion
      .mockResolvedValueOnce(['100877-1-0']);  // summary
    
    mockDataService.resolveDocumentIds.mockResolvedValueOnce(mockDocuments);
    
    await store.dispatch(searchDocuments({ 
      keywords: ['motion', 'summary'], 
      operator: 'AND' 
    }));
    
    const state = store.getState().documentSearch;
    expect(state.searchResults).toEqual(mockDocuments);
    expect(state.totalResults).toBe(1);
    expect(state.searchLoading).toBe(false);
  });
});
```

### 2. Selector Tests

```typescript
import { describe, it, expect } from 'vitest';
import {
  selectPaginatedResults,
  selectSearchState,
  selectKeywordSuggestions,
  selectSearchStats,
} from '../documentSearchSlice';

describe('documentSearch selectors', () => {
  const mockState = {
    documentSearch: {
      availableKeywords: ['motion', 'deposition', 'order', 'summary'],
      currentKeywords: ['motion', 'summary'],
      searchOperator: 'AND' as const,
      searchResults: Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}-1-0`,
        caseId: i + 1,
        documentNumber: '1',
        attachmentNumber: 0,
        description: `Document ${i + 1}`,
        caseName: `Case ${i + 1}`,
        court: 'cacd',
      })),
      currentPage: 2,
      resultsPerPage: 10,
      searchLoading: false,
      searchError: null,
      isSearchActive: true,
      lastSearchTime: Date.now(),
      cacheSize: 3,
    },
  } as any;

  it('should select paginated results', () => {
    const result = selectPaginatedResults(mockState);
    
    expect(result.results).toHaveLength(10); // Page 2 of 10 per page
    expect(result.totalResults).toBe(25);
    expect(result.currentPage).toBe(2);
    expect(result.totalPages).toBe(3);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPreviousPage).toBe(true);
  });

  it('should select search state', () => {
    const result = selectSearchState(mockState);
    
    expect(result.loading).toBe(false);
    expect(result.error).toBe(null);
    expect(result.hasResults).toBe(true);
    expect(result.isEmpty).toBe(false);
  });

  it('should select keyword suggestions', () => {
    const result = selectKeywordSuggestions(mockState);
    
    expect(result).toEqual(['deposition', 'order']); // Excludes current keywords
  });

  it('should select search stats', () => {
    const result = selectSearchStats(mockState);
    
    expect(result.keywordsLoaded).toBe(4);
    expect(result.activeKeywords).toBe(2);
    expect(result.resultsFound).toBe(25);
    expect(result.cacheSize).toBe(3);
    expect(result.lastSearch).toBeInstanceOf(Date);
  });
});
```

### 3. Integration Test with Mock Data

Create `src/store/__tests__/documentSearch.integration.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createAppStore } from '../index';
import { loadDocumentKeywords, searchDocuments, setSearchKeywords } from '../documentSearchSlice';

describe('Document Search Integration', () => {
  let store: ReturnType<typeof createAppStore>;

  beforeEach(() => {
    // Create store with mock services
    store = createAppStore({
      dataService: {
        loadDocumentSearchKeywords: async () => ['motion', 'deposition', 'order'],
        searchDocumentsByKeyword: async (keyword: string) => {
          // Mock keyword results
          const results = {
            'motion': ['100877-1-0', '234561-3-0'],
            'deposition': ['100877-5-0', '567890-2-0'],
            'order': ['100877-1-0', '789012-1-0'],
          };
          return results[keyword as keyof typeof results] || [];
        },
        resolveDocumentIds: async (ids: string[]) => {
          return ids.map(id => ({
            id,
            caseId: parseInt(id.split('-')[0]),
            documentNumber: id.split('-')[1],
            attachmentNumber: parseInt(id.split('-')[2]),
            description: `Mock document for ${id}`,
            caseName: `Mock Case ${id.split('-')[0]}`,
            court: 'cacd',
          }));
        },
        clearDocumentSearchCache: async () => {},
      } as any,
    });
  });

  it('should complete full search workflow', async () => {
    // Load keywords
    await store.dispatch(loadDocumentKeywords());
    expect(store.getState().documentSearch.availableKeywords).toEqual(['motion', 'deposition', 'order']);

    // Set search keywords
    store.dispatch(setSearchKeywords(['motion', 'order']));
    expect(store.getState().documentSearch.currentKeywords).toEqual(['motion', 'order']);

    // Perform search (OR operation by default)
    await store.dispatch(searchDocuments({ 
      keywords: ['motion', 'order'], 
      operator: 'OR' 
    }));

    const state = store.getState().documentSearch;
    expect(state.searchResults).toHaveLength(4); // Union of motion + order results
    expect(state.searchLoading).toBe(false);
    expect(state.totalResults).toBe(4);
  });
});
```

### 4. HTML Test Page

Create `public/tests/test-document-search-store.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Document Search Store Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; }
        pre { background-color: #f8f9fa; padding: 10px; overflow-x: auto; }
        button { margin: 5px; padding: 8px 16px; }
        .state-display { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Document Search Store Test</h1>
    <p>This page tests the Redux store for document search functionality using mock data.</p>
    
    <div class="test-section">
        <h3>Current State</h3>
        <div id="state-display" class="state-display">
            <pre id="state-content">Loading...</pre>
        </div>
        <button onclick="refreshState()">Refresh State</button>
    </div>
    
    <div class="test-section">
        <h3>1. Load Keywords</h3>
        <button onclick="testLoadKeywords()">Load Keywords</button>
        <div id="keywords-result"></div>
    </div>
    
    <div class="test-section">
        <h3>2. Set Search Keywords</h3>
        <input type="text" id="keywords-input" placeholder="Enter keywords (comma-separated)" value="motion,summary">
        <button onclick="testSetKeywords()">Set Keywords</button>
        <div id="set-keywords-result"></div>
    </div>
    
    <div class="test-section">
        <h3>3. Perform Search</h3>
        <select id="operator-select">
            <option value="OR">OR</option>
            <option value="AND">AND</option>
        </select>
        <button onclick="testSearch()">Search</button>
        <div id="search-result"></div>
    </div>
    
    <div class="test-section">
        <h3>4. Pagination</h3>
        <button onclick="testPagination()">Test Pagination</button>
        <div id="pagination-result"></div>
    </div>

    <script type="module">
        // Mock Redux store functionality
        class MockDocumentSearchStore {
            constructor() {
                this.state = {
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
                    resultsPerPage: 10,
                    currentPage: 1,
                    totalResults: 0,
                    lastSearchTime: null,
                    cacheSize: 0,
                };
                this.listeners = [];
            }

            subscribe(listener) {
                this.listeners.push(listener);
                return () => {
                    this.listeners = this.listeners.filter(l => l !== listener);
                };
            }

            dispatch(action) {
                console.log('Dispatching action:', action);
                this.state = this.reducer(this.state, action);
                this.listeners.forEach(listener => listener());
                return Promise.resolve(action);
            }

            getState() {
                return { documentSearch: this.state };
            }

            reducer(state, action) {
                switch (action.type) {
                    case 'documentSearch/loadKeywords/fulfilled':
                        return {
                            ...state,
                            availableKeywords: action.payload,
                            keywordsLoading: false,
                            keywordsError: null,
                        };
                    
                    case 'documentSearch/setSearchKeywords':
                        return {
                            ...state,
                            currentKeywords: action.payload,
                            currentPage: 1,
                        };
                    
                    case 'documentSearch/search/fulfilled':
                        return {
                            ...state,
                            searchResults: action.payload,
                            totalResults: action.payload.length,
                            searchLoading: false,
                            searchError: null,
                            lastSearchTime: Date.now(),
                        };
                    
                    case 'documentSearch/setCurrentPage':
                        return {
                            ...state,
                            currentPage: action.payload,
                        };
                    
                    default:
                        return state;
                }
            }

            // Mock async actions
            async loadKeywords() {
                this.dispatch({ type: 'documentSearch/loadKeywords/pending' });
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 500));
                const keywords = ['motion', 'deposition', 'order', 'summary', 'judgment', 'brief'];
                
                return this.dispatch({
                    type: 'documentSearch/loadKeywords/fulfilled',
                    payload: keywords,
                });
            }

            async searchDocuments(keywords, operator) {
                this.dispatch({ type: 'documentSearch/search/pending' });
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Mock search results
                const mockResults = [];
                for (let i = 0; i < 25; i++) {
                    mockResults.push({
                        id: `${100000 + i}-${Math.floor(Math.random() * 10) + 1}-0`,
                        caseId: 100000 + i,
                        documentNumber: `${Math.floor(Math.random() * 10) + 1}`,
                        attachmentNumber: 0,
                        description: `Mock ${keywords.join(' ' + operator + ' ')} document ${i + 1}`,
                        caseName: `Mock Case ${100000 + i}`,
                        court: 'cacd',
                    });
                }
                
                return this.dispatch({
                    type: 'documentSearch/search/fulfilled',
                    payload: mockResults,
                });
            }
        }

        const store = new MockDocumentSearchStore();

        // Subscribe to state changes
        store.subscribe(() => {
            refreshState();
        });

        window.refreshState = function() {
            const stateContent = document.getElementById('state-content');
            const state = store.getState().documentSearch;
            stateContent.textContent = JSON.stringify(state, null, 2);
        };

        window.testLoadKeywords = async function() {
            const resultDiv = document.getElementById('keywords-result');
            try {
                await store.loadKeywords();
                const state = store.getState().documentSearch;
                
                resultDiv.className = 'success';
                resultDiv.innerHTML = `
                    <strong>Success!</strong> Loaded ${state.availableKeywords.length} keywords
                    <pre>${JSON.stringify(state.availableKeywords, null, 2)}</pre>
                `;
            } catch (error) {
                resultDiv.className = 'error';
                resultDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
            }
        };

        window.testSetKeywords = function() {
            const input = document.getElementById('keywords-input').value;
            const keywords = input.split(',').map(k => k.trim()).filter(k => k);
            const resultDiv = document.getElementById('set-keywords-result');
            
            store.dispatch({
                type: 'documentSearch/setSearchKeywords',
                payload: keywords,
            });
            
            resultDiv.className = 'success';
            resultDiv.innerHTML = `
                <strong>Success!</strong> Set search keywords to: ${keywords.join(', ')}
            `;
        };

        window.testSearch = async function() {
            const operator = document.getElementById('operator-select').value;
            const state = store.getState().documentSearch;
            const resultDiv = document.getElementById('search-result');
            
            if (state.currentKeywords.length === 0) {
                resultDiv.className = 'error';
                resultDiv.innerHTML = '<strong>Error:</strong> No keywords set for search';
                return;
            }
            
            try {
                await store.searchDocuments(state.currentKeywords, operator);
                const newState = store.getState().documentSearch;
                
                resultDiv.className = 'success';
                resultDiv.innerHTML = `
                    <strong>Success!</strong> Found ${newState.searchResults.length} documents
                    <pre>${JSON.stringify(newState.searchResults.slice(0, 3), null, 2)}${newState.searchResults.length > 3 ? '\n... and ' + (newState.searchResults.length - 3) + ' more' : ''}</pre>
                `;
            } catch (error) {
                resultDiv.className = 'error';
                resultDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
            }
        };

        window.testPagination = function() {
            const state = store.getState().documentSearch;
            const resultDiv = document.getElementById('pagination-result');
            
            if (state.searchResults.length === 0) {
                resultDiv.className = 'error';
                resultDiv.innerHTML = '<strong>Error:</strong> No search results to paginate';
                return;
            }
            
            // Test pagination logic
            const { resultsPerPage, currentPage } = state;
            const startIndex = (currentPage - 1) * resultsPerPage;
            const endIndex = startIndex + resultsPerPage;
            const pageResults = state.searchResults.slice(startIndex, endIndex);
            const totalPages = Math.ceil(state.searchResults.length / resultsPerPage);
            
            resultDiv.className = 'success';
            resultDiv.innerHTML = `
                <strong>Pagination Test:</strong><br>
                Total Results: ${state.searchResults.length}<br>
                Results Per Page: ${resultsPerPage}<br>
                Current Page: ${currentPage}<br>
                Total Pages: ${totalPages}<br>
                Page Results: ${pageResults.length}<br>
                <button onclick="store.dispatch({type: 'documentSearch/setCurrentPage', payload: ${Math.max(1, currentPage - 1)}})">Previous</button>
                <button onclick="store.dispatch({type: 'documentSearch/setCurrentPage', payload: ${Math.min(totalPages, currentPage + 1)}})">Next</button>
            `;
        };

        // Initialize
        refreshState();
    </script>
</body>
</html>
```

## Success Criteria

Phase 3 is complete when:

1. ✅ **State Management**: All document search state is properly managed in Redux
2. ✅ **Async Operations**: Thunks handle loading keywords and searching documents  
3. ✅ **Selectors**: Optimized selectors provide computed state for components
4. ✅ **Type Safety**: All state shapes and actions are properly typed
5. ✅ **Independent Testing**: Store works with mocked services via HTML test page

## Independence Verification

This phase works independently by:

- **Mocked Services**: Uses mock data service for all async operations
- **State Testing**: Unit tests verify state transitions without external dependencies
- **HTML Testing**: Visual demonstration of store functionality with simulated data
- **No UI Dependencies**: Store logic works without React components

## Files Created/Modified

- `src/store/documentSearchSlice.ts` (new)
- `src/store/index.ts` (enhanced)
- `src/store/types.ts` (enhanced)
- `src/hooks/redux.ts` (enhanced)
- `src/store/__tests__/documentSearchSlice.test.ts` (new)
- `src/store/__tests__/documentSearch.integration.test.ts` (new)
- `public/tests/test-document-search-store.html` (new)