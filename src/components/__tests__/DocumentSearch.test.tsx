import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi } from 'vitest';
import { DocumentSearch } from '../DocumentSearch';
import documentSearchReducer from '../../store/documentSearchSlice';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      documentSearch: documentSearchReducer,
    },
    preloadedState: {
      documentSearch: {
        availableKeywords: ['motion', 'deposition', 'order'],
        isSearchActive: false,
        currentKeywords: [],
        searchResults: [],
        searchLoading: false,
        searchError: null,
        keywordsLoading: false,
        keywordsError: null,
        searchOperator: 'OR' as const,
        selectedDocumentId: null,
        resultsPerPage: 20,
        currentPage: 1,
        totalResults: 0,
        lastSearchTime: null,
        cacheSize: 0,
        ...initialState,
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            services: {
              documentSearchService: {
                loadKeywords: vi.fn().mockResolvedValue(['motion', 'deposition']),
                searchByMultipleKeywords: vi.fn().mockResolvedValue([]),
                resolveDocuments: vi.fn().mockResolvedValue([]),
              },
            },
          },
        },
      }),
  });
};

describe('DocumentSearch', () => {
  it('should render toggle button when search is inactive', () => {
    const store = createMockStore({ isSearchActive: false });

    render(
      <Provider store={store}>
        <DocumentSearch />
      </Provider>,
    );

    expect(screen.getByText('Search Documents')).toBeInTheDocument();
  });

  it('should render search interface when active', () => {
    const store = createMockStore({ isSearchActive: true });

    render(
      <Provider store={store}>
        <DocumentSearch />
      </Provider>,
    );

    expect(screen.getByText('Document Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add keyword/)).toBeInTheDocument();
  });

  it('should toggle search state when button clicked', () => {
    const store = createMockStore({ isSearchActive: false });

    render(
      <Provider store={store}>
        <DocumentSearch />
      </Provider>,
    );

    const toggleButton = screen.getByText('Search Documents');
    fireEvent.click(toggleButton);

    // Check if search became active
    const state = store.getState();
    expect(state.documentSearch.isSearchActive).toBe(true);
  });

  it('should display error messages', () => {
    const store = createMockStore({
      isSearchActive: true,
      searchError: 'Failed to load keywords',
    });

    render(
      <Provider store={store}>
        <DocumentSearch />
      </Provider>,
    );

    expect(screen.getByText('Failed to load keywords')).toBeInTheDocument();
  });
});
