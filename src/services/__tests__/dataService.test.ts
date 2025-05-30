import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  loadCaseIndex, 
  loadCaseDocuments, 
  loadFullCase,
  clearCache,
  createDataService 
} from '../dataService';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DataService - Module Functions', () => {
  beforeEach(() => {
    clearCache();
    mockFetch.mockClear();
  });

  test('loadCaseIndex - success', async () => {
    const mockIndex = {
      cases: [{ id: 1, name: 'Test Case' }],
      courts: [{ code: 'test', name: 'Test Court' }],
      dateRange: { min: '2020-01-01', max: '2023-12-31' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIndex,
    });

    const result = await loadCaseIndex();
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

    await loadCaseIndex();
    await loadCaseIndex(); // Second call

    expect(mockFetch).toHaveBeenCalledTimes(1); // Should use cache
  });

  test('loadCaseIndex - handles error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(loadCaseIndex()).rejects.toThrow('Failed to load case index: Not Found');
  });

  test('loadCaseDocuments - success', async () => {
    const mockDocs = [{ id: 1, description: 'Test Document' }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocs,
    });

    const result = await loadCaseDocuments(123);
    expect(result).toEqual(mockDocs);
    expect(mockFetch).toHaveBeenCalledWith('/data/documents/123.json');
  });

  test('loadCaseDocuments - caches result', async () => {
    const mockDocs = [{ id: 1, description: 'Test Document' }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocs,
    });

    await loadCaseDocuments(123);
    await loadCaseDocuments(123); // Second call

    expect(mockFetch).toHaveBeenCalledTimes(1); // Should use cache
  });

  test('loadCaseDocuments - handles error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(loadCaseDocuments(123)).rejects.toThrow('Failed to load documents for case 123');
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
              filepath_local: 'path/to/doc.pdf'
            },
            {
              id: 2,
              document_number: '2',
              is_available: false,
              filepath_local: null
            }
          ]
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRawCase,
    });

    const result = await loadFullCase(123);
    
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
      docket_entries: []
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRawCase,
    });

    const result = await loadFullCase(123);
    
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
    const mockDocs = [{ id: 1, description: 'Test' }];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockIndex,
    });

    // Load data to populate cache
    await loadCaseIndex();
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDocs,
    });
    
    await loadCaseDocuments(123);

    // Clear cache
    clearCache();

    // Should fetch again after cache clear
    await loadCaseIndex();
    await loadCaseDocuments(123);

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
      cases: [{ id: 1, name: 'Test Case' }],
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