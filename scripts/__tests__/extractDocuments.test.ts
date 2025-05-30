import { describe, it, expect } from 'vitest';
import type { RawCaseData } from '../../src/types/index.types';
import { extractDocuments } from '../extractDocuments';

describe('extractDocuments', () => {
  it('should extract available documents with local files', () => {
    const caseData: RawCaseData = {
      id: 12345,
      docket_entries: [
        {
          id: 1,
          date_entered: '2023-01-15',
          recap_documents: [
            {
              id: 101,
              document_number: '1',
              description: 'Motion to Dismiss',
              is_available: true,
              filepath_local: '/path/to/doc1.pdf',
              page_count: 10,
              file_size: 102400,
              sha1: 'abc123',
            },
          ],
        },
      ],
    };

    const documents = extractDocuments(caseData);

    expect(documents).toHaveLength(1);
    expect(documents[0]).toEqual({
      id: 101,
      entryNumber: 1,
      documentNumber: '1',
      description: 'Motion to Dismiss',
      dateFiled: '2023-01-15',
      pageCount: 10,
      fileSize: 102400,
      filePath: '/path/to/doc1.pdf',
      sha1: 'abc123',
    });
  });

  it('should only include documents that are available with local files', () => {
    const caseData: RawCaseData = {
      id: 12345,
      docket_entries: [
        {
          id: 1,
          recap_documents: [
            {
              id: 101,
              document_number: '1',
              is_available: true,
              filepath_local: '/path/to/doc1.pdf',
            },
            {
              id: 102,
              document_number: '2',
              is_available: true,
              // No filepath_local - should be excluded
            },
            {
              id: 103,
              document_number: '3',
              is_available: false,
              filepath_local: '/path/to/doc3.pdf',
              // Not available - should be excluded
            },
          ],
        },
      ],
    };

    const documents = extractDocuments(caseData);

    expect(documents).toHaveLength(1);
    expect(documents[0].id).toBe(101);
  });

  it('should handle missing optional fields with defaults', () => {
    const caseData: RawCaseData = {
      id: 12345,
      docket_entries: [
        {
          id: 1,
          // No date_entered
          recap_documents: [
            {
              id: 101,
              document_number: '1',
              // No description
              is_available: true,
              filepath_local: '/path/to/doc1.pdf',
              // No page_count, file_size, or sha1
            },
          ],
        },
      ],
    };

    const documents = extractDocuments(caseData);

    expect(documents).toHaveLength(1);
    expect(documents[0]).toEqual({
      id: 101,
      entryNumber: 1,
      documentNumber: '1',
      description: '',
      dateFiled: '',
      pageCount: null,
      fileSize: null,
      filePath: '/path/to/doc1.pdf',
      sha1: '',
    });
  });

  it('should return empty array when no docket_entries exist', () => {
    const caseData: RawCaseData = {
      id: 12345,
    };

    const documents = extractDocuments(caseData);

    expect(documents).toEqual([]);
  });

  it('should handle entries without recap_documents', () => {
    const caseData: RawCaseData = {
      id: 12345,
      docket_entries: [
        {
          id: 1,
          // No recap_documents
        },
        {
          id: 2,
          recap_documents: [],
        },
      ],
    };

    const documents = extractDocuments(caseData);

    expect(documents).toEqual([]);
  });

  it('should extract documents from multiple entries', () => {
    const caseData: RawCaseData = {
      id: 12345,
      docket_entries: [
        {
          id: 1,
          date_entered: '2023-01-15',
          recap_documents: [
            {
              id: 101,
              document_number: '1',
              is_available: true,
              filepath_local: '/path/to/doc1.pdf',
            },
          ],
        },
        {
          id: 5,
          date_entered: '2023-02-20',
          recap_documents: [
            {
              id: 501,
              document_number: '1',
              is_available: true,
              filepath_local: '/path/to/doc2.pdf',
            },
            {
              id: 502,
              document_number: '2',
              is_available: true,
              filepath_local: '/path/to/doc3.pdf',
            },
          ],
        },
      ],
    };

    const documents = extractDocuments(caseData);

    expect(documents).toHaveLength(3);
    expect(documents.map((d) => d.id)).toEqual([101, 501, 502]);
    expect(documents.map((d) => d.entryNumber)).toEqual([1, 5, 5]);
  });
});
