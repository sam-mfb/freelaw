import { describe, it, expect } from 'vitest';
import { isRawRecapDocument, isRawDocketEntry, isRawCaseData } from '../guards';

describe('Type Guards', () => {
  describe('isRawRecapDocument', () => {
    it('should return true for valid recap document', () => {
      const validDoc = {
        id: 123,
        document_number: '1',
        is_available: true,
        filepath_local: '/path/to/file.pdf',
        description: 'Motion to Dismiss',
        page_count: 10,
        file_size: 1024,
        sha1: 'abc123',
      };

      expect(isRawRecapDocument(validDoc)).toBe(true);
    });

    it('should return true for minimal valid recap document', () => {
      const minimalDoc = {
        id: 123,
        document_number: '1',
        is_available: false,
      };

      expect(isRawRecapDocument(minimalDoc)).toBe(true);
    });

    it('should return false for non-object values', () => {
      expect(isRawRecapDocument(null)).toBe(false);
      expect(isRawRecapDocument(undefined)).toBe(false);
      expect(isRawRecapDocument('')).toBe(false);
      expect(isRawRecapDocument(123)).toBe(false);
      expect(isRawRecapDocument([])).toBe(false);
    });

    it('should return false when required fields are missing', () => {
      expect(isRawRecapDocument({ document_number: '1', is_available: true })).toBe(false);
      expect(isRawRecapDocument({ id: 123, is_available: true })).toBe(false);
      expect(isRawRecapDocument({ id: 123, document_number: '1' })).toBe(false);
    });

    it('should return false when required fields have wrong types', () => {
      expect(isRawRecapDocument({ id: '123', document_number: '1', is_available: true })).toBe(
        false,
      );
      expect(isRawRecapDocument({ id: 123, document_number: 1, is_available: true })).toBe(false);
      expect(isRawRecapDocument({ id: 123, document_number: '1', is_available: 'true' })).toBe(
        false,
      );
    });

    it('should return false when optional fields have wrong types', () => {
      const baseDoc = { id: 123, document_number: '1', is_available: true };

      expect(isRawRecapDocument({ ...baseDoc, filepath_local: 123 })).toBe(false);
      expect(isRawRecapDocument({ ...baseDoc, description: 123 })).toBe(false);
      expect(isRawRecapDocument({ ...baseDoc, page_count: '10' })).toBe(false);
      expect(isRawRecapDocument({ ...baseDoc, file_size: '1024' })).toBe(false);
      expect(isRawRecapDocument({ ...baseDoc, sha1: 123 })).toBe(false);
    });

    it('should accept null for page_count and file_size', () => {
      const docWithNulls = {
        id: 123,
        document_number: '1',
        is_available: true,
        page_count: null,
        file_size: null,
      };

      expect(isRawRecapDocument(docWithNulls)).toBe(true);
    });
  });

  describe('isRawDocketEntry', () => {
    it('should return true for valid docket entry', () => {
      const validEntry = {
        id: 1,
        date_entered: '2023-01-15',
        recap_documents: [
          {
            id: 123,
            document_number: '1',
            is_available: true,
          },
        ],
      };

      expect(isRawDocketEntry(validEntry)).toBe(true);
    });

    it('should return true for minimal valid docket entry', () => {
      const minimalEntry = {
        id: 1,
      };

      expect(isRawDocketEntry(minimalEntry)).toBe(true);
    });

    it('should return true for entry without recap_documents', () => {
      const entryWithoutDocs = {
        id: 1,
        date_entered: '2023-01-15',
      };

      expect(isRawDocketEntry(entryWithoutDocs)).toBe(true);
    });

    it('should return false for non-object values', () => {
      expect(isRawDocketEntry(null)).toBe(false);
      expect(isRawDocketEntry(undefined)).toBe(false);
      expect(isRawDocketEntry('')).toBe(false);
      expect(isRawDocketEntry(123)).toBe(false);
      expect(isRawDocketEntry([])).toBe(false);
    });

    it('should return false when id is missing or wrong type', () => {
      expect(isRawDocketEntry({})).toBe(false);
      expect(isRawDocketEntry({ id: '1' })).toBe(false);
    });

    it('should return false when date_entered has wrong type', () => {
      expect(isRawDocketEntry({ id: 1, date_entered: 123 })).toBe(false);
    });

    it('should return false when recap_documents is not an array', () => {
      expect(isRawDocketEntry({ id: 1, recap_documents: {} })).toBe(false);
      expect(isRawDocketEntry({ id: 1, recap_documents: 'docs' })).toBe(false);
    });

    it('should return false when recap_documents contains invalid documents', () => {
      const entryWithInvalidDocs = {
        id: 1,
        recap_documents: [
          { id: 123, document_number: '1', is_available: true },
          { id: '456', document_number: '2', is_available: true }, // Invalid id type
        ],
      };

      expect(isRawDocketEntry(entryWithInvalidDocs)).toBe(false);
    });
  });

  describe('isRawCaseData', () => {
    it('should return true for valid case data', () => {
      const validCase = {
        id: 12345,
        case_name: 'Smith v. Jones',
        case_name_short: 'Smith',
        court: 'kyed',
        date_filed: '2023-01-15',
        date_terminated: '2023-12-01',
        docket_entries: [
          {
            id: 1,
            recap_documents: [
              {
                id: 123,
                document_number: '1',
                is_available: true,
              },
            ],
          },
        ],
      };

      expect(isRawCaseData(validCase)).toBe(true);
    });

    it('should return true for minimal valid case data', () => {
      const minimalCase = {
        id: 12345,
      };

      expect(isRawCaseData(minimalCase)).toBe(true);
    });

    it('should return true for case without docket_entries', () => {
      const caseWithoutEntries = {
        id: 12345,
        case_name: 'Smith v. Jones',
        court: 'kyed',
      };

      expect(isRawCaseData(caseWithoutEntries)).toBe(true);
    });

    it('should return false for non-object values', () => {
      expect(isRawCaseData(null)).toBe(false);
      expect(isRawCaseData(undefined)).toBe(false);
      expect(isRawCaseData('')).toBe(false);
      expect(isRawCaseData(123)).toBe(false);
      expect(isRawCaseData([])).toBe(false);
    });

    it('should return false when id is missing or wrong type', () => {
      expect(isRawCaseData({})).toBe(false);
      expect(isRawCaseData({ id: '12345' })).toBe(false);
    });

    it('should return false when optional string fields have wrong type', () => {
      const baseCase = { id: 12345 };

      expect(isRawCaseData({ ...baseCase, case_name: 123 })).toBe(false);
      expect(isRawCaseData({ ...baseCase, case_name_short: [] })).toBe(false);
      expect(isRawCaseData({ ...baseCase, court: {} })).toBe(false);
      expect(isRawCaseData({ ...baseCase, date_filed: 20230115 })).toBe(false);
      expect(isRawCaseData({ ...baseCase, date_terminated: true })).toBe(false);
    });

    it('should return false when docket_entries is not an array', () => {
      expect(isRawCaseData({ id: 12345, docket_entries: {} })).toBe(false);
      expect(isRawCaseData({ id: 12345, docket_entries: 'entries' })).toBe(false);
    });

    it('should return false when docket_entries contains invalid entries', () => {
      const caseWithInvalidEntries = {
        id: 12345,
        docket_entries: [
          { entry_number: 1 },
          { entry_number: '2' }, // Invalid entry_number type
        ],
      };

      expect(isRawCaseData(caseWithInvalidEntries)).toBe(false);
    });
  });
});
