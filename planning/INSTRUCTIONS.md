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
  "documentIds": [
    "100877-1-0",
    "234561-5-0", 
    "234561-12-1",
    "789012-8-0"
  ]
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
  id: string;           // "caseId-docNum-attachNum" 
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
  const normalized = description.toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Remove punctuation
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();
    
  // Extract meaningful terms (2+ characters, not common words)
  const words = normalized.split(' ')
    .filter(word => word.length >= 2)
    .filter(word => !STOP_WORDS.includes(word));
    
  return [...new Set(words)]; // Deduplicate
}
```

## File Organization

Each phase will maintain its own files and tests:

```
planning/
├── INSTRUCTIONS.md           # This file
├── phase-1.md               # Index building implementation  
├── phase-2.md               # Data service implementation
├── phase-3.md               # Redux store implementation
└── phase-4.md               # React UI implementation

scripts/
└── buildDocumentSearchIndex.ts  # New index builder (Phase 1)

src/services/
└── documentSearchService.ts     # New service methods (Phase 2)

src/store/ 
└── documentSearchSlice.ts       # New Redux slice (Phase 3)

src/components/
├── DocumentSearch.tsx           # Search interface (Phase 4)
└── DocumentSearchResults.tsx    # Results display (Phase 4)
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

## Integration Points

While phases are independent, they will integrate via:

1. **Shared type definitions** (defined in this document)
2. **File format contracts** (JSON schemas)
3. **API interface contracts** (service method signatures)
4. **State shape contracts** (Redux state structure)

## Success Criteria

Each phase is complete when:
1. All deliverables implement required functionality
2. Independent testing demonstrates correctness
3. Output/interface contracts match specifications
4. Documentation covers usage and testing

## Next Steps

1. Review this plan for technical accuracy
2. Implement phases in parallel or sequence as preferred
3. Test each phase independently before integration
4. Integrate phases incrementally to minimize risk