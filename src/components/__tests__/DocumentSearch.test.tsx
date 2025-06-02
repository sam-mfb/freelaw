/**
 * @vitest-environment jsdom
 */
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
        sortBy: 'relevance' as const,
        sortOrder: 'desc' as const,
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
  it('should render search interface', () => {
    const store = createMockStore({ isSearchActive: false });

    render(
      <Provider store={store}>
        <DocumentSearch />
      </Provider>,
    );

    expect(screen.getByText('Document Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add keyword/)).toBeInTheDocument();
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

  it('should clear search when clear button clicked', () => {
    const store = createMockStore({ 
      currentKeywords: ['motion', 'order'],
      searchResults: [{
        id: 1,
        searchId: '1-1-0',
        entryNumber: 1,
        documentNumber: '1',
        attachmentNumber: null,
        description: 'Test Document',
        dateFiled: '2023-01-01',
        pageCount: 10,
        fileSize: 1000,
        filePath: '/path/to/doc.pdf',
        sha1: 'abc123',
        caseId: 100877,
        caseName: 'Test Case',
        court: 'test-court',
      }] 
    });

    render(
      <Provider store={store}>
        <DocumentSearch />
      </Provider>,
    );

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    // Check if search was cleared
    const state = store.getState();
    expect(state.documentSearch.currentKeywords).toEqual([]);
    expect(state.documentSearch.searchResults).toEqual([]);
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
