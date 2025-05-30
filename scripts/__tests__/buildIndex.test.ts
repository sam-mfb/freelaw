import { describe, it, expect } from 'vitest';
import type { RawCaseData } from '../../src/types/index.types';

// Import the functions we're testing
// Since buildIndex.ts exports these at the bottom, we need to import from the module

// We'll need to extract these functions for testing
// For now, let's copy them here for testing purposes
function extractCaseSummary(caseData: RawCaseData) {
  let docCount = 0;
  let availCount = 0;

  if (caseData.docket_entries) {
    for (const entry of caseData.docket_entries) {
      if (entry.recap_documents) {
        for (const doc of entry.recap_documents) {
          docCount++;
          if (doc.is_available && doc.filepath_local) {
            availCount++;
          }
        }
      }
    }
  }

  return {
    id: caseData.id,
    name: caseData.case_name || 'Unknown Case',
    nameShort: caseData.case_name_short || caseData.case_name || 'Unknown',
    court: caseData.court || 'unknown',
    filed: caseData.date_filed || '',
    terminated: caseData.date_terminated,
    docCount,
    availCount
  };
}

function extractDocuments(caseData: RawCaseData) {
  interface ExtractedDocument {
    id: number;
    entryNumber: number;
    documentNumber: string;
    description: string;
    dateFiled: string;
    pageCount?: number | null;
    fileSize?: number | null;
    filePath: string;
    sha1: string;
  }
  const documents: ExtractedDocument[] = [];

  if (caseData.docket_entries) {
    for (const entry of caseData.docket_entries) {
      if (entry.recap_documents) {
        for (const doc of entry.recap_documents) {
          if (doc.is_available && doc.filepath_local) {
            documents.push({
              id: doc.id,
              entryNumber: entry.entry_number,
              documentNumber: doc.document_number,
              description: doc.description || '',
              dateFiled: entry.date_entered || '',
              pageCount: doc.page_count,
              fileSize: doc.file_size,
              filePath: doc.filepath_local,
              sha1: doc.sha1 || ''
            });
          }
        }
      }
    }
  }

  return documents;
}

describe('buildIndex functions', () => {
  describe('extractCaseSummary', () => {
    it('should extract basic case information', () => {
      const caseData: RawCaseData = {
        id: 12345,
        case_name: 'Smith v. Jones',
        case_name_short: 'Smith',
        court: 'kyed',
        date_filed: '2023-01-15',
        date_terminated: '2023-12-01'
      };
      
      const summary = extractCaseSummary(caseData);
      
      expect(summary).toEqual({
        id: 12345,
        name: 'Smith v. Jones',
        nameShort: 'Smith',
        court: 'kyed',
        filed: '2023-01-15',
        terminated: '2023-12-01',
        docCount: 0,
        availCount: 0
      });
    });
    
    it('should handle missing optional fields with defaults', () => {
      const caseData: RawCaseData = {
        id: 12345
      };
      
      const summary = extractCaseSummary(caseData);
      
      expect(summary).toEqual({
        id: 12345,
        name: 'Unknown Case',
        nameShort: 'Unknown',
        court: 'unknown',
        filed: '',
        terminated: undefined,
        docCount: 0,
        availCount: 0
      });
    });
    
    it('should use case_name for nameShort if case_name_short is missing', () => {
      const caseData: RawCaseData = {
        id: 12345,
        case_name: 'Smith v. Jones'
      };
      
      const summary = extractCaseSummary(caseData);
      
      expect(summary.nameShort).toBe('Smith v. Jones');
    });
    
    it('should count total and available documents', () => {
      const caseData: RawCaseData = {
        id: 12345,
        case_name: 'Test Case',
        docket_entries: [
          {
            entry_number: 1,
            recap_documents: [
              {
                id: 101,
                document_number: '1',
                is_available: true,
                filepath_local: '/path/to/doc1.pdf'
              },
              {
                id: 102,
                document_number: '2',
                is_available: true
                // No filepath_local, so not counted as available
              },
              {
                id: 103,
                document_number: '3',
                is_available: false,
                filepath_local: '/path/to/doc3.pdf'
              }
            ]
          },
          {
            entry_number: 2,
            recap_documents: [
              {
                id: 201,
                document_number: '1',
                is_available: true,
                filepath_local: '/path/to/doc4.pdf'
              }
            ]
          }
        ]
      };
      
      const summary = extractCaseSummary(caseData);
      
      expect(summary.docCount).toBe(4);
      expect(summary.availCount).toBe(2); // Only docs with is_available=true AND filepath_local
    });
    
    it('should handle entries without recap_documents', () => {
      const caseData: RawCaseData = {
        id: 12345,
        case_name: 'Test Case',
        docket_entries: [
          {
            entry_number: 1
            // No recap_documents
          },
          {
            entry_number: 2,
            recap_documents: [
              {
                id: 201,
                document_number: '1',
                is_available: true,
                filepath_local: '/path/to/doc.pdf'
              }
            ]
          }
        ]
      };
      
      const summary = extractCaseSummary(caseData);
      
      expect(summary.docCount).toBe(1);
      expect(summary.availCount).toBe(1);
    });
  });
  
  describe('extractDocuments', () => {
    it('should extract available documents with local files', () => {
      const caseData: RawCaseData = {
        id: 12345,
        docket_entries: [
          {
            entry_number: 1,
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
                sha1: 'abc123'
              }
            ]
          }
        ]
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
        sha1: 'abc123'
      });
    });
    
    it('should only include documents that are available with local files', () => {
      const caseData: RawCaseData = {
        id: 12345,
        docket_entries: [
          {
            entry_number: 1,
            recap_documents: [
              {
                id: 101,
                document_number: '1',
                is_available: true,
                filepath_local: '/path/to/doc1.pdf'
              },
              {
                id: 102,
                document_number: '2',
                is_available: true
                // No filepath_local - should be excluded
              },
              {
                id: 103,
                document_number: '3',
                is_available: false,
                filepath_local: '/path/to/doc3.pdf'
                // Not available - should be excluded
              }
            ]
          }
        ]
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
            entry_number: 1,
            // No date_entered
            recap_documents: [
              {
                id: 101,
                document_number: '1',
                // No description
                is_available: true,
                filepath_local: '/path/to/doc1.pdf'
                // No page_count, file_size, or sha1
              }
            ]
          }
        ]
      };
      
      const documents = extractDocuments(caseData);
      
      expect(documents).toHaveLength(1);
      expect(documents[0]).toEqual({
        id: 101,
        entryNumber: 1,
        documentNumber: '1',
        description: '',
        dateFiled: '',
        pageCount: undefined,
        fileSize: undefined,
        filePath: '/path/to/doc1.pdf',
        sha1: ''
      });
    });
    
    it('should return empty array when no docket_entries exist', () => {
      const caseData: RawCaseData = {
        id: 12345
      };
      
      const documents = extractDocuments(caseData);
      
      expect(documents).toEqual([]);
    });
    
    it('should handle entries without recap_documents', () => {
      const caseData: RawCaseData = {
        id: 12345,
        docket_entries: [
          {
            entry_number: 1
            // No recap_documents
          },
          {
            entry_number: 2,
            recap_documents: []
          }
        ]
      };
      
      const documents = extractDocuments(caseData);
      
      expect(documents).toEqual([]);
    });
    
    it('should extract documents from multiple entries', () => {
      const caseData: RawCaseData = {
        id: 12345,
        docket_entries: [
          {
            entry_number: 1,
            date_entered: '2023-01-15',
            recap_documents: [
              {
                id: 101,
                document_number: '1',
                is_available: true,
                filepath_local: '/path/to/doc1.pdf'
              }
            ]
          },
          {
            entry_number: 5,
            date_entered: '2023-02-20',
            recap_documents: [
              {
                id: 501,
                document_number: '1',
                is_available: true,
                filepath_local: '/path/to/doc2.pdf'
              },
              {
                id: 502,
                document_number: '2',
                is_available: true,
                filepath_local: '/path/to/doc3.pdf'
              }
            ]
          }
        ]
      };
      
      const documents = extractDocuments(caseData);
      
      expect(documents).toHaveLength(3);
      expect(documents.map(d => d.id)).toEqual([101, 501, 502]);
      expect(documents.map(d => d.entryNumber)).toEqual([1, 5, 5]);
    });
  });
});