import { describe, it, expect, beforeEach } from 'vitest';
import { createAppStore } from '../createAppStore';
import {
  loadDocumentKeywords,
  searchDocuments,
  setSearchKeywords,
  setSearchOperator,
  clearDocumentSearchCache,
} from '../documentSearchSlice';
import type { SearchableDocument } from '../../types/document.types';
import type { AppServices } from '../../services/types';

describe('Document Search Integration', () => {
  let store: ReturnType<typeof createAppStore>;

  beforeEach(() => {
    // Create store with mock services
    const mockServices: AppServices = {
      dataService: {
        loadCaseIndex: async () => ({ cases: [], courts: [], dateRange: { start: '', end: '' } }),
        loadCaseDocuments: async () => [],
      } as AppServices['dataService'],
      documentSearchService: {
        loadKeywords: async () => ['motion', 'deposition', 'order'],
        searchByKeyword: async (keyword: string) => {
          const results: Record<string, string[]> = {
            motion: ['100877-1-0', '234561-3-0'],
            deposition: ['100877-5-0', '567890-2-0'],
            order: ['100877-1-0', '789012-1-0'],
          };
          return results[keyword] || [];
        },
        searchByMultipleKeywords: async (keywords: string[], operator: 'AND' | 'OR') => {
          const keywordResults: Record<string, string[]> = {
            motion: ['100877-1-0', '234561-3-0'],
            deposition: ['100877-5-0', '567890-2-0'],
            order: ['100877-1-0', '789012-1-0'],
          };

          const sets = keywords.map((k) => keywordResults[k] || []);

          if (operator === 'AND') {
            // Intersection
            if (sets.length === 0) return [];
            return sets.reduce((intersection, currentSet) =>
              intersection.filter((id) => currentSet.includes(id)),
            );
          } else {
            // Union
            const unionSet = new Set<string>();
            sets.forEach((set) => set.forEach((id) => unionSet.add(id)));
            return Array.from(unionSet);
          }
        },
        resolveDocuments: async (ids: string[]): Promise<SearchableDocument[]> => {
          return ids.map((id) => {
            const [caseId, docNum, attachNum] = id.split('-');
            return {
              id,
              caseId: parseInt(caseId),
              documentNumber: docNum,
              attachmentNumber: parseInt(attachNum),
              description: `Mock document for ${id}`,
              caseName: `Mock Case ${caseId}`,
              court: 'cacd',
            };
          });
        },
        clearCache: () => {},
      },
    };

    store = createAppStore(mockServices);
  });

  it('completes full search workflow', async () => {
    // Load keywords
    await store.dispatch(loadDocumentKeywords());
    expect(store.getState().documentSearch.availableKeywords).toEqual([
      'motion',
      'deposition',
      'order',
    ]);

    // Set search keywords
    store.dispatch(setSearchKeywords(['motion', 'order']));
    expect(store.getState().documentSearch.currentKeywords).toEqual(['motion', 'order']);

    // Perform search (OR operation by default)
    await store.dispatch(
      searchDocuments({
        keywords: ['motion', 'order'],
        operator: 'OR',
      }),
    );

    const state = store.getState().documentSearch;
    expect(state.searchResults).toHaveLength(3); // Union: 100877-1-0, 234561-3-0, 789012-1-0
    expect(state.searchLoading).toBe(false);
    expect(state.totalResults).toBe(3);
    expect(state.searchError).toBe(null);
  });

  it('handles AND operation correctly', async () => {
    // Load keywords
    await store.dispatch(loadDocumentKeywords());

    // Set keywords and operator
    store.dispatch(setSearchKeywords(['motion', 'order']));
    store.dispatch(setSearchOperator('AND'));

    // Perform search
    await store.dispatch(
      searchDocuments({
        keywords: ['motion', 'order'],
        operator: 'AND',
      }),
    );

    const state = store.getState().documentSearch;
    expect(state.searchResults).toHaveLength(1); // Intersection: only 100877-1-0
    expect(state.searchResults[0].id).toBe('100877-1-0');
  });

  it('handles empty search results', async () => {
    await store.dispatch(loadDocumentKeywords());

    // Search for keywords with no overlap
    store.dispatch(setSearchKeywords(['motion', 'deposition']));
    store.dispatch(setSearchOperator('AND'));

    await store.dispatch(
      searchDocuments({
        keywords: ['motion', 'deposition'],
        operator: 'AND',
      }),
    );

    const state = store.getState().documentSearch;
    expect(state.searchResults).toHaveLength(0);
    expect(state.totalResults).toBe(0);
  });

  it('resolves document details correctly', async () => {
    await store.dispatch(
      searchDocuments({
        keywords: ['motion'],
        operator: 'OR',
      }),
    );

    const state = store.getState().documentSearch;
    const firstResult = state.searchResults[0];

    expect(firstResult).toMatchObject({
      id: '100877-1-0',
      caseId: 100877,
      documentNumber: '1',
      attachmentNumber: 0,
      description: 'Mock document for 100877-1-0',
      caseName: 'Mock Case 100877',
      court: 'cacd',
    });
  });

  it('handles cache clearing', async () => {
    // Perform a search to populate cache
    await store.dispatch(
      searchDocuments({
        keywords: ['motion'],
        operator: 'OR',
      }),
    );

    // Clear cache
    await store.dispatch(clearDocumentSearchCache());

    const state = store.getState().documentSearch;
    expect(state.cacheSize).toBe(0);
  });

  it('maintains search state across multiple operations', async () => {
    // Load keywords
    await store.dispatch(loadDocumentKeywords());

    // First search
    store.dispatch(setSearchKeywords(['motion']));
    await store.dispatch(
      searchDocuments({
        keywords: ['motion'],
        operator: 'OR',
      }),
    );

    let state = store.getState().documentSearch;
    const firstSearchTime = state.lastSearchTime;
    expect(state.searchResults).toHaveLength(2);

    // Wait a bit to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Second search with different keywords
    store.dispatch(setSearchKeywords(['order']));
    await store.dispatch(
      searchDocuments({
        keywords: ['order'],
        operator: 'OR',
      }),
    );

    state = store.getState().documentSearch;
    expect(state.searchResults).toHaveLength(2);
    expect(state.lastSearchTime).toBeGreaterThan(firstSearchTime!);
  });
});
