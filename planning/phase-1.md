# Phase 1: Document Search Index Building

## Index Creation Flow Overview

The optimized index building process follows this single-pass architecture:

```
Input: JSON files (35K+ case files)
   ↓
Single File Processing Loop:
   ├── Read case JSON file
   ├── Extract case summary (existing logic)
   ├── Extract document keywords (new logic)  
   └── Discard file data from memory
   ↓
Output Generation:
   ├── Write case-index.json (existing)
   └── Write document-search/ directory (new)
       ├── keywords.json
       └── keywords/*.json files
```

**Key principle**: Process each file once, extract both case and document data, immediately discard file from memory.

**Memory profile**: O(unique_keywords) instead of O(total_documents)

**I/O profile**: Single read per file instead of double read

## Deliverables
1. **Enhanced `buildIndex.ts`** - Add document search index generation
2. **New script `buildDocumentSearchIndex.ts`** - Standalone document index builder
3. **Keyword extraction utilities** - Extract searchable terms from document descriptions
4. **Output validation** - Ensure generated indices match expected schema

## Output Structure

### Directory Layout
```
public/data/document-search/
├── keywords.json              # Master keywords list
└── keywords/
    ├── deposition.json       # Documents containing "deposition"
    ├── motion.json           # Documents containing "motion"  
    ├── summary.json          # Documents containing "summary"
    └── ... (one file per keyword)
```

### File Formats

#### keywords.json
```json
{
  "keywords": [
    "deposition", 
    "motion", 
    "summary",
    "judgment",
    "order"
  ]
}
```

#### keywords/{keyword}.json
```json
{
  "keyword": "deposition",
  "documentIds": [
    "100877-1-0",
    "234561-5-0", 
    "234561-12-1"
  ]
}
```

## Implementation

### Abstracted Business Logic

Extract processing logic into separate functions to eliminate code duplication:

```typescript
// Core business logic functions
function processCaseForIndices(
  caseData: RawCaseData,
  caseCollector: CaseSummary[],
  keywordCollector: Map<string, Set<string>>
): void {
  // Extract case summary (existing logic)
  const caseSummary = processCaseSummary(caseData);
  caseCollector.push(caseSummary);
  
  // Extract document keywords (new logic)
  processDocumentsForKeywords(caseData, keywordCollector);
}

function processDocumentsForKeywords(
  caseData: RawCaseData, 
  keywordIndex: Map<string, Set<string>>
): void {
  if (!caseData.docket_entries) return;
  
  for (const entry of caseData.docket_entries) {
    if (!entry.recap_documents) continue;
    
    for (const doc of entry.recap_documents) {
      if (!doc.is_available || !doc.description) continue;
      
      const documentId = createDocumentId(
        caseData.id,
        doc.document_number || '0',
        doc.attachment_number || 0
      );
      
      const keywords = extractKeywords(doc.description);
      
      for (const keyword of keywords) {
        if (!keywordIndex.has(keyword)) {
          keywordIndex.set(keyword, new Set());
        }
        keywordIndex.get(keyword)!.add(documentId);
      }
    }
  }
}

async function processAllFiles(
  config: BuildConfig,
  options: { 
    includeCaseIndex?: boolean;
    includeDocumentSearch?: boolean;
    progressCallback?: (processed: number, total: number) => void;
  } = {}
): Promise<{ 
  cases: CaseSummary[];
  keywordIndex: Map<string, Set<string>>;
}> {
  const cases: CaseSummary[] = [];
  const keywordIndex = new Map<string, Set<string>>();
  
  const files = await fs.readdir(config.jsonDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  for (let i = 0; i < jsonFiles.length; i++) {
    const file = jsonFiles[i];
    const filePath = path.join(config.jsonDir, file);
    
    const caseData = await readJsonFile(filePath);
    if (!caseData) continue;
    
    // Use shared business logic
    processCaseForIndices(
      caseData,
      options.includeCaseIndex !== false ? cases : [],
      options.includeDocumentSearch !== false ? keywordIndex : new Map()
    );
    
    // Progress reporting
    if (options.progressCallback && i % 1000 === 0) {
      options.progressCallback(i, jsonFiles.length);
    }
    
    // Memory management for large datasets
    if (i % 5000 === 0 && global.gc) {
      global.gc();
    }
  }
  
  return { cases, keywordIndex };
}
```

### Enhanced buildIndex.ts (Full Index Builder)

```typescript
// Enhanced version that builds both indices
async function buildIndicesOptimized(config: BuildConfig): Promise<void> {
  console.log('Building all indices...');
  
  const { cases, keywordIndex } = await processAllFiles(config, {
    includeCaseIndex: true,
    includeDocumentSearch: true,
    progressCallback: (processed, total) => {
      if (processed % 1000 === 0) {
        console.log(`Processed ${processed}/${total} files...`);
      }
    }
  });
  
  // Write both indices in parallel
  await Promise.all([
    writeCaseIndex(config, cases),
    writeDocumentSearchIndex(config, keywordIndex)
  ]);
  
  console.log(`Complete! ${cases.length} cases, ${keywordIndex.size} keywords`);
}
```

### Standalone Document Search Builder

```typescript
// Standalone script - reuses same business logic
async function buildDocumentSearchIndexStandalone(config: BuildConfig): Promise<void> {
  console.log('Building document search index (standalone)...');
  
  const { keywordIndex } = await processAllFiles(config, {
    includeCaseIndex: false,      // Skip case processing
    includeDocumentSearch: true,
    progressCallback: (processed, total) => {
      console.log(`Processed ${processed}/${total} files...`);
    }
  });
  
  await writeDocumentSearchIndex(config, keywordIndex);
  
  console.log(`Document search index complete! ${keywordIndex.size} keywords`);
}
```

### Keyword Extraction Logic

Create `scripts/extractKeywords.ts`:

```typescript
const STOP_WORDS = new Set([
  'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
  'by', 'a', 'an', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could'
]);

const LEGAL_KEYWORDS = new Set([
  'motion', 'order', 'deposition', 'brief', 'complaint', 'answer', 'response',
  'reply', 'summary', 'judgment', 'injunction', 'discovery', 'settlement',
  'hearing', 'trial', 'appeal', 'filing', 'conference', 'notice', 'objection'
]);

export function extractKeywords(description: string): string[] {
  // Normalize text
  const normalized = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')   // Remove punctuation
    .replace(/\s+/g, ' ')       // Normalize whitespace
    .trim();
  
  // Split into words and filter
  const words = normalized.split(' ')
    .filter(word => word.length >= 3)              // Minimum length
    .filter(word => !STOP_WORDS.has(word))         // Remove stop words
    .filter(word => /^[a-z]+$/.test(word));        // Only alphabetic
  
  // Prioritize legal terms, include common words
  const keywords = new Set<string>();
  
  for (const word of words) {
    if (LEGAL_KEYWORDS.has(word)) {
      keywords.add(word);
    } else if (word.length >= 4) {  // Longer words for non-legal terms
      keywords.add(word);
    }
  }
  
  return Array.from(keywords).sort();
}

export function createDocumentId(
  caseId: number, 
  documentNumber: string, 
  attachmentNumber: number
): string {
  return `${caseId}-${documentNumber}-${attachmentNumber}`;
}

export function parseDocumentId(documentId: string): {
  caseId: number;
  documentNumber: string; 
  attachmentNumber: number;
} {
  const parts = documentId.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid document ID format: ${documentId}`);
  }
  
  return {
    caseId: parseInt(parts[0], 10),
    documentNumber: parts[1],
    attachmentNumber: parseInt(parts[2], 10)
  };
}
```

### Output Writing Functions

```typescript
async function writeDocumentSearchIndex(
  config: BuildConfig, 
  keywordIndex: Map<string, Set<string>>
): Promise<void> {
  const searchDir = path.join(config.outputDir, 'document-search');
  const keywordsDir = path.join(searchDir, 'keywords');
  
  await ensureDirectoryExists(searchDir);
  await ensureDirectoryExists(keywordsDir);
  
  // Write master keywords list
  const allKeywords = Array.from(keywordIndex.keys()).sort();
  const keywordsFile = {
    keywords: allKeywords
  };
  
  await fs.writeFile(
    path.join(searchDir, 'keywords.json'),
    JSON.stringify(keywordsFile, null, 2)
  );
  
  // Write individual keyword files
  for (const [keyword, documentIds] of keywordIndex.entries()) {
    const keywordFile = {
      keyword,
      documentIds: Array.from(documentIds).sort()
    };
    
    await fs.writeFile(
      path.join(keywordsDir, `${keyword}.json`),
      JSON.stringify(keywordFile, null, 2)
    );
  }
  
  console.log(`Document search index complete!`);
  console.log(`- Found ${allKeywords.length} unique keywords`);
  console.log(`- Indexed ${Array.from(keywordIndex.values()).reduce((sum, set) => sum + set.size, 0)} document references`);
}
```

## Incremental Index Building

For very large datasets, support incremental building:

```typescript
interface IndexState {
  processedFiles: Set<string>;
  keywordIndex: Map<string, Set<string>>;
  lastModified: number;
}

async function buildIndicesIncremental(config: BuildConfig): Promise<void> {
  // Load existing state
  const stateFile = path.join(config.outputDir, '.index-state.json');
  let state = await loadIndexState(stateFile);
  
  const files = await fs.readdir(config.jsonDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  // Only process new/modified files
  const filesToProcess = [];
  for (const file of jsonFiles) {
    if (!state.processedFiles.has(file)) {
      const stats = await fs.stat(path.join(config.jsonDir, file));
      if (stats.mtimeMs > state.lastModified) {
        filesToProcess.push(file);
      }
    }
  }
  
  console.log(`Processing ${filesToProcess.length} new/modified files...`);
  
  for (const file of filesToProcess) {
    // Process file...
    state.processedFiles.add(file);
  }
  
  // Save state and indices
  await saveIndexState(stateFile, state);
  await writeDocumentSearchIndex(config, state.keywordIndex);
}
```

## Testing Strategy

### 1. Schema Validation

Create `scripts/__tests__/documentSearchIndex.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Document Search Index Output', () => {
  const outputDir = './public/data/document-search';
  
  it('should create keywords.json with correct structure', async () => {
    const keywordsPath = path.join(outputDir, 'keywords.json');
    const exists = await fs.access(keywordsPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
    
    const content = await fs.readFile(keywordsPath, 'utf-8');
    const data = JSON.parse(content);
    
    expect(data).toHaveProperty('keywords');
    expect(Array.isArray(data.keywords)).toBe(true);
    expect(data.keywords.length).toBeGreaterThan(0);
  });
  
  it('should create individual keyword files', async () => {
    // Test that keyword files exist and have correct structure
  });
  
  it('should have valid document ID format', async () => {
    // Test document ID parsing
  });
});
```

### 2. Keyword Extraction Testing

```typescript
describe('Keyword Extraction', () => {
  it('should extract legal keywords correctly', () => {
    const description = "Motion for Summary Judgment on Patent Claims";
    const keywords = extractKeywords(description);
    
    expect(keywords).toContain('motion');
    expect(keywords).toContain('summary');
    expect(keywords).toContain('judgment');
    expect(keywords).toContain('patent');
  });
  
  it('should filter stop words', () => {
    const description = "The Motion for the Summary";
    const keywords = extractKeywords(description);
    
    expect(keywords).not.toContain('the');
    expect(keywords).not.toContain('for');
  });
});
```

### 3. Manual Verification

Create test script to verify output:

```bash
# Build index with sample data
npm run build:document-search:sample

# Verify structure
ls -la public/data/document-search/
ls -la public/data/document-search/keywords/

# Check file contents
cat public/data/document-search/keywords.json | jq '.keywords | length'
cat public/data/document-search/keywords/motion.json | jq '.documentIds | length'
```

## Package.json Scripts

Add to package.json:

```json
{
  "scripts": {
    "build:document-search": "vite-node scripts/buildDocumentSearchIndex.ts",
    "build:document-search:sample": "vite-node scripts/buildDocumentSearchIndex.ts --data-dir=./sample-data",
    "build:index:full": "npm run build:index && npm run build:document-search"
  }
}
```

## Estimated Performance Impact

### For 500K Documents (~35K Cases)
- **Memory**: ~50-100MB (just keyword index)
- **Time**: Single-pass processing
- **Scalability**: Linear with file count

## Success Criteria

Phase 1 is complete when:

1. ✅ **Index Generation**: Running `npm run build:document-search:sample` creates expected directory structure
2. ✅ **File Validation**: Generated JSON files pass schema validation tests  
3. ✅ **Keyword Quality**: Manual inspection shows relevant legal terms extracted
4. ✅ **Document IDs**: All document IDs follow `caseId-docNum-attachNum` pattern
5. ✅ **Performance**: Index builds in reasonable time (<30 seconds for sample data)

## Independence Verification

This phase can be developed and tested without phases 2-4:

- **Input**: Uses existing JSON files from `sample-data/docket-data/`
- **Output**: Static files in `public/data/document-search/`
- **Testing**: File system validation and content inspection
- **Integration**: None required - purely builds files for later consumption

## Files Created/Modified

- `scripts/extractKeywords.ts` (new)
- `scripts/buildDocumentSearchIndex.ts` (new)  
- `scripts/buildIndex.ts` (enhanced)
- `scripts/__tests__/documentSearchIndex.test.ts` (new)
- `package.json` (add scripts)