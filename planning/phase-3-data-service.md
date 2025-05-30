# Phase 3: Data Service

## Objective

Create a TypeScript service that loads and manages case and document data from the JSON index files created by Phase 1.

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
// Cache storage
let caseIndex: CaseIndex | null = null;
const documentCache = new Map<number, Document[]>();

/**
 * Load the case index. Caches result for subsequent calls.
 */
export async function loadCaseIndex(): Promise<CaseIndex> {
  if (caseIndex) return caseIndex;

  const response = await fetch("/data/case-index.json");
  if (!response.ok) {
    throw new Error(`Failed to load case index: ${response.statusText}`);
  }

  caseIndex = await response.json();
  return caseIndex;
}

/**
 * Load documents for a specific case. Caches results.
 */
export async function loadCaseDocuments(caseId: number): Promise<Document[]> {
  if (documentCache.has(caseId)) {
    return documentCache.get(caseId)!;
  }

  const response = await fetch(`/data/documents/${caseId}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load documents for case ${caseId}`);
  }

  const documents = await response.json();
  documentCache.set(caseId, documents);
  return documents;
}

/**
 * Load full case details from original JSON (optional method)
 */
export async function loadFullCase(caseId: number): Promise<Case> {
  const response = await fetch(`/data/docket-data/${caseId}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load case ${caseId}`);
  }

  const data = await response.json();
  return transformToCase(data);
}

/**
 * Clear all caches
 */
export function clearCache(): void {
  caseIndex = null;
  documentCache.clear();
}

// Helper functions
function transformToCase(data: any): Case {
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
    assignedTo: data.assigned_to_str || "Unknown",
    documentCount: data.docket_entries?.length || 0,
    availableDocumentCount: countAvailableDocuments(data),
  };
}

function countAvailableDocuments(data: any): number {
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

// Export factory function to create isolated instances if needed
export function createDataService() {
  let localCaseIndex: CaseIndex | null = null;
  const localDocumentCache = new Map<number, Document[]>();

  return {
    async loadCaseIndex(): Promise<CaseIndex> {
      if (localCaseIndex) return localCaseIndex;

      const response = await fetch("/data/case-index.json");
      if (!response.ok) {
        throw new Error(`Failed to load case index: ${response.statusText}`);
      }

      localCaseIndex = await response.json();
      return localCaseIndex;
    },

    async loadCaseDocuments(caseId: number): Promise<Document[]> {
      if (localDocumentCache.has(caseId)) {
        return localDocumentCache.get(caseId)!;
      }

      const response = await fetch(`/data/documents/${caseId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load documents for case ${caseId}`);
      }

      const documents = await response.json();
      localDocumentCache.set(caseId, documents);
      return documents;
    },

    async loadFullCase(caseId: number): Promise<Case> {
      const response = await fetch(`/data/docket-data/${caseId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load case ${caseId}`);
      }

      const data = await response.json();
      return transformToCase(data);
    },

    clearCache(): void {
      localCaseIndex = null;
      localDocumentCache.clear();
    },
  };
}
```

## Testing

### Test File: `services/dataService.test.ts`

```typescript
import { 
  loadCaseIndex, 
  loadCaseDocuments, 
  clearCache,
  createDataService 
} from "./dataService";

// Mock fetch for testing
global.fetch = jest.fn();

describe("DataService - Module Functions", () => {
  beforeEach(() => {
    clearCache();
    (fetch as jest.Mock).mockClear();
  });

  test("loadCaseIndex - success", async () => {
    const mockIndex = {
      cases: [{ id: 1, name: "Test Case" }],
      courts: [{ code: "test", name: "Test Court" }],
      dateRange: { min: "2020-01-01", max: "2023-12-31" },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockIndex,
    });

    const result = await loadCaseIndex();
    expect(result).toEqual(mockIndex);
    expect(fetch).toHaveBeenCalledWith("/data/case-index.json");
  });

  test("loadCaseIndex - caches result", async () => {
    const mockIndex = {
      cases: [],
      courts: [],
      dateRange: { min: "", max: "" },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockIndex,
    });

    await loadCaseIndex();
    await loadCaseIndex(); // Second call

    expect(fetch).toHaveBeenCalledTimes(1); // Should use cache
  });

  test("loadCaseDocuments - success", async () => {
    const mockDocs = [{ id: 1, description: "Test Document" }];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocs,
    });

    const result = await loadCaseDocuments(123);
    expect(result).toEqual(mockDocs);
    expect(fetch).toHaveBeenCalledWith("/data/documents/123.json");
  });
});

describe("DataService - Factory Function", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test("creates isolated instances", async () => {
    const service1 = createDataService();
    const service2 = createDataService();

    const mockIndex = {
      cases: [{ id: 1, name: "Test Case" }],
      courts: [],
      dateRange: { min: "", max: "" },
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockIndex,
    });

    await service1.loadCaseIndex();
    await service2.loadCaseIndex();

    // Each instance should make its own fetch
    expect(fetch).toHaveBeenCalledTimes(2);
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
    <button onclick="testModuleFunctions()">Test Module Functions</button>
    <button onclick="testFactory()">Test Factory Function</button>
    <pre id="results"></pre>

    <script type="module">
      import { 
        loadCaseIndex, 
        loadCaseDocuments,
        clearCache,
        createDataService 
      } from "/src/services/dataService.js";

      window.testModuleFunctions = async () => {
        const results = document.getElementById("results");
        results.textContent = "Testing module functions...\n";

        try {
          // Test loading case index
          const index = await loadCaseIndex();
          results.textContent += `✅ Loaded ${index.cases.length} cases\n`;

          // Test loading documents
          if (index.cases.length > 0) {
            const docs = await loadCaseDocuments(index.cases[0].id);
            results.textContent += `✅ Loaded ${docs.length} documents\n`;
          }

          // Test cache
          const index2 = await loadCaseIndex();
          results.textContent += `✅ Cache working (same reference: ${index === index2})\n`;

          results.textContent += "\n✅ Module functions test passed!";
        } catch (error) {
          results.textContent += `❌ Error: ${error.message}\n`;
        }
      };

      window.testFactory = async () => {
        const results = document.getElementById("results");
        results.textContent = "Testing factory function...\n";

        try {
          const service = createDataService();
          
          // Test loading case index
          const index = await service.loadCaseIndex();
          results.textContent += `✅ Loaded ${index.cases.length} cases\n`;

          // Test loading documents
          if (index.cases.length > 0) {
            const docs = await service.loadCaseDocuments(index.cases[0].id);
            results.textContent += `✅ Loaded ${docs.length} documents\n`;
          }

          results.textContent += "\n✅ Factory function test passed!";
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

- Phase 5 (Redux) will use the module-level functions in async thunks
- Phase 6 (React) may use the functions directly or through Redux
- The factory function `createDataService()` can be used for isolated instances in testing
- The service assumes Phase 1 indices exist at expected URLs
- Consider adding request retry logic for production
- Module-level functions share a global cache for better performance
- Use `clearCache()` to reset the cache when needed

