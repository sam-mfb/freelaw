# Legal Document Browser - Implementation Plan

## Overview
A TypeScript React application using Vite's dev server, Redux Toolkit for state management, serving as a local convenience tool for browsing legal documents.

## Architecture

### 1. Data Strategy
Since we're using Vite's dev server:
- Pre-build JSON index files during development
- Serve them as static assets through Vite
- Use Vite's file serving for PDFs (with a proxy if needed)

### 2. Project Structure
```
src/
├── store/
│   ├── index.ts              # Redux store configuration
│   ├── casesSlice.ts         # Cases data and search
│   ├── documentsSlice.ts     # Document listings
│   └── uiSlice.ts            # UI state (filters, selections)
├── components/
│   ├── CaseList.tsx          # Searchable case list
│   ├── CaseSearch.tsx        # Search input with filters
│   ├── DocumentList.tsx      # Documents for selected case
│   ├── DocumentCard.tsx      # Individual document display
│   └── Layout.tsx            # Main app layout
├── services/
│   ├── dataService.ts        # Load index files, fetch data
│   └── pdfService.ts         # Handle PDF serving
├── hooks/
│   ├── useAppDispatch.ts     # Typed Redux hooks
│   ├── useAppSelector.ts     
│   └── useCaseSearch.ts      # Search functionality
├── types/
│   ├── case.types.ts         # Case interfaces
│   ├── document.types.ts     # Document interfaces
│   └── index.types.ts        # Index/search types
└── utils/
    ├── indexBuilder.ts       # Build searchable indices
    └── formatters.ts         # Date/text formatting

public/
├── data/
│   ├── case-index.json       # Pre-built case index
│   └── documents/            # Document indices by case
│       ├── 100877.json
│       └── ...

scripts/
└── buildIndex.ts             # Pre-process JSONs into indices
```

### 3. Type Definitions
```typescript
// types/case.types.ts
interface Case {
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

// types/document.types.ts
interface Document {
  id: number;
  entryNumber: number;
  documentNumber: string;
  description: string;
  dateFiled: string;
  pageCount: number | null;
  fileSize: number | null;
  filePath: string | null;
  isAvailable: boolean;
  sha1: string;
}

// types/index.types.ts
interface CaseIndex {
  cases: CaseSummary[];
  courts: Court[];
  dateRange: { min: string; max: string };
}

interface CaseSummary {
  id: number;
  name: string;
  nameShort: string;
  court: string;
  filed: string;
  terminated: string | null;
  docCount: number;
  availCount: number;
}
```

### 4. Redux Store Structure
```typescript
// store/casesSlice.ts
interface CasesState {
  index: CaseIndex | null;
  filteredCases: CaseSummary[];
  selectedCase: Case | null;
  searchTerm: string;
  filters: {
    court: string | null;
    dateFrom: string | null;
    dateTo: string | null;
    onlyActive: boolean;
  };
  loading: boolean;
  error: string | null;
}

// store/documentsSlice.ts
interface DocumentsState {
  documents: Record<number, Document[]>; // Keyed by case ID
  filteredDocuments: Document[];
  searchTerm: string;
  loading: boolean;
  error: string | null;
}

// store/uiSlice.ts
interface UIState {
  sidebarOpen: boolean;
  documentListView: 'grid' | 'list';
  sortBy: 'name' | 'date' | 'docCount';
  sortOrder: 'asc' | 'desc';
}
```

## Implementation Details

### Phase 1: Index Builder Script
```typescript
// scripts/buildIndex.ts
import fs from 'fs/promises';
import path from 'path';

interface BuildConfig {
  jsonDir: string;
  outputDir: string;
  pdfBaseDir: string;
}

async function buildIndices(config: BuildConfig): Promise<void> {
  // 1. Read all JSON files
  // 2. Build case index with summary info
  // 3. For each case, build document index
  // 4. Save to public/data/
}
```

Output structure:
```typescript
// public/data/case-index.json
{
  "cases": [
    {
      "id": 100877,
      "name": "Ditech Holding Corporation",
      "nameShort": "Ditech Holdings",
      "court": "nysb",
      "filed": "2019-02-11",
      "terminated": null,
      "docCount": 156,
      "availCount": 89
    }
  ],
  "courts": [
    { "code": "nysb", "name": "New York Southern Bankruptcy" }
  ],
  "dateRange": {
    "min": "2010-01-01",
    "max": "2023-12-31"
  }
}
```

#### Phase 1 Testing
**Test File:** `scripts/testBuildIndex.ts`
```typescript
// Automated test that can run independently
async function testIndexBuilder() {
  // 1. Create test data directory with 3 sample JSON files
  const testData = {
    '100.json': { id: 100, case_name: 'Test v. Sample', court: 'test', date_filed: '2023-01-01' },
    '200.json': { id: 200, case_name: 'Demo v. Example', court: 'demo', date_filed: '2023-02-01' },
    '300.json': { id: 300, case_name: 'Mock v. Stub', court: 'test', date_filed: '2023-03-01' }
  };
  
  // 2. Run buildIndices with test config
  await buildIndices({
    jsonDir: './test-data/docket-data',
    outputDir: './test-output',
    pdfBaseDir: './test-data/sata'
  });
  
  // 3. Verify outputs
  const caseIndex = JSON.parse(await fs.readFile('./test-output/case-index.json', 'utf-8'));
  
  console.assert(caseIndex.cases.length === 3, 'Should have 3 cases');
  console.assert(caseIndex.courts.length === 2, 'Should have 2 unique courts');
  console.assert(fs.existsSync('./test-output/documents/100.json'), 'Should create document index');
  
  console.log('✅ Phase 1: Index builder working correctly');
}

// Run: npx tsx scripts/testBuildIndex.ts
```

**Manual Test:**
1. Run `npm run build:index` with a subset of data (e.g., first 10 JSON files)
2. Check that `public/data/case-index.json` exists and contains expected structure
3. Verify `public/data/documents/` contains corresponding document files
4. Open case-index.json and verify it has cases, courts, and dateRange fields

### Phase 2: Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow serving files from project root
      allow: ['..']
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@data': '/data'
    }
  }
});
```

#### Phase 2 Testing
**Test File:** `test-vite-setup.html`
```html
<!DOCTYPE html>
<html>
<head>
  <title>Vite Config Test</title>
</head>
<body>
  <div id="test-results"></div>
  <script type="module">
    // Test that Vite can serve files from different directories
    const tests = [
      { url: '/data/case-index.json', desc: 'Serve from public/data' },
      { url: '/data/docket-data/100877.json', desc: 'Serve from project data dir' },
      { url: '/data/sata/recap/test.pdf', desc: 'Serve PDF from data dir' }
    ];
    
    const results = document.getElementById('test-results');
    
    for (const test of tests) {
      try {
        const response = await fetch(test.url);
        const status = response.ok ? '✅' : '❌';
        results.innerHTML += `<p>${status} ${test.desc}: ${response.status}</p>`;
      } catch (e) {
        results.innerHTML += `<p>❌ ${test.desc}: ${e.message}</p>`;
      }
    }
  </script>
</body>
</html>
```

**Manual Test:**
1. Create minimal React app with just vite.config.ts
2. Place test files in expected directories
3. Run `npm run dev`
4. Navigate to http://localhost:5173/test-vite-setup.html
5. Verify all file paths resolve correctly

### Phase 3: Data Service
```typescript
// services/dataService.ts
class DataService {
  private caseIndex: CaseIndex | null = null;
  
  async loadCaseIndex(): Promise<CaseIndex> {
    if (this.caseIndex) return this.caseIndex;
    
    const response = await fetch('/data/case-index.json');
    this.caseIndex = await response.json();
    return this.caseIndex;
  }
  
  async loadCaseDocuments(caseId: number): Promise<Document[]> {
    const response = await fetch(`/data/documents/${caseId}.json`);
    return response.json();
  }
  
  async loadFullCase(caseId: number): Promise<Case> {
    // Load from original JSON if needed for full details
    const response = await fetch(`/data/docket-data/${caseId}.json`);
    const data = await response.json();
    return this.transformToCase(data);
  }
}
```

#### Phase 3 Testing
**Test File:** `services/dataService.test.ts`
```typescript
// Test with mock fetch - no server needed
import { DataService } from './dataService';

// Mock fetch globally
global.fetch = jest.fn();

describe('DataService', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('loadCaseIndex caches results', async () => {
    const mockIndex = {
      cases: [{ id: 1, name: 'Test Case' }],
      courts: [{ code: 'test', name: 'Test Court' }],
      dateRange: { min: '2020-01-01', max: '2023-12-31' }
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockIndex
    });

    const service = new DataService();
    const result1 = await service.loadCaseIndex();
    const result2 = await service.loadCaseIndex();
    
    expect(fetch).toHaveBeenCalledTimes(1); // Should cache
    expect(result1).toEqual(mockIndex);
    expect(result2).toBe(result1); // Same reference
  });

  // Run: npm test services/dataService.test.ts
});
```

**Manual Test without dependencies:**
```html
<!-- test-data-service.html -->
<script type="module">
  // Create mock data files in public/data/
  const testService = new DataService();
  
  try {
    const index = await testService.loadCaseIndex();
    console.log('✅ Case index loaded:', index.cases.length, 'cases');
    
    const docs = await testService.loadCaseDocuments(index.cases[0].id);
    console.log('✅ Documents loaded:', docs.length, 'documents');
  } catch (e) {
    console.error('❌ Service test failed:', e);
  }
</script>
```

### Phase 4: PDF Serving
```typescript
// services/pdfService.ts
class PDFService {
  openPDF(filePath: string): void {
    // Convert relative path to full URL
    const pdfUrl = `/data/sata/${filePath}`;
    window.open(pdfUrl, '_blank');
  }
}
```

#### Phase 4 Testing
**Manual Test:**
```html
<!-- test-pdf-service.html -->
<!DOCTYPE html>
<html>
<body>
  <h2>PDF Service Test</h2>
  <button id="test-pdf">Test PDF Opening</button>
  <div id="result"></div>
  
  <script type="module">
    class PDFService {
      openPDF(filePath) {
        const pdfUrl = `/data/sata/${filePath}`;
        console.log('Would open:', pdfUrl);
        document.getElementById('result').textContent = `✅ URL constructed: ${pdfUrl}`;
        // In real test, check if URL is reachable
        fetch(pdfUrl, { method: 'HEAD' })
          .then(r => console.log('PDF exists:', r.ok))
          .catch(e => console.error('PDF not found'));
      }
    }
    
    document.getElementById('test-pdf').onclick = () => {
      const service = new PDFService();
      service.openPDF('recap/test.pdf');
    };
  </script>
</body>
</html>
```

### Phase 5: Redux Implementation
```typescript
// store/casesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export const loadCaseIndex = createAsyncThunk(
  'cases/loadIndex',
  async () => {
    const service = new DataService();
    return service.loadCaseIndex();
  }
);

const casesSlice = createSlice({
  name: 'cases',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.filteredCases = filterCases(state);
    },
    setCourtFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.court = action.payload;
      state.filteredCases = filterCases(state);
    },
    // ... other reducers
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCaseIndex.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadCaseIndex.fulfilled, (state, action) => {
        state.index = action.payload;
        state.filteredCases = action.payload.cases;
        state.loading = false;
      });
  }
});
```

#### Phase 5 Testing
**Test File:** `store/testRedux.ts`
```typescript
// Standalone Redux test - no React needed
import { configureStore } from '@reduxjs/toolkit';
import casesReducer, { loadCaseIndex, setSearchTerm } from './casesSlice';

// Mock the DataService
jest.mock('../services/dataService', () => ({
  DataService: class {
    async loadCaseIndex() {
      return {
        cases: [
          { id: 1, name: 'Test v. Example', court: 'test' },
          { id: 2, name: 'Demo v. Sample', court: 'demo' }
        ],
        courts: [{ code: 'test', name: 'Test Court' }],
        dateRange: { min: '2020-01-01', max: '2023-12-31' }
      };
    }
  }
}));

async function testReduxStore() {
  const store = configureStore({
    reducer: { cases: casesReducer }
  });
  
  // Test async thunk
  await store.dispatch(loadCaseIndex());
  console.assert(store.getState().cases.index.cases.length === 2, 'Should load 2 cases');
  
  // Test filtering
  store.dispatch(setSearchTerm('Test'));
  console.assert(store.getState().cases.filteredCases.length === 1, 'Should filter to 1 case');
  
  console.log('✅ Phase 5: Redux store working correctly');
}

// Run: npx tsx store/testRedux.ts
```

### Phase 6: React Components
```typescript
// components/CaseSearch.tsx
import React from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setSearchTerm, setCourtFilter } from '@/store/casesSlice';

export const CaseSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const { searchTerm, filters, index } = useAppSelector(state => state.cases);
  
  return (
    <div className="case-search">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => dispatch(setSearchTerm(e.target.value))}
        placeholder="Search cases..."
      />
      <select
        value={filters.court || ''}
        onChange={(e) => dispatch(setCourtFilter(e.target.value || null))}
      >
        <option value="">All Courts</option>
        {index?.courts.map(court => (
          <option key={court.code} value={court.code}>
            {court.name}
          </option>
        ))}
      </select>
    </div>
  );
};
```

#### Phase 6 Testing
**Test File:** `components/CaseSearch.test.tsx`
```typescript
// React component test with mock Redux store
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CaseSearch } from './CaseSearch';
import casesReducer from '@/store/casesSlice';

const mockStore = configureStore({
  reducer: { cases: casesReducer },
  preloadedState: {
    cases: {
      searchTerm: '',
      filters: { court: null },
      index: {
        cases: [],
        courts: [{ code: 'test', name: 'Test Court' }],
        dateRange: { min: '2020-01-01', max: '2023-12-31' }
      },
      filteredCases: [],
      selectedCase: null,
      loading: false,
      error: null
    }
  }
});

test('CaseSearch renders and dispatches actions', () => {
  render(
    <Provider store={mockStore}>
      <CaseSearch />
    </Provider>
  );
  
  // Test search input
  const searchInput = screen.getByPlaceholderText('Search cases...');
  fireEvent.change(searchInput, { target: { value: 'test' } });
  expect(mockStore.getState().cases.searchTerm).toBe('test');
  
  // Test court filter
  const courtSelect = screen.getByRole('combobox');
  expect(screen.getByText('Test Court')).toBeInTheDocument();
  
  console.log('✅ Phase 6: React components working correctly');
});

// Run: npm test components/CaseSearch.test.tsx
```

**Manual Test:**
```html
<!-- test-components.html -->
<!DOCTYPE html>
<html>
<body>
  <div id="root"></div>
  <script type="module">
    // Create minimal React app with just one component
    // to verify it renders without full app context
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    
    function TestComponent() {
      const [search, setSearch] = React.useState('');
      return (
        <div>
          <h2>Component Test</h2>
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Test search..."
          />
          <p>Search value: {search}</p>
        </div>
      );
    }
    
    ReactDOM.createRoot(document.getElementById('root')).render(<TestComponent />);
  </script>
</body>
</html>
```

## Build & Run Process

1. **Initial Setup**
```bash
npm run build:index  # Run buildIndex.ts to create indices
npm run dev          # Start Vite dev server
```

2. **Index Builder Package.json Script**
```json
{
  "scripts": {
    "dev": "vite",
    "build:index": "tsx scripts/buildIndex.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

## Performance Optimizations

1. **Lazy Loading**
   - Load case index on app start
   - Load document lists only when case selected
   - Virtual scrolling for long lists

2. **Caching**
   - Redux persists loaded data
   - Memoized selectors for filtered results
   - Service-level caching for repeated requests

3. **Search Performance**
   - Client-side filtering on pre-loaded index
   - Debounced search input
   - Indexed search fields in memory

## Index Building Details

### How It Works:

1. **Reads each JSON file** from `/data/docket-data/`
2. **Extracts only the essential fields** needed for searching and display:
   - Case ID, names (full/short), court, dates
   - Counts of total documents and available documents
   - For documents: descriptions, file paths, entry numbers
3. **Creates two types of output files**:
   - One main case index with all cases
   - Individual document indices for each case

### Files Stored in Public Directory:

```
public/
└── data/
    ├── case-index.json         # ~5-10MB (all 34K cases)
    └── documents/              # ~34K files
        ├── 100877.json         # ~10-50KB per file
        ├── 1080491.json
        └── ... (one per case)
```

**case-index.json** contains:
- Summary info for all 34,418 cases
- Just the fields needed for search/filter/display
- No document details (kept separate for performance)

**documents/[caseId].json** contains:
- Array of all documents for that specific case
- Only includes documents where `is_available: true` and `filepath_local` exists
- Stripped down to: id, description, dates, file path, page count, file size

This approach means:
- Initial page load only fetches the case index (~5-10MB)
- Document details are loaded on-demand when a case is selected
- Original JSON files (328KB-6.6MB each) stay in `/data/docket-data/`
- PDFs remain in `/data/sata/recap/` and are served directly by Vite