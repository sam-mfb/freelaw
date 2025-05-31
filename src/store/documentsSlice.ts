import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Document } from '../types/document.types';
import type { ThunkExtra } from './types';

export interface DocumentsState {
  documents: Record<number, Document[]>;
  currentDocuments: Document[];
  filteredDocuments: Document[];
  searchTerm: string;
  loading: boolean;
  error: string | null;
}

const initialState: DocumentsState = {
  documents: {},
  currentDocuments: [],
  filteredDocuments: [],
  searchTerm: '',
  loading: false,
  error: null,
};

export const loadDocuments = createAsyncThunk(
  'documents/load',
  async (caseId: number, { extra }) => {
    const { services } = extra as ThunkExtra;
    const docs = await services.dataService.loadCaseDocuments(caseId);
    return { caseId, documents: docs };
  },
);

function filterDocuments(documents: Document[], searchTerm: string): Document[] {
  if (!searchTerm) return documents;

  const term = searchTerm.toLowerCase();
  return documents.filter(
    (d) =>
      d.description.toLowerCase().includes(term) || d.documentNumber.toLowerCase().includes(term),
  );
}

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setDocumentSearch: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.filteredDocuments = filterDocuments(state.currentDocuments, action.payload);
    },
    clearDocuments: (state) => {
      state.currentDocuments = [];
      state.filteredDocuments = [];
      state.searchTerm = '';
    },
    setCurrentDocuments: (state, action: PayloadAction<number>) => {
      const caseId = action.payload;
      const docs = state.documents[caseId] || [];
      state.currentDocuments = docs;
      state.filteredDocuments = filterDocuments(docs, state.searchTerm);
    },
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
        state.filteredDocuments = filterDocuments(documents, state.searchTerm);
        state.loading = false;
      })
      .addCase(loadDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load documents';
      });
  },
});

export const { setDocumentSearch, clearDocuments, setCurrentDocuments } = documentsSlice.actions;
export default documentsSlice.reducer;
