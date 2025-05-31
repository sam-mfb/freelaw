# Document Search Implementation Plan

## Overview

This plan implements advanced document-level search capabilities for the Legal Document Browser. Users will be able to search for specific document types and keywords within document descriptions across all cases.

## Architecture

### Current State

- **Case-level search**: Users search cases by name, court, docket number
- **Case index**: Single `case-index.json` file loaded at startup
- **Document access**: Documents loaded per-case when case selected

### Target State

- **Document-level search**: Users search documents by keywords in descriptions
- **Lazy-loaded inverted index**: Keywords directory with individual keyword files
- **Parallel capabilities**: Both case search and document search available
- **Memory efficient**: Only load searched keywords into memory

## Data Structure

### Inverted Index Structure

```
public/data/document-search/
├── keywords.json              # ["deposition", "motion", "summary", ...]
└── keywords/
    ├── deposition.json       # ["100877-1-0", "234561-5-0", ...]
    ├── motion.json           # ["100877-3-0", "789012-1-0", ...]
    └── summary.json          # Document IDs for "summary"
```

### Document ID Format

- **Pattern**: `{caseId}-{documentNumber}-{attachmentNumber}`
- **Example**: `"100877-1-0"` = Case 100877, Document 1, Attachment 0
- **Benefits**: Unique identifier, easy parsing, compact string

### Keywords File

```json
{
  "keywords": ["deposition", "motion", "summary", "judgment", "order", ...]
}
```

### Individual Keyword Files

```json
{
  "keyword": "deposition",
  "documentIds": ["100877-1-0", "234561-5-0", "234561-12-1", "789012-8-0"]
}
```

## Shared Types

```typescript
// Document search types (add to src/types/document.types.ts)
export interface DocumentSearchKeywords {
  keywords: string[];
}

export interface DocumentSearchResult {
  keyword: string;
  documentIds: string[];
}

export interface DocumentSearchIndex {
  [keyword: string]: string[];
}

export interface SearchableDocument {
  id: string; // "caseId-docNum-attachNum"
  caseId: number;
  documentNumber: string;
  attachmentNumber: number;
  description: string;
  caseName: string;
  court: string;
}
```

## Independent Phase Requirements

### Phase 1: Index Building

**Deliverable**: Enhanced `buildIndex.ts` that generates document search indices
**Independence**: Runs standalone, outputs files to filesystem
**Proof**: Generated files validate against expected structure

### Phase 2: Data Service

**Deliverable**: Document search methods in `dataService.ts`
**Independence**: Methods work with static test data files
**Proof**: HTML test page demonstrating keyword search

### Phase 3: Redux Store

**Deliverable**: Document search slice with state management
**Independence**: Store methods work with mocked data service
**Proof**: Unit tests showing state transitions

### Phase 4: React UI

**Deliverable**: Document search components
**Independence**: Components work with mocked Redux state
**Proof**: Storybook-style component demos

## Keyword Extraction Strategy

### Document Description Analysis

Extract keywords from document descriptions using:

1. **Common document types**: motion, order, deposition, brief, complaint, answer
2. **Legal terms**: summary, judgment, injunction, discovery, settlement
3. **Procedural terms**: filing, hearing, conference, trial, appeal

### Implementation Approach

```typescript
function extractKeywords(description: string): string[] {
  // Normalize description
  const normalized = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Extract meaningful terms (2+ characters, not common words)
  const words = normalized
    .split(' ')
    .filter((word) => word.length >= 2)
    .filter((word) => !STOP_WORDS.includes(word));

  return [...new Set(words)]; // Deduplicate
}
```

## File Organization

Each phase will maintain its own files and tests:

```
planning/

scripts/

src/services/

src/store/

src/components/
```

## Testing Strategy

### Phase 1: File System Validation

- Verify output directory structure
- Validate JSON schema of generated files
- Test with sample data (10 cases)

### Phase 2: Service Method Testing

- Mock keyword files in test environment
- HTML test page with search interface
- Verify correct document ID parsing

### Phase 3: Redux State Testing

- Mock data service responses
- Unit tests for all actions and reducers
- Test state transitions independently

### Phase 4: Component Testing

- Mock Redux state and actions
- Visual component testing
- Verify user interaction flows

## Performance Considerations

### Memory Usage

- Keywords file: ~5-10KB (always in memory)
- Individual keyword files: 1-50KB each (load on demand)
- Cache recently searched keywords
- Clear cache on memory pressure

### Network Efficiency

- Only fetch searched keywords
- Compress keyword files if needed
- Implement simple caching strategy

### Scalability

- Index building: Process incrementally
- Search response: Limit results if needed
- UI rendering: Virtualize large result lists

## Phase Integration Contracts

Each phase must implement these exact contracts to ensure seamless integration:

### Phase 1 → Phase 2: File System Contract

**Output Directory Structure** (MUST be exact):

```
public/data/document-search/
├── keywords.json
└── keywords/
    ├── {keyword1}.json
    ├── {keyword2}.json
    └── ...
```

**Keywords Index File Contract**:

```typescript
// public/data/document-search/keywords.json
interface DocumentSearchKeywords {
  keywords: string[]; // MUST be sorted alphabetically
}
```

**Individual Keyword File Contract**:

```typescript
// public/data/document-search/keywords/{keyword}.json
interface DocumentSearchResult {
  keyword: string; // MUST match filename without .json
  documentIds: string[]; // MUST use format: "{caseId}-{docNum}-{attachNum}"
}
```

### Phase 2 → Phase 3: Service Interface Contract

**DocumentSearchService Interface** (MUST implement exactly):

```typescript
interface DocumentSearchService {
  // MUST return sorted array, cache results
  loadKeywords(): Promise<string[]>;

  // MUST return document IDs, handle 404 gracefully
  searchByKeyword(keyword: string): Promise<string[]>;

  // MUST implement AND/OR logic correctly
  searchByMultipleKeywords(keywords: string[], operator: 'AND' | 'OR'): Promise<string[]>;

  // MUST resolve IDs to full document objects
  resolveDocuments(documentIds: string[]): Promise<SearchableDocument[]>;

  // MUST clear all caches
  clearCache(): void;
}
```

**SearchableDocument Contract** (MUST match exactly):

```typescript
interface SearchableDocument {
  id: string; // MUST be "{caseId}-{docNum}-{attachNum}"
  caseId: number; // MUST be positive integer
  documentNumber: string; // MUST match original document
  attachmentNumber: number; // MUST be 0 or positive
  description: string; // MUST not be empty
  caseName: string; // MUST not be empty
  court: string; // MUST not be empty
  dateCreated?: string; // MUST be ISO date string if present
  filePath?: string; // MUST be relative path if present
  pageCount?: number; // MUST be positive if present
  fileSize?: number; // MUST be positive bytes if present
}
```

### Phase 3 → Phase 4: Redux State Contract

**DocumentSearchState Shape** (MUST match exactly):

```typescript
interface DocumentSearchState {
  // Keywords state
  availableKeywords: string[]; // MUST be sorted, cached from service
  keywordsLoading: boolean; // MUST track async loading
  keywordsError: string | null; // MUST be null or error message

  // Search configuration
  currentKeywords: string[]; // MUST be subset of availableKeywords
  searchOperator: 'AND' | 'OR'; // MUST default to 'OR'

  // Search results
  searchResults: SearchableDocument[]; // MUST use exact SearchableDocument type
  searchLoading: boolean; // MUST track async search
  searchError: string | null; // MUST be null or error message

  // UI state
  isSearchActive: boolean; // MUST track modal/panel state
  selectedDocumentId: string | null; // MUST be valid document ID or null

  // Pagination
  resultsPerPage: number; // MUST be positive, default 20
  currentPage: number; // MUST be 1-based, default 1
  totalResults: number; // MUST equal searchResults.length

  // Cache metadata
  lastSearchTime: number | null; // MUST be timestamp or null
  cacheSize: number; // MUST track service cache size
}
```

**Required Actions** (MUST implement):

```typescript
// Synchronous actions
setSearchKeywords(keywords: string[]): void;
addSearchKeyword(keyword: string): void;
removeSearchKeyword(keyword: string): void;
setSearchOperator(operator: 'AND' | 'OR'): void;
setSearchActive(active: boolean): void;
selectDocument(documentId: string | null): void;
setCurrentPage(page: number): void;
setResultsPerPage(count: number): void;
clearSearch(): void;

// Async thunks
loadDocumentKeywords(): Promise<string[]>;
searchDocuments(params: {keywords: string[], operator: 'AND'|'OR'}): Promise<SearchableDocument[]>;
clearDocumentSearchCache(): Promise<void>;
```

**Required Selectors** (MUST provide):

```typescript
selectAvailableKeywords(state: AppState): string[];
selectCurrentSearch(state: AppState): {keywords: string[], operator: 'AND'|'OR', isActive: boolean};
selectSearchResults(state: AppState): SearchableDocument[];
selectPaginatedResults(state: AppState): PaginationResult;
selectSearchState(state: AppState): SearchStatus;
selectSelectedDocument(state: AppState): SearchableDocument | null;
```

### Cross-Phase Data Flow Contract

**Document ID Format** (MUST be consistent across all phases):

- Pattern: `"{caseId}-{documentNumber}-{attachmentNumber}"`
- CaseId: Positive integer matching existing case data
- DocumentNumber: String matching document.documentNumber
- AttachmentNumber: Non-negative integer matching document.attachmentNumber
- Examples: `"100877-1-0"`, `"234561-15-2"`

### Type Guard Contracts

**Required Validation Functions** (MUST implement):

```typescript
function isDocumentSearchKeywords(data: unknown): data is DocumentSearchKeywords;
function isDocumentSearchResult(data: unknown): data is DocumentSearchResult;
function isSearchableDocument(data: unknown): data is SearchableDocument;
function parseDocumentId(id: string): {
  caseId: number;
  documentNumber: string;
  attachmentNumber: number;
};
```

## Integration Points

Phases integrate through these contracts:

1. **File System Contracts**: Exact JSON structure and file organization
2. **Service Interface Contracts**: Precise method signatures and behavior
3. **State Shape Contracts**: Redux state structure and action interfaces
4. **Data Format Contracts**: Document ID format and type definitions

## Success Criteria

Each phase is complete when:

1. All deliverables implement required functionality
2. Independent testing demonstrates correctness
3. Output/interface contracts match specifications
4. Documentation covers usage and testing

