# Phase 1: Index Builder

## Objective

Create a script that preprocesses the JSON case files into smaller, searchable index files for fast client-side searching and filtering.

## Input/Output

**Input**:

- JSON files in `sample-data/docket-data/` (10 files for development)
- JSON files in `data/docket-data/` (34,418 files for production)

**Output**:

- `public/data/case-index.json` - Master index of all cases
- `public/data/documents/[caseId].json` - Document list for each case

## Implementation

### Script Location

`scripts/buildIndex.ts`

### Script Running

use `vite-node` to avoid needing an interim compile step

### Core Functionality

```typescript
interface BuildConfig {
  jsonDir: string; // Input directory
  outputDir: string; // Output directory
  pdfBaseDir: string; // PDF directory (for validation)
}

async function buildIndices(config: BuildConfig): Promise<void> {
  // 1. Read all JSON files from jsonDir
  // 2. For each JSON file:
  //    - Extract case summary for case-index.json
  //    - Extract available documents for documents/[id].json
  // 3. Build court list from unique court codes
  // 4. Calculate date range from all cases
  // 5. Write output files
}
```

### Output Format

**case-index.json**:

```json
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
  "courts": [{ "code": "nysb", "name": "New York Southern Bankruptcy" }],
  "dateRange": {
    "min": "2010-01-01",
    "max": "2023-12-31"
  }
}
```

**documents/[caseId].json**:

```json
[
  {
    "id": 60526958,
    "entryNumber": 1,
    "documentNumber": "1",
    "description": "Voluntary Petition (Chapter 11)",
    "dateFiled": "2019-02-11",
    "pageCount": 67,
    "fileSize": 549286,
    "filePath": "recap/gov.uscourts.nysb.290325/gov.uscourts.nysb.290325.1.0_1.pdf",
    "sha1": "abc123..."
  }
]
```

### Key Processing Rules

1. Only include documents where `is_available === true`
2. Only include documents with non-null `filepath_local`
3. Court names can be derived from court codes (provide mapping)
4. File sizes should be in KB/MB in the index for readability
5. Handle missing fields gracefully with defaults

## Package.json Scripts

```json
{
  "scripts": {
    "build:index": "tsx scripts/buildIndex.ts --data-dir=./data",
    "build:index:sample": "tsx scripts/buildIndex.ts --data-dir=./sample-data"
  }
}
```

## Testing

### Automated Test

```typescript
// scripts/testBuildIndex.ts
async function testIndexBuilder() {
  // 1. Run with sample-data
  await buildIndices({
    jsonDir: "./sample-data/docket-data",
    outputDir: "./test-output",
    pdfBaseDir: "./sample-data/sata",
  });

  // 2. Verify outputs
  const caseIndex = JSON.parse(
    await fs.readFile("./test-output/case-index.json", "utf-8"),
  );

  console.assert(caseIndex.cases.length === 10, "Should have 10 cases");
  console.assert(caseIndex.courts.length >= 8, "Should have multiple courts");
  console.assert(
    fs.existsSync("./test-output/documents/14560346.json"),
    "Should create document index",
  );

  console.log("✅ Phase 1: Index builder working correctly");
}
```

## Documentation

- Document the index format that will be consumed by other parts of the system
- This is the contract

### Manual Test

1. Run `npm run build:index:sample`
2. Check `public/data/case-index.json` exists with 10 cases
3. Check `public/data/documents/` has 10 JSON files
4. Verify one document file has correct structure

## Success Criteria

- [ ] Script processes all JSON files without errors
- [ ] case-index.json contains all cases with required fields
- [ ] Each case has a corresponding document file
- [ ] Only available documents are included
- [ ] Output files are valid JSON
- [ ] Script completes in reasonable time (<30s for sample data)

## Notes for Integration

- Other phases will consume these index files via HTTP fetch
- The index format is the contract - don't change without coordination
- Consider adding progress logging for production (34K files)
- Index files should be added to .gitignore

