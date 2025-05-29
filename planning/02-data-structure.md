# Data Structure Documentation

## Overview

The application works with US federal court case data from the RECAP archive (Free Law Project). This consists of JSON metadata files and their corresponding PDF court documents.

## File Organization

```
data/                          # Production data (34K+ files)
├── docket-data/              # JSON metadata files
│   ├── 100877.json          # Each file = one legal case
│   ├── 1071272.json
│   └── ... (34,418 files)
└── sata/recap/               # PDF court documents
    ├── gov.uscourts.akb.30308/
    │   ├── gov.uscourts.akb.30308.1.0.pdf
    │   └── ...
    └── ... (30,000+ directories, 446,571 PDFs)

sample-data/                   # Development subset (10 cases)
├── docket-data/              # Same structure as production
└── sata/recap/               # PDFs for one case
```

## JSON File Structure

Each JSON file represents a complete legal case with 48 consistent top-level keys:

### Key Fields for This Application

```typescript
{
  "id": 100877,                    // Unique case identifier
  "case_name": "Ditech Holding Corporation",
  "case_name_short": "Ditech Holdings",
  "court": "nysb",                 // Court code
  "date_filed": "2019-02-11",      // Filing date
  "date_terminated": null,         // Null = still open
  "pacer_case_id": "290325",       // PACER system ID
  
  "docket_entries": [              // Array of all filings
    {
      "entry_number": 1,
      "date_filed": "2019-02-11",
      "description": "Voluntary Petition...",
      "recap_documents": [         // Documents for this entry
        {
          "document_number": "1",
          "description": "Voluntary Petition (Chapter 11)",
          "filepath_local": "recap/gov.uscourts.nysb.290325/gov.uscourts.nysb.290325.1.0_1.pdf",
          "page_count": 67,
          "file_size": 549286,
          "is_available": true,    // PDF exists
          "sha1": "abc123..."      // File verification
        }
      ]
    }
  ]
}
```

## PDF File Naming Convention

PDFs follow a strict naming pattern:

```
gov.uscourts.[court].[pacer_case_id].[doc_num].[attach_num].pdf

Example:
gov.uscourts.nysb.290325.1.0.pdf
            │    │       │ │
            │    │       │ └── Attachment number (0 = main doc)
            │    │       └──── Document number
            │    └──────────── PACER case ID
            └───────────────── Court code
```

## Data Relationships

1. **JSON → PDF Linking**:
   - JSON `filepath_local` field contains exact path to PDF
   - Only documents with `is_available: true` have PDFs

2. **Case Organization**:
   - Each case has one JSON file
   - Each case may have multiple PDF files in one directory
   - PDF directory name matches the case's court and PACER ID

## Court Codes

Common federal court codes in the data:
- `nysb` - New York Southern Bankruptcy
- `cacd` - California Central District
- `kyed` - Kentucky Eastern District
- `wiwd` - Wisconsin Western District
- (and many more)

## For Development

The `sample-data/` directory contains:
- 10 representative JSON files
- 50 PDF files from one case
- Same structure as production data
- Carefully selected for variety and reasonable size

This allows development without handling 446,571 PDF files.