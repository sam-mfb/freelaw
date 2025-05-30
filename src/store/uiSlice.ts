import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  documentListView: 'grid' | 'list';
  sortBy: 'name' | 'date' | 'docCount';
  sortOrder: 'asc' | 'desc';
  casesPerPage: number;
  currentPage: number;
}

const initialState: UIState = {
  sidebarOpen: true,
  documentListView: 'list',
  sortBy: 'name',
  sortOrder: 'asc',
  casesPerPage: 25,
  currentPage: 1,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setDocumentView: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.documentListView = action.payload;
    },
    setSortBy: (state, action: PayloadAction<UIState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    setCasesPerPage: (state, action: PayloadAction<number>) => {
      state.casesPerPage = action.payload;
      state.currentPage = 1;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    resetPagination: (state) => {
      state.currentPage = 1;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setDocumentView,
  setSortBy,
  setSortOrder,
  toggleSortOrder,
  setCasesPerPage,
  setCurrentPage,
  resetPagination,
} = uiSlice.actions;

export default uiSlice.reducer;