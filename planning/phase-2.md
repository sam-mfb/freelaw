# Phase 2: Document Search Data Service

## Objective
Extend the data service layer to support document-level search operations, including keyword loading, document ID resolution, and search result enrichment.

## Deliverables
1. **Enhanced `dataService.ts`** - Add document search methods
2. **New service `documentSearchService.ts`** - Dedicated document search functionality
3. **Document resolution utilities** - Convert document IDs to full document metadata
4. **Caching strategy** - Efficient keyword file loading and caching

## Service Interface

### Core Methods

```typescript
// Add to src/services/dataService.ts
export interface DocumentSearchMethods {
  // Load master keywords list (kept in memory)
  loadDocumentSearchKeywords(): Promise<string[]>;
  
  // Search for documents by keyword (lazy loads keyword file)
  searchDocumentsByKeyword(keyword: string): Promise<string[]>;
  
  // Convert document IDs to full document objects
  resolveDocumentIds(documentIds: string[]): Promise<SearchableDocument[]>;
  
  // Clear document search cache
  clearDocumentSearchCache(): void;
}

// Extended data service interface
export interface ExtendedDataService extends DataService, DocumentSearchMethods {}
```

### Data Types

Add to `src/types/document.types.ts`:

```typescript
export interface DocumentSearchKeywords {
  keywords: string[];
}

export interface DocumentSearchResult {
  keyword: string;
  documentIds: string[];
}

export interface SearchableDocument {
  id: string;              // "caseId-docNum-attachNum"
  caseId: number;
  documentNumber: string;
  attachmentNumber: number;
  description: string;
  caseName: string;
  court: string;
  dateCreated?: string;
  filePath?: string;
  pageCount?: number;
  fileSize?: number;
}

export interface DocumentSearchCache {
  keywords: string[] | null;
  keywordFiles: Map<string, string[]>;
  resolvedDocuments: Map<string, SearchableDocument>;
}
```

## Implementation

### 1. Enhanced dataService.ts

```typescript
// Add to existing createDataService factory
export function createDataService() {
  let localCaseIndex: CaseIndex | null = null;
  const localDocumentCache = new Map<number, Document[]>();
  
  // Document search cache
  const documentSearchCache: DocumentSearchCache = {
    keywords: null,
    keywordFiles: new Map(),
    resolvedDocuments: new Map()
  };

  return {
    // ... existing methods ...

    async loadDocumentSearchKeywords(): Promise<string[]> {
      if (documentSearchCache.keywords) {
        return documentSearchCache.keywords;
      }

      const response = await fetch('/data/document-search/keywords.json');
      if (!response.ok) {
        throw new Error(`Failed to load document search keywords: ${response.statusText}`);
      }

      const data = await response.json() as DocumentSearchKeywords;
      if (!data.keywords || !Array.isArray(data.keywords)) {
        throw new Error('Invalid keywords format received from server');
      }

      documentSearchCache.keywords = data.keywords;
      return data.keywords;
    },

    async searchDocumentsByKeyword(keyword: string): Promise<string[]> {
      // Check cache first
      if (documentSearchCache.keywordFiles.has(keyword)) {
        return documentSearchCache.keywordFiles.get(keyword)!;
      }

      const response = await fetch(`/data/document-search/keywords/${keyword}.json`);
      if (!response.ok) {
        if (response.status === 404) {
          // Keyword not found - return empty array
          documentSearchCache.keywordFiles.set(keyword, []);
          return [];
        }
        throw new Error(`Failed to load keyword file for '${keyword}': ${response.statusText}`);
      }

      const data = await response.json() as DocumentSearchResult;
      if (!data.documentIds || !Array.isArray(data.documentIds)) {
        throw new Error(`Invalid keyword file format for '${keyword}'`);
      }

      documentSearchCache.keywordFiles.set(keyword, data.documentIds);
      return data.documentIds;
    },

    async resolveDocumentIds(documentIds: string[]): Promise<SearchableDocument[]> {
      const resolved: SearchableDocument[] = [];
      const toFetch: string[] = [];

      // Check cache for already resolved documents
      for (const id of documentIds) {
        if (documentSearchCache.resolvedDocuments.has(id)) {
          resolved.push(documentSearchCache.resolvedDocuments.get(id)!);
        } else {
          toFetch.push(id);
        }
      }

      // Fetch missing documents
      if (toFetch.length > 0) {
        const newlyResolved = await this._fetchDocumentsByIds(toFetch);
        for (const doc of newlyResolved) {
          documentSearchCache.resolvedDocuments.set(doc.id, doc);
          resolved.push(doc);
        }
      }

      return resolved;
    },

    async _fetchDocumentsByIds(documentIds: string[]): Promise<SearchableDocument[]> {
      // Group document IDs by case ID for efficient loading
      const caseGroups = new Map<number, string[]>();
      
      for (const id of documentIds) {
        const { caseId } = this._parseDocumentId(id);
        if (!caseGroups.has(caseId)) {
          caseGroups.set(caseId, []);
        }
        caseGroups.get(caseId)!.push(id);
      }

      const results: SearchableDocument[] = [];

      // Load documents by case
      for (const [caseId, docIds] of caseGroups.entries()) {
        try {
          const caseDocuments = await this.loadCaseDocuments(caseId);
          const caseSummary = localCaseIndex?.cases.find(c => c.id === caseId);
          
          for (const docId of docIds) {
            const { documentNumber, attachmentNumber } = this._parseDocumentId(docId);
            
            const document = caseDocuments.find(d => 
              d.documentNumber === documentNumber && 
              d.attachmentNumber === attachmentNumber
            );
            
            if (document) {
              results.push({
                id: docId,
                caseId,
                documentNumber,
                attachmentNumber,
                description: document.description,
                caseName: caseSummary?.name || 'Unknown Case',
                court: caseSummary?.court || 'Unknown Court',
                dateCreated: document.dateCreated,
                filePath: document.filePath,
                pageCount: document.pageCount,
                fileSize: document.fileSize
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to load documents for case ${caseId}:`, error);
        }
      }

      return results;
    },

    _parseDocumentId(documentId: string): { caseId: number; documentNumber: string; attachmentNumber: number } {
      const parts = documentId.split('-');
      if (parts.length !== 3) {
        throw new Error(`Invalid document ID format: ${documentId}`);
      }
      
      return {
        caseId: parseInt(parts[0], 10),
        documentNumber: parts[1],
        attachmentNumber: parseInt(parts[2], 10)
      };
    },

    clearDocumentSearchCache(): void {
      documentSearchCache.keywords = null;
      documentSearchCache.keywordFiles.clear();
      documentSearchCache.resolvedDocuments.clear();
    },

    // Enhanced clear cache to include document search
    clearCache(): void {
      localCaseIndex = null;
      localDocumentCache.clear();
      this.clearDocumentSearchCache();
    }
  };
}
```

### 2. Dedicated Document Search Service

Create `src/services/documentSearchService.ts`:

```typescript
import type { DocumentSearchKeywords, DocumentSearchResult, SearchableDocument } from '../types/document.types';

export interface DocumentSearchService {
  loadKeywords(): Promise<string[]>;
  searchByKeyword(keyword: string): Promise<string[]>;
  searchByMultipleKeywords(keywords: string[], operator: 'AND' | 'OR'): Promise<string[]>;
  resolveDocuments(documentIds: string[]): Promise<SearchableDocument[]>;
  clearCache(): void;
}

class DocumentSearchServiceImpl implements DocumentSearchService {
  private keywordsCache: string[] | null = null;
  private keywordFilesCache = new Map<string, string[]>();
  private documentsCache = new Map<string, SearchableDocument>();

  async loadKeywords(): Promise<string[]> {
    if (this.keywordsCache) return this.keywordsCache;

    const response = await fetch('/data/document-search/keywords.json');
    if (!response.ok) {
      throw new Error(`Failed to load keywords: ${response.statusText}`);
    }

    const data = await response.json() as DocumentSearchKeywords;
    this.keywordsCache = data.keywords;
    return data.keywords;
  }

  async searchByKeyword(keyword: string): Promise<string[]> {
    if (this.keywordFilesCache.has(keyword)) {
      return this.keywordFilesCache.get(keyword)!;
    }

    const response = await fetch(`/data/document-search/keywords/${keyword}.json`);
    if (!response.ok) {
      if (response.status === 404) {
        this.keywordFilesCache.set(keyword, []);
        return [];
      }
      throw new Error(`Failed to load keyword '${keyword}': ${response.statusText}`);
    }

    const data = await response.json() as DocumentSearchResult;
    this.keywordFilesCache.set(keyword, data.documentIds);
    return data.documentIds;
  }

  async searchByMultipleKeywords(keywords: string[], operator: 'AND' | 'OR' = 'OR'): Promise<string[]> {
    if (keywords.length === 0) return [];
    if (keywords.length === 1) return this.searchByKeyword(keywords[0]);

    const results = await Promise.all(
      keywords.map(keyword => this.searchByKeyword(keyword))
    );

    if (operator === 'AND') {
      // Intersection: documents that appear in ALL keyword results
      return results.reduce((intersection, currentSet) => 
        intersection.filter(id => currentSet.includes(id))
      );
    } else {
      // Union: documents that appear in ANY keyword result
      const unionSet = new Set<string>();
      results.forEach(result => result.forEach(id => unionSet.add(id)));
      return Array.from(unionSet);
    }
  }

  async resolveDocuments(documentIds: string[]): Promise<SearchableDocument[]> {
    // Implementation would be similar to dataService._fetchDocumentsByIds
    // but this service could be more focused on search-specific operations
    throw new Error('resolveDocuments not yet implemented in standalone service');
  }

  clearCache(): void {
    this.keywordsCache = null;
    this.keywordFilesCache.clear();
    this.documentsCache.clear();
  }
}

export function createDocumentSearchService(): DocumentSearchService {
  return new DocumentSearchServiceImpl();
}

export const documentSearchService = createDocumentSearchService();
```

### 3. Type Guards

Add to `src/types/guards.ts`:

```typescript
export function isDocumentSearchKeywords(data: any): data is DocumentSearchKeywords {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray(data.keywords) &&
    data.keywords.every((k: any) => typeof k === 'string')
  );
}

export function isDocumentSearchResult(data: any): data is DocumentSearchResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.keyword === 'string' &&
    Array.isArray(data.documentIds) &&
    data.documentIds.every((id: any) => typeof id === 'string')
  );
}

export function isSearchableDocument(data: any): data is SearchableDocument {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.caseId === 'number' &&
    typeof data.documentNumber === 'string' &&
    typeof data.attachmentNumber === 'number' &&
    typeof data.description === 'string' &&
    typeof data.caseName === 'string' &&
    typeof data.court === 'string'
  );
}
```

## Testing Strategy

### 1. Unit Tests

Create `src/services/__tests__/documentSearchService.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDocumentSearchService } from '../documentSearchService';

// Mock fetch globally
global.fetch = vi.fn();

describe('DocumentSearchService', () => {
  let service: DocumentSearchService;

  beforeEach(() => {
    service = createDocumentSearchService();
    vi.clearAllMocks();
  });

  it('should load keywords from server', async () => {
    const mockKeywords = { keywords: ['motion', 'deposition', 'order'] };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockKeywords)
    });

    const keywords = await service.loadKeywords();
    
    expect(keywords).toEqual(['motion', 'deposition', 'order']);
    expect(global.fetch).toHaveBeenCalledWith('/data/document-search/keywords.json');
  });

  it('should search by single keyword', async () => {
    const mockResult = { 
      keyword: 'motion', 
      documentIds: ['100877-1-0', '234561-5-0'] 
    };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult)
    });

    const results = await service.searchByKeyword('motion');
    
    expect(results).toEqual(['100877-1-0', '234561-5-0']);
    expect(global.fetch).toHaveBeenCalledWith('/data/document-search/keywords/motion.json');
  });

  it('should handle multiple keyword search with AND operator', async () => {
    // Mock responses for multiple keywords
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          keyword: 'motion', 
          documentIds: ['100877-1-0', '234561-5-0', '789012-3-0'] 
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          keyword: 'summary', 
          documentIds: ['100877-1-0', '789012-3-0'] 
        })
      });

    const results = await service.searchByMultipleKeywords(['motion', 'summary'], 'AND');
    
    expect(results).toEqual(['100877-1-0', '789012-3-0']);
  });

  it('should cache keyword results', async () => {
    const mockResult = { keyword: 'motion', documentIds: ['100877-1-0'] };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult)
    });

    // First call
    await service.searchByKeyword('motion');
    
    // Second call should use cache
    const results = await service.searchByKeyword('motion');
    
    expect(results).toEqual(['100877-1-0']);
    expect(global.fetch).toHaveBeenCalledTimes(1); // Only called once
  });
});
```

### 2. Integration Tests

Create `src/services/__tests__/dataService.documentSearch.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createDataService } from '../dataService';

describe('DataService Document Search Integration', () => {
  let dataService: ReturnType<typeof createDataService>;

  beforeEach(() => {
    dataService = createDataService();
  });

  it('should integrate document search with existing case loading', async () => {
    // Test that document search works with loaded case data
    // This would require mocked case data and document files
  });
});
```

### 3. HTML Test Page

Create `public/tests/test-document-search-service.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Document Search Service Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; }
        pre { background-color: #f8f9fa; padding: 10px; overflow-x: auto; }
        button { margin: 5px; padding: 8px 16px; }
    </style>
</head>
<body>
    <h1>Document Search Service Test</h1>
    
    <div class="test-section">
        <h3>1. Load Keywords</h3>
        <button onclick="testLoadKeywords()">Load Keywords</button>
        <div id="keywords-result"></div>
    </div>
    
    <div class="test-section">
        <h3>2. Search by Keyword</h3>
        <input type="text" id="keyword-input" placeholder="Enter keyword (e.g., motion)" value="motion">
        <button onclick="testSearchKeyword()">Search</button>
        <div id="search-result"></div>
    </div>
    
    <div class="test-section">
        <h3>3. Multiple Keyword Search</h3>
        <input type="text" id="keywords-input" placeholder="Enter keywords separated by commas" value="motion,summary">
        <select id="operator-select">
            <option value="OR">OR</option>
            <option value="AND">AND</option>
        </select>
        <button onclick="testMultipleKeywords()">Search</button>
        <div id="multiple-search-result"></div>
    </div>
    
    <div class="test-section">
        <h3>4. Cache Performance</h3>
        <button onclick="testCachePerformance()">Test Cache</button>
        <div id="cache-result"></div>
    </div>

    <script type="module">
        // Mock document search service for testing
        class TestDocumentSearchService {
            constructor() {
                this.keywordsCache = null;
                this.keywordFilesCache = new Map();
            }

            async loadKeywords() {
                if (this.keywordsCache) return this.keywordsCache;

                const response = await fetch('/data/document-search/keywords.json');
                if (!response.ok) throw new Error(`Failed to load keywords: ${response.statusText}`);

                const data = await response.json();
                this.keywordsCache = data.keywords;
                return data.keywords;
            }

            async searchByKeyword(keyword) {
                if (this.keywordFilesCache.has(keyword)) {
                    return this.keywordFilesCache.get(keyword);
                }

                const response = await fetch(`/data/document-search/keywords/${keyword}.json`);
                if (!response.ok) {
                    if (response.status === 404) {
                        this.keywordFilesCache.set(keyword, []);
                        return [];
                    }
                    throw new Error(`Failed to load keyword '${keyword}': ${response.statusText}`);
                }

                const data = await response.json();
                this.keywordFilesCache.set(keyword, data.documentIds);
                return data.documentIds;
            }

            async searchByMultipleKeywords(keywords, operator = 'OR') {
                const results = await Promise.all(
                    keywords.map(keyword => this.searchByKeyword(keyword))
                );

                if (operator === 'AND') {
                    return results.reduce((intersection, currentSet) => 
                        intersection.filter(id => currentSet.includes(id))
                    );
                } else {
                    const unionSet = new Set();
                    results.forEach(result => result.forEach(id => unionSet.add(id)));
                    return Array.from(unionSet);
                }
            }
        }

        const service = new TestDocumentSearchService();

        window.testLoadKeywords = async function() {
            const resultDiv = document.getElementById('keywords-result');
            try {
                const start = performance.now();
                const keywords = await service.loadKeywords();
                const end = performance.now();
                
                resultDiv.className = 'success';
                resultDiv.innerHTML = `
                    <strong>Success!</strong> Loaded ${keywords.length} keywords in ${(end-start).toFixed(2)}ms
                    <pre>${JSON.stringify(keywords.slice(0, 10), null, 2)}${keywords.length > 10 ? '\n... and ' + (keywords.length - 10) + ' more' : ''}</pre>
                `;
            } catch (error) {
                resultDiv.className = 'error';
                resultDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
            }
        };

        window.testSearchKeyword = async function() {
            const keyword = document.getElementById('keyword-input').value;
            const resultDiv = document.getElementById('search-result');
            
            try {
                const start = performance.now();
                const documentIds = await service.searchByKeyword(keyword);
                const end = performance.now();
                
                resultDiv.className = 'success';
                resultDiv.innerHTML = `
                    <strong>Success!</strong> Found ${documentIds.length} documents for "${keyword}" in ${(end-start).toFixed(2)}ms
                    <pre>${JSON.stringify(documentIds.slice(0, 5), null, 2)}${documentIds.length > 5 ? '\n... and ' + (documentIds.length - 5) + ' more' : ''}</pre>
                `;
            } catch (error) {
                resultDiv.className = 'error';
                resultDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
            }
        };

        window.testMultipleKeywords = async function() {
            const keywordsInput = document.getElementById('keywords-input').value;
            const operator = document.getElementById('operator-select').value;
            const keywords = keywordsInput.split(',').map(k => k.trim());
            const resultDiv = document.getElementById('multiple-search-result');
            
            try {
                const start = performance.now();
                const documentIds = await service.searchByMultipleKeywords(keywords, operator);
                const end = performance.now();
                
                resultDiv.className = 'success';
                resultDiv.innerHTML = `
                    <strong>Success!</strong> Found ${documentIds.length} documents for ${keywords.join(' ' + operator + ' ')} in ${(end-start).toFixed(2)}ms
                    <pre>${JSON.stringify(documentIds.slice(0, 5), null, 2)}${documentIds.length > 5 ? '\n... and ' + (documentIds.length - 5) + ' more' : ''}</pre>
                `;
            } catch (error) {
                resultDiv.className = 'error';
                resultDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
            }
        };

        window.testCachePerformance = async function() {
            const resultDiv = document.getElementById('cache-result');
            
            try {
                // First call - should hit network
                const start1 = performance.now();
                await service.searchByKeyword('motion');
                const end1 = performance.now();
                
                // Second call - should hit cache
                const start2 = performance.now();
                await service.searchByKeyword('motion');
                const end2 = performance.now();
                
                resultDiv.className = 'success';
                resultDiv.innerHTML = `
                    <strong>Cache Performance Test:</strong><br>
                    First call (network): ${(end1-start1).toFixed(2)}ms<br>
                    Second call (cache): ${(end2-start2).toFixed(2)}ms<br>
                    Speedup: ${((end1-start1)/(end2-start2)).toFixed(1)}x faster
                `;
            } catch (error) {
                resultDiv.className = 'error';
                resultDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
            }
        };
    </script>
</body>
</html>
```

## Success Criteria

Phase 2 is complete when:

1. ✅ **Service Methods**: All document search methods work with static test data
2. ✅ **Caching**: Keyword files are cached and performance improves on subsequent calls
3. ✅ **Error Handling**: Graceful handling of missing keywords and network errors
4. ✅ **Type Safety**: All methods properly validate input/output with type guards
5. ✅ **HTML Test**: Test page demonstrates all functionality working independently

## Independence Verification

This phase works independently by:

- **Input**: Uses static JSON files generated by Phase 1
- **Testing**: HTML test page and unit tests with mocked data
- **No Dependencies**: Does not require Redux store or React components
- **Mock Integration**: Can simulate case data loading for document resolution

## Files Created/Modified

- `src/services/dataService.ts` (enhanced)
- `src/services/documentSearchService.ts` (new)
- `src/types/document.types.ts` (enhanced)
- `src/types/guards.ts` (enhanced)
- `src/services/__tests__/documentSearchService.test.ts` (new)
- `src/services/__tests__/dataService.documentSearch.test.ts` (new)
- `public/tests/test-document-search-service.html` (new)