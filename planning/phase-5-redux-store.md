# Phase 5: Redux Store

## Objective

Implement Redux Toolkit store with slices for managing cases, documents, and UI state. This provides centralized state management for the React components.

## Store Structure

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import casesReducer from './casesSlice';
import documentsReducer from './documentsSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    cases: casesReducer,
    documents: documentsReducer,
    ui: uiReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Cases Slice

```typescript
// store/casesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { loadCaseIndex as loadCaseIndexService } from '@services/dataService';
import type { CaseIndex } from '@types/index.types';
import type { CaseSummary } from '@types/case.types';

interface CasesState {
  index: CaseIndex | null;
  filteredCases: CaseSummary[];
  selectedCaseId: number | null;
  searchTerm: string;
  filters: {
    court: string | null;
    dateFrom: string | null;
    dateTo: string | null;
    onlyActive: boolean;
  };
  loading: boolean;
  error: string | null;
}

const initialState: CasesState = {
  index: null,
  filteredCases: [],
  selectedCaseId: null,
  searchTerm: '',
  filters: {
    court: null,
    dateFrom: null,
    dateTo: null,
    onlyActive: false
  },
  loading: false,
  error: null
};

// Async thunk to load case index
export const loadCaseIndex = createAsyncThunk(
  'cases/loadIndex',
  async () => {
    return await loadCaseIndexService();
  }
);

// Helper function to filter cases
function filterCases(state: CasesState): CaseSummary[] {
  if (!state.index) return [];
  
  let filtered = state.index.cases;
  
  // Search filter
  if (state.searchTerm) {
    const term = state.searchTerm.toLowerCase();
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.nameShort.toLowerCase().includes(term)
    );
  }
  
  // Court filter
  if (state.filters.court) {
    filtered = filtered.filter(c => c.court === state.filters.court);
  }
  
  // Date filters
  if (state.filters.dateFrom) {
    filtered = filtered.filter(c => c.filed >= state.filters.dateFrom!);
  }
  if (state.filters.dateTo) {
    filtered = filtered.filter(c => c.filed <= state.filters.dateTo!);
  }
  
  // Active cases only
  if (state.filters.onlyActive) {
    filtered = filtered.filter(c => !c.terminated);
  }
  
  return filtered;
}

const casesSlice = createSlice({
  name: 'cases',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.filteredCases = filterCases(state);
    },
    setCourtFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.court = action.payload;
      state.filteredCases = filterCases(state);
    },
    setDateFilter: (state, action: PayloadAction<{from?: string; to?: string}>) => {
      if (action.payload.from !== undefined) {
        state.filters.dateFrom = action.payload.from;
      }
      if (action.payload.to !== undefined) {
        state.filters.dateTo = action.payload.to;
      }
      state.filteredCases = filterCases(state);
    },
    setOnlyActive: (state, action: PayloadAction<boolean>) => {
      state.filters.onlyActive = action.payload;
      state.filteredCases = filterCases(state);
    },
    selectCase: (state, action: PayloadAction<number>) => {
      state.selectedCaseId = action.payload;
    },
    clearFilters: (state) => {
      state.searchTerm = '';
      state.filters = initialState.filters;
      state.filteredCases = state.index?.cases || [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCaseIndex.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCaseIndex.fulfilled, (state, action) => {
        state.index = action.payload;
        state.filteredCases = action.payload.cases;
        state.loading = false;
      })
      .addCase(loadCaseIndex.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load cases';
      });
  }
});

export const {
  setSearchTerm,
  setCourtFilter,
  setDateFilter,
  setOnlyActive,
  selectCase,
  clearFilters
} = casesSlice.actions;

export default casesSlice.reducer;
```

## Documents Slice

```typescript
// store/documentsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loadCaseDocuments as loadCaseDocumentsService } from '@services/dataService';
import type { Document } from '@types/document.types';

interface DocumentsState {
  documents: Record<number, Document[]>; // Keyed by case ID
  currentDocuments: Document[];
  searchTerm: string;
  loading: boolean;
  error: string | null;
}

const initialState: DocumentsState = {
  documents: {},
  currentDocuments: [],
  searchTerm: '',
  loading: false,
  error: null
};

export const loadDocuments = createAsyncThunk(
  'documents/load',
  async (caseId: number) => {
    const docs = await loadCaseDocumentsService(caseId);
    return { caseId, documents: docs };
  }
);

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setDocumentSearch: (state, action) => {
      state.searchTerm = action.payload;
      // Filter current documents
      if (state.currentDocuments.length > 0) {
        const term = action.payload.toLowerCase();
        state.currentDocuments = state.currentDocuments.filter(d =>
          d.description.toLowerCase().includes(term)
        );
      }
    },
    clearDocuments: (state) => {
      state.currentDocuments = [];
      state.searchTerm = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDocuments.fulfilled, (state, action) => {
        const { caseId, documents } = action.payload;
        state.documents[caseId] = documents;
        state.currentDocuments = documents;
        state.loading = false;
      })
      .addCase(loadDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load documents';
      });
  }
});

export const { setDocumentSearch, clearDocuments } = documentsSlice.actions;
export default documentsSlice.reducer;
```

## UI Slice

```typescript
// store/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  documentListView: 'grid' | 'list';
  sortBy: 'name' | 'date' | 'docCount';
  sortOrder: 'asc' | 'desc';
}

const initialState: UIState = {
  sidebarOpen: true,
  documentListView: 'list',
  sortBy: 'name',
  sortOrder: 'asc'
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setDocumentView: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.documentListView = action.payload;
    },
    setSortBy: (state, action: PayloadAction<UIState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    }
  }
});

export const { toggleSidebar, setDocumentView, setSortBy, setSortOrder } = uiSlice.actions;
export default uiSlice.reducer;
```

## Typed Hooks

```typescript
// hooks/redux.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

## Testing

```typescript
// store/testRedux.ts
import { configureStore } from '@reduxjs/toolkit';
import casesReducer, { loadCaseIndex, setSearchTerm } from './casesSlice';

// Mock the data service
jest.mock('../services/dataService', () => ({
  loadCaseIndex: async () => ({
      cases: [
        { id: 1, name: 'Test v. Example', court: 'test', filed: '2023-01-01' },
        { id: 2, name: 'Demo v. Sample', court: 'demo', filed: '2023-02-01' }
      ],
      courts: [{ code: 'test', name: 'Test Court' }],
      dateRange: { min: '2023-01-01', max: '2023-02-01' }
    })
  }
}));

async function testReduxStore() {
  const store = configureStore({
    reducer: { cases: casesReducer }
  });
  
  // Test loading
  await store.dispatch(loadCaseIndex());
  console.assert(store.getState().cases.index?.cases.length === 2, 'Should load 2 cases');
  
  // Test filtering
  store.dispatch(setSearchTerm('Test'));
  console.assert(store.getState().cases.filteredCases.length === 1, 'Should filter to 1 case');
  
  console.log('✅ Redux store tests passed');
}
```

## Success Criteria

- [ ] Store initializes without errors
- [ ] Case index loads successfully
- [ ] Search filtering works correctly
- [ ] Court filter works correctly
- [ ] Date filters work correctly
- [ ] Document loading works by case ID
- [ ] UI state changes persist
- [ ] TypeScript types are properly exported

## Notes for Integration

- Phase 6 components will use the typed hooks
- Mock the dataService for testing this phase independently
- The store should be provided at the app root level
- Consider Redux DevTools for debugging