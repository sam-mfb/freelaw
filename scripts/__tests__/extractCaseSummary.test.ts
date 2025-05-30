import { describe, it, expect } from 'vitest';
import type { RawCaseData } from '../../src/types/index.types';
import { extractCaseSummary } from '../extractCaseSummary';

describe('extractCaseSummary', () => {
  it('should extract basic case information', () => {
    const caseData: RawCaseData = {
      id: 12345,
      case_name: 'Smith v. Jones',
      case_name_short: 'Smith',
      court: 'kyed',
      date_filed: '2023-01-15',
      date_terminated: '2023-12-01',
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
      availCount: 0,
    });
  });

  it('should handle missing optional fields with defaults', () => {
    const caseData: RawCaseData = {
      id: 12345,
    };

    const summary = extractCaseSummary(caseData);

    expect(summary).toEqual({
      id: 12345,
      name: 'Unknown Case',
      nameShort: 'Unknown',
      court: 'unknown',
      filed: '',
      terminated: null,
      docCount: 0,
      availCount: 0,
    });
  });

  it('should use case_name for nameShort if case_name_short is missing', () => {
    const caseData: RawCaseData = {
      id: 12345,
      case_name: 'Smith v. Jones',
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
              // No filepath_local, so not counted as available
            },
            {
              id: 103,
              document_number: '3',
              is_available: false,
              filepath_local: '/path/to/doc3.pdf',
            },
          ],
        },
        {
          id: 2,
          recap_documents: [
            {
              id: 201,
              document_number: '1',
              is_available: true,
              filepath_local: '/path/to/doc4.pdf',
            },
          ],
        },
      ],
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
          id: 1,
          // No recap_documents
        },
        {
          id: 2,
          recap_documents: [
            {
              id: 201,
              document_number: '1',
              is_available: true,
              filepath_local: '/path/to/doc.pdf',
            },
          ],
        },
      ],
    };

    const summary = extractCaseSummary(caseData);

    expect(summary.docCount).toBe(1);
    expect(summary.availCount).toBe(1);
  });
});
