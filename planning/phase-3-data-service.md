# Phase 3: Data Service

## Objective

Create a TypeScript service class that loads and manages case and document data from the JSON index files created by Phase 1.

## Interface

```typescript
// services/dataService.ts
export interface CaseIndex {
  cases: CaseSummary[];
  courts: Court[];
  dateRange: { min: string; max: string };
}

export interface CaseSummary {
  id: number;
  name: string;
  nameShort: string;
  court: string;
  filed: string;
  terminated: string | null;
  docCount: number;
  availCount: number;
}

export interface Court {
  code: string;
  name: string;
}

export interface Document {
  id: number;
  entryNumber: number;
  documentNumber: string;
  description: string;
  dateFiled: string;
  pageCount: number | null;
  fileSize: number | null;
  filePath: string | null;
  sha1: string;
}

export interface Case {
  id: number;
  caseName: string;
  caseNameShort: string;
  caseNameFull: string;
  court: string;
  docketNumber: string;
  dateFiled: string;
  dateTerminated: string | null;
  assignedTo: string;
  documentCount: number;
  availableDocumentCount: number;
}
```

## Implementation

```typescript
export class DataService {
  private caseIndex: CaseIndex | null = null;
  private documentCache: Map<number, Document[]> = new Map();
  
  /**
   * Load the case index. Caches result for subsequent calls.
   */
  async loadCaseIndex(): Promise<CaseIndex> {
    if (this.caseIndex) return this.caseIndex;
    
    const response = await fetch('/data/case-index.json');
    if (!response.ok) {
      throw new Error(`Failed to load case index: ${response.statusText}`);
    }
    
    this.caseIndex = await response.json();
    return this.caseIndex;
  }
  
  /**
   * Load documents for a specific case. Caches results.
   */
  async loadCaseDocuments(caseId: number): Promise<Document[]> {
    if (this.documentCache.has(caseId)) {
      return this.documentCache.get(caseId)!;
    }
    
    const response = await fetch(`/data/documents/${caseId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load documents for case ${caseId}`);
    }
    
    const documents = await response.json();
    this.documentCache.set(caseId, documents);
    return documents;
  }
  
  /**
   * Load full case details from original JSON (optional method)
   */
  async loadFullCase(caseId: number): Promise<Case> {
    const response = await fetch(`/data/docket-data/${caseId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load case ${caseId}`);
    }
    
    const data = await response.json();
    return this.transformToCase(data);
  }
  
  /**
   * Clear all caches
   */
  clearCache(): void {
    this.caseIndex = null;
    this.documentCache.clear();
  }
  
  private transformToCase(data: any): Case {
    // Transform raw JSON to Case interface
    return {
      id: data.id,
      caseName: data.case_name,
      caseNameShort: data.case_name_short || data.case_name,
      caseNameFull: data.case_name_full || data.case_name,
      court: data.court,
      docketNumber: data.docket_number,
      dateFiled: data.date_filed,
      dateTerminated: data.date_terminated,
      assignedTo: data.assigned_to_str || 'Unknown',
      documentCount: data.docket_entries?.length || 0,
      availableDocumentCount: this.countAvailableDocuments(data)
    };
  }
  
  private countAvailableDocuments(data: any): number {
    let count = 0;
    for (const entry of data.docket_entries || []) {
      for (const doc of entry.recap_documents || []) {
        if (doc.is_available && doc.filepath_local) {
          count++;
        }
      }
    }
    return count;
  }
}

// Export singleton instance
export const dataService = new DataService();
```

## Testing

### Test File: `services/dataService.test.ts`

```typescript
import { DataService } from './dataService';

// Mock fetch for testing
global.fetch = jest.fn();

describe('DataService', () => {
  let service: DataService;
  
  beforeEach(() => {
    service = new DataService();
    (fetch as jest.Mock).mockClear();
  });
  
  test('loadCaseIndex - success', async () => {
    const mockIndex = {
      cases: [{ id: 1, name: 'Test Case' }],
      courts: [{ code: 'test', name: 'Test Court' }],
      dateRange: { min: '2020-01-01', max: '2023-12-31' }
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockIndex
    });
    
    const result = await service.loadCaseIndex();
    expect(result).toEqual(mockIndex);
    expect(fetch).toHaveBeenCalledWith('/data/case-index.json');
  });
  
  test('loadCaseIndex - caches result', async () => {
    const mockIndex = { cases: [], courts: [], dateRange: { min: '', max: '' } };
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockIndex
    });
    
    await service.loadCaseIndex();
    await service.loadCaseIndex(); // Second call
    
    expect(fetch).toHaveBeenCalledTimes(1); // Should use cache
  });
  
  test('loadCaseDocuments - success', async () => {
    const mockDocs = [
      { id: 1, description: 'Test Document' }
    ];
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocs
    });
    
    const result = await service.loadCaseDocuments(123);
    expect(result).toEqual(mockDocs);
    expect(fetch).toHaveBeenCalledWith('/data/documents/123.json');
  });
});
```

### Manual Test

Create `test-data-service.html`:

```html
<!DOCTYPE html>
<html>
<body>
  <h2>Data Service Test</h2>
  <button onclick="testService()">Test Data Service</button>
  <pre id="results"></pre>
  
  <script type="module">
    import { DataService } from '/src/services/dataService.js';
    
    window.testService = async () => {
      const service = new DataService();
      const results = document.getElementById('results');
      
      try {
        // Test loading case index
        const index = await service.loadCaseIndex();
        results.textContent += `✅ Loaded ${index.cases.length} cases\n`;
        
        // Test loading documents
        if (index.cases.length > 0) {
          const docs = await service.loadCaseDocuments(index.cases[0].id);
          results.textContent += `✅ Loaded ${docs.length} documents\n`;
        }
        
        results.textContent += '\n✅ All tests passed!';
      } catch (error) {
        results.textContent += `❌ Error: ${error.message}\n`;
      }
    };
  </script>
</body>
</html>
```

## Success Criteria

- [ ] Service loads case index successfully
- [ ] Service caches case index for performance
- [ ] Service loads document lists by case ID
- [ ] Service handles errors gracefully
- [ ] TypeScript types are properly exported
- [ ] Cache can be cleared when needed

## Notes for Integration

- Phase 5 (Redux) will use this service in async thunks
- Phase 6 (React) may use this directly or through Redux
- The service assumes Phase 1 indices exist at expected URLs
- Consider adding request retry logic for production