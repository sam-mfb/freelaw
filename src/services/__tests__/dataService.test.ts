import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createDataService, dataService } from '../dataService';
import type { Document } from '../../types/document.types';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create valid document mocks
const createMockDocument = (overrides: Partial<Document> = {}): Document => ({
  id: 1,
  entryNumber: 1,
  documentNumber: '1',
  attachmentNumber: null,
  description: 'Test Document',
  dateFiled: '2023-01-01',
  pageCount: 10,
  fileSize: 1000,
  filePath: '/path/to/doc.pdf',
  sha1: 'abcd1234',
  caseId: 123,
  caseName: 'Test Case',
  court: 'test-court',
  searchId: '123-1-null',
  ...overrides,
});

describe('DataService - Default Instance', () => {
  beforeEach(() => {
    dataService.clearCache();
    mockFetch.mockClear();
  });

  test('loadCaseIndex - success', async () => {
    const mockIndex = {
      cases: [
        {
          id: 1,
          name: 'Test Case',
          nameShort: 'Test',
          court: 'test',
          filed: '2023-01-01',
          terminated: null,
          docCount: 5,
          availCount: 3,
        },
      ],
      courts: [{ code: 'test', name: 'Test Court' }],
      dateRange: { min: '2020-01-01', max: '2023-12-31' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIndex,
    });

    const result = await dataService.loadCaseIndex();
    expect(result).toEqual(mockIndex);
    expect(mockFetch).toHaveBeenCalledWith('/data/case-index.json');
  });

  test('loadCaseIndex - caches result', async () => {
    const mockIndex = {
      cases: [],
      courts: [],
      dateRange: { min: '', max: '' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIndex,
    });

    await dataService.loadCaseIndex();
    await dataService.loadCaseIndex(); // Second call

    expect(mockFetch).toHaveBeenCalledTimes(1); // Should use cache
  });

  test('loadCaseIndex - handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(dataService.loadCaseIndex()).rejects.toThrow(
      'Failed to load case index: Not Found',
    );
  });

  test('loadCaseIndex - handles invalid data format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'data' }),
    });

    await expect(dataService.loadCaseIndex()).rejects.toThrow(
      'Invalid case index format received from server',
    );
  });

  test('loadCaseDocuments - success', async () => {
    const mockDocs = [createMockDocument()];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocs,
    });

    const result = await dataService.loadCaseDocuments(123);
    expect(result).toEqual(mockDocs);
    expect(mockFetch).toHaveBeenCalledWith('/data/documents/123.json');
  });

  test('loadCaseDocuments - caches result', async () => {
    const mockDocs = [createMockDocument()];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocs,
    });

    await dataService.loadCaseDocuments(123);
    await dataService.loadCaseDocuments(123); // Second call

    expect(mockFetch).toHaveBeenCalledTimes(1); // Should use cache
  });

  test('loadCaseDocuments - handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(dataService.loadCaseDocuments(123)).rejects.toThrow(
      'Failed to load documents for case 123',
    );
  });

  test('loadCaseDocuments - handles invalid data format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'data' }),
    });

    await expect(dataService.loadCaseDocuments(123)).rejects.toThrow(
      'Invalid documents format received for case 123',
    );
  });

  test('loadFullCase - success', async () => {
    const mockRawCase = {
      id: 123,
      case_name: 'Test Case Name',
      case_name_short: 'Test Case',
      case_name_full: 'Test Case Full Name',
      court: 'nysb',
      docket_number: '1:23-cv-00001',
      date_filed: '2023-01-01',
      date_terminated: null,
      assigned_to_str: 'Judge Smith',
      docket_entries: [
        {
          id: 1,
          recap_documents: [
            {
              id: 1,
              document_number: '1',
              is_available: true,
              filepath_local: 'path/to/doc.pdf',
            },
            {
              id: 2,
              document_number: '2',
              is_available: false,
              filepath_local: null,
            },
          ],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRawCase,
    });

    const result = await dataService.loadFullCase(123);

    expect(result).toEqual({
      id: 123,
      caseName: 'Test Case Name',
      caseNameShort: 'Test Case',
      caseNameFull: 'Test Case Full Name',
      court: 'nysb',
      docketNumber: '1:23-cv-00001',
      dateFiled: '2023-01-01',
      dateTerminated: null,
      assignedTo: 'Judge Smith',
      documentCount: 1,
      availableDocumentCount: 1,
    });

    expect(mockFetch).toHaveBeenCalledWith('/data/docket-data/123.json');
  });

  test('loadFullCase - handles missing fields', async () => {
    const mockRawCase = {
      id: 123,
      docket_entries: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRawCase,
    });

    const result = await dataService.loadFullCase(123);

    expect(result).toEqual({
      id: 123,
      caseName: '',
      caseNameShort: '',
      caseNameFull: '',
      court: '',
      docketNumber: '',
      dateFiled: '',
      dateTerminated: null,
      assignedTo: 'Unknown',
      documentCount: 0,
      availableDocumentCount: 0,
    });
  });

  test('clearCache - clears all caches', async () => {
    const mockIndex = { cases: [], courts: [], dateRange: { min: '', max: '' } };
    const mockDocs = [createMockDocument()];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIndex,
    });

    // Load data to populate cache
    await dataService.loadCaseIndex();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocs,
    });

    await dataService.loadCaseDocuments(123);

    // Clear cache
    dataService.clearCache();

    // Should fetch again after cache clear
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIndex,
    });
    await dataService.loadCaseIndex();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocs,
    });
    await dataService.loadCaseDocuments(123);

    expect(mockFetch).toHaveBeenCalledTimes(4); // 2 initial + 2 after clear
  });
});

describe('DataService - Factory Function', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('creates isolated instances', async () => {
    const service1 = createDataService();
    const service2 = createDataService();

    const mockIndex = {
      cases: [
        {
          id: 1,
          name: 'Test Case',
          nameShort: 'Test',
          court: 'test',
          filed: '2023-01-01',
          terminated: null,
          docCount: 5,
          availCount: 3,
        },
      ],
      courts: [],
      dateRange: { min: '', max: '' },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockIndex,
    });

    await service1.loadCaseIndex();
    await service2.loadCaseIndex();

    // Each instance should make its own fetch
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('factory instance caching works independently', async () => {
    const service = createDataService();

    const mockIndex = {
      cases: [],
      courts: [],
      dateRange: { min: '', max: '' },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockIndex,
    });

    await service.loadCaseIndex();
    await service.loadCaseIndex(); // Second call

    expect(mockFetch).toHaveBeenCalledTimes(1); // Should use cache
  });

  test('caching reduces fetch calls', async () => {
    const service = createDataService();

    const mockIndex = {
      cases: [],
      courts: [],
      dateRange: { min: '', max: '' },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockIndex,
    });

    // First call should fetch
    await service.loadCaseIndex();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call should use cache
    await service.loadCaseIndex();
    expect(mockFetch).toHaveBeenCalledTimes(1); // No additional fetch

    // Same test for documents
    const mockDocs = [createMockDocument()];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocs,
    });

    await service.loadCaseDocuments(123);
    expect(mockFetch).toHaveBeenCalledTimes(2); // Index + documents

    await service.loadCaseDocuments(123);
    expect(mockFetch).toHaveBeenCalledTimes(2); // Still 2, used cache
  });

  test('factory clearCache works independently', async () => {
    const service = createDataService();

    const mockIndex = { cases: [], courts: [], dateRange: { min: '', max: '' } };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockIndex,
    });

    await service.loadCaseIndex();
    service.clearCache();
    await service.loadCaseIndex();

    expect(mockFetch).toHaveBeenCalledTimes(2); // Should fetch again after clear
  });
});

describe('DataService - Error Handling', () => {
  beforeEach(() => {
    dataService.clearCache();
    mockFetch.mockClear();
  });

  test('loadCaseIndex - handles malformed JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token in JSON');
      },
    });

    await expect(dataService.loadCaseIndex()).rejects.toThrow(
      'Failed to parse JSON response: Unexpected token in JSON',
    );
  });

  test('loadCaseDocuments - handles malformed JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError('Invalid JSON');
      },
    });

    await expect(dataService.loadCaseDocuments(123)).rejects.toThrow(
      'Failed to parse JSON response: Invalid JSON',
    );
  });

  test('loadFullCase - handles malformed JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Malformed response');
      },
    });

    await expect(dataService.loadFullCase(123)).rejects.toThrow(
      'Failed to parse JSON response: Malformed response',
    );
  });

  test('loadCaseIndex - handles network errors with status text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(dataService.loadCaseIndex()).rejects.toThrow(
      'Failed to load case index: Not Found',
    );
  });

  test('loadCaseDocuments - handles network errors with status text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    await expect(dataService.loadCaseDocuments(123)).rejects.toThrow(
      'Failed to load documents for case 123: Internal Server Error',
    );
  });

  test('loadFullCase - handles network errors with status text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable',
    });

    await expect(dataService.loadFullCase(123)).rejects.toThrow(
      'Failed to load case 123: Service Unavailable',
    );
  });

  test('loadCaseIndex - handles fetch rejections', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(dataService.loadCaseIndex()).rejects.toThrow('Network error');
  });

  test('loadCaseDocuments - handles fetch rejections', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection timeout'));

    await expect(dataService.loadCaseDocuments(123)).rejects.toThrow('Connection timeout');
  });

  test('loadFullCase - handles fetch rejections', async () => {
    mockFetch.mockRejectedValueOnce(new Error('DNS resolution failed'));

    await expect(dataService.loadFullCase(123)).rejects.toThrow('DNS resolution failed');
  });
});
