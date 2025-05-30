import { configureStore } from '@reduxjs/toolkit';
import casesReducer from './casesSlice';
import documentsReducer from './documentsSlice';
import uiReducer from './uiSlice';

export const createAppStore = () =>
  configureStore({
    reducer: {
      cases: casesReducer,
      documents: documentsReducer,
      ui: uiReducer,
    },
  });

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
