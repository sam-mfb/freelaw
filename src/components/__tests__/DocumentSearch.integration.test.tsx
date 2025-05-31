/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, it, expect, vi } from 'vitest';
import { createAppStore } from '../../store';
import { DocumentSearch } from '../DocumentSearch';
import type { Document } from '../../types/document.types';

describe('DocumentSearch Integration', () => {
  it('should complete full search workflow', async () => {
    const user = userEvent.setup();

    // Create store with mock services
    const store = createAppStore({
      dataService: {
        loadCaseIndex: vi.fn().mockResolvedValue({ cases: [], courts: [], dateRange: { min: '', max: '' } }),
        loadCaseDocuments: vi.fn().mockImplementation((caseId: number) => {
          // Return mock documents based on case ID
          if (caseId === 100877) {
            return Promise.resolve([
              {
                id: 1,
                entryNumber: 1,
                documentNumber: '1',
                attachmentNumber: 0,
                description: 'Motion to Dismiss',
                dateFiled: '2023-01-01',
                pageCount: 10,
                fileSize: 1000,
                filePath: '/path/to/doc1.pdf',
                sha1: 'abc123',
                caseId: 100877,
                caseName: 'Test Case 1',
                court: 'test-court',
                searchId: '100877-1-0',
              },
            ]);
          }
          return Promise.resolve([]);
        }),
      },
      documentSearchService: {
        loadKeywords: vi.fn().mockResolvedValue(['motion', 'deposition', 'order']),
        searchByKeyword: vi.fn().mockImplementation((keyword: string) => {
          const results: Record<string, string[]> = {
            motion: ['100877-1-0', '234561-3-0'],
            deposition: ['567890-2-0'],
          };
          return Promise.resolve(results[keyword] || []);
        }),
        searchByMultipleKeywords: vi.fn().mockImplementation((keywords: string[], operator: string) => {
          const results: Record<string, string[]> = {
            motion: ['100877-1-0', '234561-3-0'],
            deposition: ['567890-2-0'],
          };

          if (operator === 'OR') {
            const allIds = new Set<string>();
            keywords.forEach((keyword: string) => {
              const ids = results[keyword] || [];
              ids.forEach((id) => allIds.add(id));
            });
            return Promise.resolve(Array.from(allIds));
          } else {
            // AND logic - only return IDs that appear for ALL keywords
            const firstKeywordIds = results[keywords[0]] || [];
            return Promise.resolve(
              firstKeywordIds.filter((id) =>
                keywords.every((keyword: string) => (results[keyword] || []).includes(id)),
              ),
            );
          }
        }),
        resolveDocuments: vi.fn().mockImplementation((ids: string[]) => {
          return Promise.resolve(
            ids.map((id) => {
              const [caseId, docNum, attachNum] = id.split('-');
              return {
                id: parseInt(id.split('-')[0]),
                searchId: id,
                caseId: parseInt(caseId),
                documentNumber: docNum,
                attachmentNumber: attachNum === 'null' ? null : parseInt(attachNum),
                description: `Mock document for ${id}`,
                caseName: `Mock Case ${caseId}`,
                court: 'cacd',
                dateFiled: '2023-01-01',
                entryNumber: 1,
                pageCount: 10,
                fileSize: 1024,
                filePath: null,
                sha1: 'mock-sha1',
              } as Document;
            }),
          );
        }),
        clearCache: vi.fn(),
      },
    });

    render(
      <Provider store={store}>
        <DocumentSearch />
      </Provider>,
    );

    // Initially should show the search interface
    expect(screen.getByText('Document Search')).toBeInTheDocument();

    // Should display available keywords
    await waitFor(() => {
      expect(screen.getByText('motion')).toBeInTheDocument();
      expect(screen.getByText('deposition')).toBeInTheDocument();
    });

    // Add first keyword by clicking on it
    await user.click(screen.getByText('motion'));
    expect(screen.getByText('motion', { selector: '.keyword-tag' })).toBeInTheDocument();

    // Type to search for second keyword
    const input = screen.getByPlaceholderText('Add keyword (e.g., motion, deposition)...');
    await user.type(input, 'dep');

    // Should show filtered suggestions
    await waitFor(() => {
      expect(screen.getByText('deposition', { selector: '.keyword-suggestion' })).toBeInTheDocument();
    });

    // Click on the suggestion
    await user.click(screen.getByText('deposition', { selector: '.keyword-suggestion' }));

    // Should have both keywords selected
    expect(screen.getByText('motion', { selector: '.keyword-tag' })).toBeInTheDocument();
    expect(screen.getByText('deposition', { selector: '.keyword-tag' })).toBeInTheDocument();

    // Change operator to OR (already is OR by default, so no need to change)

    // Click search button
    const searchButton = screen.getByText('Search Documents');
    await user.click(searchButton);

    // Should show results
    await waitFor(() => {
      expect(screen.getByText('3 documents found')).toBeInTheDocument();
    });

    // Should display document information
    expect(screen.getByText('Mock document for 100877-1-0')).toBeInTheDocument();
  });
});