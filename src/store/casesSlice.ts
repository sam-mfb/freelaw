import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { CaseIndex } from '../types/index.types';
import type { CaseSummary } from '../types/case.types';
import type { ThunkExtra } from './types';

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
    onlyActive: false,
  },
  loading: false,
  error: null,
};

export const loadCaseIndex = createAsyncThunk('cases/loadIndex', async (_, { extra }) => {
  const { services } = extra as ThunkExtra;
  return await services.dataService.loadCaseIndex();
});

function filterCases(state: CasesState): CaseSummary[] {
  if (!state.index) return [];

  let filtered = state.index.cases;

  if (state.searchTerm) {
    const term = state.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (c) => c.name.toLowerCase().includes(term) || c.nameShort.toLowerCase().includes(term),
    );
  }

  if (state.filters.court) {
    filtered = filtered.filter((c) => c.court === state.filters.court);
  }

  if (state.filters.dateFrom) {
    filtered = filtered.filter((c) => c.filed >= state.filters.dateFrom!);
  }
  if (state.filters.dateTo) {
    filtered = filtered.filter((c) => c.filed <= state.filters.dateTo!);
  }

  if (state.filters.onlyActive) {
    filtered = filtered.filter((c) => !c.terminated);
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
    setDateFilter: (state, action: PayloadAction<{ from?: string; to?: string }>) => {
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
    },
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
  },
});

export const {
  setSearchTerm,
  setCourtFilter,
  setDateFilter,
  setOnlyActive,
  selectCase,
  clearFilters,
} = casesSlice.actions;

export default casesSlice.reducer;

