import type { AppServices } from '../services/types';
import type { CasesState } from './casesSlice';
import type { DocumentsState } from './documentsSlice';
import type { UIState } from './uiSlice';
import type { DocumentSearchState } from './documentSearchSlice';

export interface ThunkExtra {
  services: AppServices;
}

export interface AppState {
  cases: CasesState;
  documents: DocumentsState;
  ui: UIState;
  documentSearch: DocumentSearchState;
}
