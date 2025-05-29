# Legal Docket Data Structure Overview

## Repository Contents

This repository contains US federal court case data from the RECAP archive (Free Law Project), consisting of structured JSON metadata files and their corresponding PDF court documents.

### File Statistics
- **JSON Files**: 34,418 files in `/data/docket-data/`
- **PDF Files**: 446,571 files in `/data/sata/recap/`
- **Total Size**: Multiple gigabytes of legal documents

## Directory Structure

```
/home/devuser/freelaw/
├── data/
│   ├── docket-data/          # JSON metadata files
│   │   ├── 100877.json
│   │   ├── 1071272.json
│   │   ├── 1073432.json
│   │   └── ... (34,418 files)
│   └── sata/recap/           # PDF court documents
│       ├── gov.uscourts.akb.30308/
│       │   ├── gov.uscourts.akb.30308.1.0.pdf
│       │   ├── gov.uscourts.akb.30308.101.0.pdf
│       │   └── ...
│       ├── gov.uscourts.akd.47038/
│       │   └── ...
│       └── ... (30,000+ case directories)
```

## File Naming Conventions

### JSON Files
- **Format**: `[case_id].json`
- **Example**: `100877.json`
- The numeric filename corresponds to the unique case identifier in the RECAP system

### PDF Files
- **Directory Format**: `gov.uscourts.[court_code].[pacer_case_id]/`
- **File Format**: `gov.uscourts.[court_code].[pacer_case_id].[document_number].[attachment_number].pdf`
- **Example**: `gov.uscourts.nysb.290325.1.0_1.pdf`

Where:
- `court_code`: Federal court identifier (e.g., `nysb` = New York Southern Bankruptcy)
- `pacer_case_id`: PACER system case identifier
- `document_number`: Sequential document entry number in the docket
- `attachment_number`: Attachment identifier (0 for main document, 1+ for attachments)

## Data Relationship Model

### JSON → PDF Linkage

Each JSON file contains references to its associated PDF documents through the following structure:

```json
{
  "id": 100877,
  "court": "nysb",
  "pacer_case_id": "290325",
  "docket_entries": [
    {
      "entry_number": 1,
      "recap_documents": [
        {
          "document_number": "1",
          "attachment_number": 0,
          "filepath_local": "recap/gov.uscourts.nysb.290325/gov.uscourts.nysb.290325.1.0_1.pdf",
          "pacer_doc_id": "126019601549",
          "description": "Voluntary Petition (Chapter 11)",
          "page_count": 67,
          "file_size": 549286,
          "sha1": "abc123...",
          "is_available": true
        }
      ]
    }
  ]
}
```

### Key Relationships

1. **Case Identification**
   - JSON `id` = Filename of JSON file
   - JSON `pacer_case_id` = Case ID in PDF directory name
   - JSON `court` = Court code in PDF filenames

2. **Document Mapping**
   - JSON `recap_documents[].filepath_local` → Exact PDF file path
   - JSON `recap_documents[].document_number` → Document number in PDF filename
   - JSON `recap_documents[].attachment_number` → Attachment number in PDF filename

3. **Metadata Enhancement**
   - JSON provides searchable text descriptions for each PDF
   - JSON includes filing dates, parties, attorneys for each document
   - JSON contains document metrics (page count, file size, SHA1 hash)

## Court Codes

Common federal court codes found in the data:

- `akb` - Alaska Bankruptcy Court
- `akd` - Alaska District Court
- `almd` - Alabama Middle District Court
- `alnd` - Alabama Northern District Court
- `alnb` - Alabama Northern Bankruptcy Court
- `nysb` - New York Southern Bankruptcy Court
- ... (and many more)

## Use Cases

### 1. Finding Documents for a Specific Case
1. Load the JSON file by case ID
2. Navigate to `docket_entries` array
3. Access `recap_documents` for each entry
4. Use `filepath_local` to locate the PDF

### 2. Searching by Party or Attorney
1. Search across JSON files for party/attorney names
2. Identify relevant case IDs
3. Follow document references to PDFs

### 3. Analyzing Case Timelines
1. Use JSON `date_filed` fields in docket entries
2. Build chronological document history
3. Access specific documents as needed

### 4. Document Verification
1. Use SHA1 hashes in JSON to verify PDF integrity
2. Check `is_available` flag before attempting access
3. Validate page counts and file sizes

## Data Quality Notes

- **Consistency**: All JSON files follow identical schema (48 top-level keys)
- **Completeness**: Not all referenced PDFs may be available (check `is_available` flag)
- **Sealed Documents**: Some documents may be sealed (`is_sealed` flag)
- **File Sizes**: JSON files range from 328KB to 6.6MB depending on case complexity

## Technical Considerations

### Performance
- Large number of files may require indexed search solutions
- Consider using streaming JSON parsers for large files
- PDF directories contain varying numbers of documents (1 to 1000+)

### Storage
- PDF files are organized hierarchically to avoid filesystem limitations
- Total storage requirements exceed several gigabytes

### Access Patterns
- Random access: Use case ID for direct JSON lookup
- Sequential processing: Iterate through docket-data directory
- Batch operations: Process court-specific subdirectories

## Related Documentation

- `JSON_STRUCTURE_DOCUMENTATION.md` - Detailed JSON schema documentation
- `ANALYSIS_SCRIPTS_DOCUMENTATION.md` - Python analysis tools documentation
- `analyze_json.py` - Script for analyzing JSON structure
- `detailed_analysis.py` - Script for detailed single-file analysis

## Data Source

This data comes from the RECAP Archive, a project of the Free Law Project that provides free access to federal court documents. The archive is built from documents donated by users of the RECAP browser extension and other sources.

For more information: https://free.law/recap/