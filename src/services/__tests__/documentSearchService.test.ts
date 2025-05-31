import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDocumentSearchService } from '../documentSearchService';
import type { DocumentSearchService } from '../documentSearchService';

// Mock fetch globally
const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
global.fetch = mockFetch;

describe('DocumentSearchService', () => {
  let service: DocumentSearchService;

  beforeEach(() => {
    service = createDocumentSearchService();
    vi.clearAllMocks();
  });

  it('should load keywords from server', async () => {
    const mockKeywords = { keywords: ['motion', 'deposition', 'order'] };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockKeywords),
    } as Response);

    const keywords = await service.loadKeywords();

    expect(keywords).toEqual(['motion', 'deposition', 'order']);
    expect(global.fetch).toHaveBeenCalledWith('/data/document-search/keywords.json');
  });

  it('should cache keywords after first load', async () => {
    const mockKeywords = { keywords: ['motion', 'deposition', 'order'] };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockKeywords),
    } as Response);

    // First call
    const keywords1 = await service.loadKeywords();
    // Second call should use cache
    const keywords2 = await service.loadKeywords();

    expect(keywords1).toEqual(keywords2);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle keywords loading error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(service.loadKeywords()).rejects.toThrow('Failed to load keywords: Not Found');
  });

  it('should search by single keyword', async () => {
    const mockResult = {
      keyword: 'motion',
      documentIds: ['100877-1-0', '234561-5-0'],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    } as Response);

    const results = await service.searchByKeyword('motion');

    expect(results).toEqual(['100877-1-0', '234561-5-0']);
    expect(global.fetch).toHaveBeenCalledWith('/data/document-search/keywords/motion.json');
  });

  it('should return empty array for non-existent keyword', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const results = await service.searchByKeyword('nonexistent');

    expect(results).toEqual([]);
  });

  it('should handle keyword search error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(service.searchByKeyword('error')).rejects.toThrow(
      "Failed to load keyword 'error': Internal Server Error",
    );
  });

  it('should cache keyword results', async () => {
    const mockResult = { keyword: 'motion', documentIds: ['100877-1-0'] };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    } as Response);

    // First call
    await service.searchByKeyword('motion');

    // Second call should use cache
    const results = await service.searchByKeyword('motion');

    expect(results).toEqual(['100877-1-0']);
    expect(global.fetch).toHaveBeenCalledTimes(1); // Only called once
  });

  it('should handle multiple keyword search with OR operator', async () => {
    // Mock responses for multiple keywords
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            keyword: 'motion',
            documentIds: ['100877-1-0', '234561-5-0'],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            keyword: 'summary',
            documentIds: ['234561-5-0', '789012-3-0'],
          }),
      } as Response);

    const results = await service.searchByMultipleKeywords(['motion', 'summary'], 'OR');

    // Should contain all unique document IDs
    expect(results).toEqual(expect.arrayContaining(['100877-1-0', '234561-5-0', '789012-3-0']));
    expect(results).toHaveLength(3);
  });

  it('should handle multiple keyword search with AND operator', async () => {
    // Mock responses for multiple keywords
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            keyword: 'motion',
            documentIds: ['100877-1-0', '234561-5-0', '789012-3-0'],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            keyword: 'summary',
            documentIds: ['100877-1-0', '789012-3-0'],
          }),
      } as Response);

    const results = await service.searchByMultipleKeywords(['motion', 'summary'], 'AND');

    // Should only contain documents that appear in both results
    expect(results).toEqual(['100877-1-0', '789012-3-0']);
  });

  it('should return empty array for empty keywords', async () => {
    const results = await service.searchByMultipleKeywords([], 'OR');
    expect(results).toEqual([]);
  });

  it('should handle single keyword in multiple search', async () => {
    const mockResult = {
      keyword: 'motion',
      documentIds: ['100877-1-0'],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    } as Response);

    const results = await service.searchByMultipleKeywords(['motion'], 'OR');
    expect(results).toEqual(['100877-1-0']);
  });

  it('should resolve document IDs to full documents', async () => {
    const documentIds = ['100877-1-0', '234561-5-0'];
    const documents = await service.resolveDocuments(documentIds);

    expect(documents).toHaveLength(2);
    expect(documents[0]).toMatchObject({
      id: '100877-1-0',
      caseId: 100877,
      documentNumber: '1',
      attachmentNumber: 0,
      description: expect.any(String),
      caseName: expect.any(String),
      court: expect.any(String),
    });
  });

  it('should cache resolved documents', async () => {
    const documentIds = ['100877-1-0'];

    // First call
    const docs1 = await service.resolveDocuments(documentIds);

    // Second call should use cache
    const docs2 = await service.resolveDocuments(documentIds);

    expect(docs1).toEqual(docs2);
    // Both should return the same object reference from cache
    expect(docs1[0]).toBe(docs2[0]);
  });

  it('should clear all caches', async () => {
    // Load some data into caches
    const mockKeywords = { keywords: ['motion'] };
    const mockResult = { keyword: 'motion', documentIds: ['100877-1-0'] };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockKeywords),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      } as Response);

    await service.loadKeywords();
    await service.searchByKeyword('motion');
    await service.resolveDocuments(['100877-1-0']);

    // Clear cache
    service.clearCache();

    // Should fetch again after cache clear
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockKeywords),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      } as Response);

    await service.loadKeywords();
    await service.searchByKeyword('motion');

    // Fetch should have been called again for both
    expect(global.fetch).toHaveBeenCalledTimes(4); // 2 before clear, 2 after
  });
});
