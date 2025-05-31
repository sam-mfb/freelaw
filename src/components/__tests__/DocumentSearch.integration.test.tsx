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
        loadDocumentSearchKeywords: vi.fn().mockResolvedValue(['motion', 'deposition']),
        searchDocumentsByMultipleKeywords: vi
          .fn()
          .mockImplementation((keywords: string[], operator: string) => {
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
        resolveDocumentIds: vi.fn().mockImplementation((ids: string[]) => {
          return Promise.resolve(
            ids.map((id) => {
              const [caseId, docNum, attachNum] = id.split('-');
              return {
                id: parseInt(id.split('-')[0]),
                searchId: id,
                caseId: parseInt(caseId),
                documentNumber: docNum,
                attachmentNumber: parseInt(attachNum),
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
      },
      documentSearchService: {
        loadKeywords: vi.fn().mockResolvedValue(['motion', 'deposition']),
        searchByMultipleKeywords: vi
          .fn()
          .mockImplementation((keywords: string[], operator: string) => {
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
                attachmentNumber: parseInt(attachNum),
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

    // 1. Activate search
    await user.click(screen.getByText('Search Documents'));

    // 2. Add keywords
    const keywordInput = screen.getByPlaceholderText(/Add keyword/);
    await user.type(keywordInput, 'motion');
    await user.click(screen.getByText('Add'));

    // 3. Search
    await user.click(screen.getByText('Search Documents'));

    // 4. Wait for results
    await waitFor(() => {
      expect(screen.getByText(/documents found/)).toBeInTheDocument();
    });

    // 5. Verify results displayed
    expect(screen.getByText('Mock document for 100877-1-0')).toBeInTheDocument();
  });
});
