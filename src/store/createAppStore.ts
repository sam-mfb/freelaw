import { configureStore } from '@reduxjs/toolkit';
import casesReducer from './casesSlice';
import documentsReducer from './documentsSlice';
import uiReducer from './uiSlice';
import documentSearchReducer from './documentSearchSlice';
import type { AppServices } from '../services/types';

export const createAppStore = (services: AppServices) =>
  configureStore({
    reducer: {
      cases: casesReducer,
      documents: documentsReducer,
      ui: uiReducer,
      documentSearch: documentSearchReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: { services },
        },
      }),
  });

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
