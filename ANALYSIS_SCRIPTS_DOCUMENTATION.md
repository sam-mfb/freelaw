# Analysis Scripts Documentation

This repository contains two Python scripts for analyzing the structure of legal docket JSON files from the RECAP archive.

## Scripts Overview

### 1. `analyze_json.py`
**Purpose**: Provides a high-level overview of all JSON files in the directory, comparing their structure and identifying common patterns.

**Features**:
- Analyzes file size and structure
- Identifies top-level data types
- Examines nested structures (docket_entries, recap_documents)
- Compares structure across multiple files
- Generates a summary of findings

**Usage**:
```bash
python3 analyze_json.py
```

**Output Includes**:
- File size for each JSON
- Number of top-level keys
- Data types for first 15 fields
- Analysis of array lengths (docket_entries, parties, etc.)
- Sample structure of nested objects
- Summary of common patterns

### 2. `detailed_analysis.py`
**Purpose**: Performs an in-depth analysis of a single JSON file to understand all fields and their values.

**Features**:
- Lists all case metadata fields with sample values
- Identifies and analyzes date fields
- Examines party and attorney information
- Shows actual data examples for context

**Usage**:
```bash
python3 detailed_analysis.py
```

**Output Includes**:
- Complete field list with types and sample values
- Array field lengths
- All date fields and their values
- Sample party and attorney records

## Key Functions

### analyze_json.py

```python
def analyze_json_file(filename):
    """
    Analyzes a single JSON file and prints:
    - File size
    - Top-level structure type
    - Number of keys (for objects)
    - Field names and types
    - Nested array analysis
    """
```

**Analysis Flow**:
1. Load JSON file
2. Determine top-level type (object/array)
3. For objects: count and list keys with types
4. For arrays: show length and sample values
5. Recursively analyze nested structures
6. Special handling for `docket_entries` and `recap_documents`

### detailed_analysis.py

**Analysis Focus**:
1. **Case Metadata**: All non-array fields with sample values
2. **Date Fields**: Extracts all date-related fields to understand timeline
3. **Array Fields**: Lists all arrays with their lengths
4. **Parties & Attorneys**: Shows first 3 entries of each with key fields

## Dependencies
- Python 3.x
- `json` module (standard library)
- `os` module (standard library)
- `collections.defaultdict` (standard library)

## Example Output

### From analyze_json.py:
```
=== 4179280.json ===
File size: 354.3 KB
Top-level type: dict
Number of keys: 48

Top-level keys and types:
  - absolute_url: str
  - appeal_from: NoneType
  - assigned_to: int
  - case_name: str
  - docket_entries: list (length: 222)
  ...

Analyzing 'docket_entries' (array of 222 items):
  Sample entry keys:
    - date_created: str
    - date_filed: str
    - description: str
    - recap_documents: list (length: 2)
```

### From detailed_analysis.py:
```
=== COMPLETE FIELD LIST ===

Case Metadata Fields:
  - absolute_url: str - '/docket/4179280/bruton-v-gerber-products-company/'
  - assigned_to: int - 1808
  - assigned_to_str: str - 'Lucy H. Koh'
  - case_name: str - 'Bruton v. Gerber Products Company'
  ...

=== DATE FIELDS ===
  - date_created: 2016-08-20T08:26:53.431152Z
  - date_filed: 2012-05-11
  - date_terminated: 2018-09-26
```

## Use Cases

1. **Data Validation**: Verify JSON files follow expected schema
2. **Documentation**: Generate field lists for API documentation
3. **Data Migration**: Understand structure before database import
4. **Quality Assurance**: Check for missing or malformed data
5. **Development**: Understand data structure for application development

## Notes

- Scripts are read-only and do not modify JSON files
- Designed for RECAP archive legal docket data
- Can be adapted for other JSON datasets by modifying field names
- Memory-efficient: reads files sequentially
- Handles large files (tested up to 6.6MB)

## Future Enhancements

Potential improvements:
- Add command-line arguments for specific file analysis
- Export findings to CSV/JSON format
- Statistical analysis of field usage
- Schema validation against a template
- Batch processing with progress indicators