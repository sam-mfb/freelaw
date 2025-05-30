# Legal Docket JSON Structure Documentation

## Overview
These JSON files contain US federal court case docket information from the RECAP archive (Free Law Project). Each file represents a single legal case with comprehensive metadata, docket entries, parties, and attorneys involved.

## File Characteristics
- **Format**: JSON objects (not arrays)
- **Size Range**: 328KB to 6.6MB
- **Consistent Structure**: All files have exactly 48 top-level keys
- **Naming Convention**: Numeric filenames (e.g., `4179280.json`) correspond to the case ID

## Top-Level Structure

### Case Identification
- `id` (int): Unique case identifier
- `docket_number` (str): Official court docket number (e.g., "5:12-cv-02412")
- `docket_number_core` (str): Core docket number without prefixes
- `case_name` (str): Full case name
- `case_name_full` (str): Extended case name with all parties
- `case_name_short` (str): Abbreviated case name
- `slug` (str): URL-friendly case name

### Court Information
- `court` (str): Court identifier code (e.g., "cand" for California Northern District)
- `assigned_to` (int): Judge ID
- `assigned_to_str` (str): Judge name
- `referred_to` (int/null): Referred judge/magistrate ID
- `referred_to_str` (str): Referred judge/magistrate name

### Case Type & Nature
- `nature_of_suit` (str): Type of legal action
- `cause` (str): Legal cause/statute
- `jurisdiction_type` (str): Jurisdiction basis (e.g., "Federal Question")
- `jury_demand` (str): Party requesting jury trial

### Important Dates
- `date_created` (str): When record was created in system
- `date_modified` (str): Last modification date
- `date_filed` (str): Case filing date
- `date_terminated` (str): Case closure date
- `date_last_filing` (str/null): Most recent filing
- `date_last_index` (str): Last indexing timestamp
- `date_argued` (str/null): Oral argument date
- `date_blocked` (str/null): If/when case was sealed
- `date_cert_denied` (str/null): Certiorari denial date
- `date_cert_granted` (str/null): Certiorari grant date
- `date_reargued` (str/null): Reargument date
- `date_reargument_denied` (str/null): Reargument denial date

### Appeal Information
- `appeal_from` (int/null): Lower court ID if appealed
- `appeal_from_str` (str): Lower court name
- `appellate_case_type_information` (str): Appeal type details
- `appellate_fee_status` (str): Fee status for appeals

### File Storage
- `filepath_local` (str): Local file system path
- `filepath_ia` (str): Internet Archive URL
- `filepath_ia_json` (str): Internet Archive JSON metadata URL
- `absolute_url` (str): Web URL for case page

### Arrays (Variable Length)
1. **`docket_entries`** (array): Chronological list of all case filings
2. **`parties`** (array): All parties involved in the case
3. **`attorneys`** (array): Legal representatives
4. **`claims`** (array): Legal claims made
5. **`panel`** (array): Judges panel (for appellate cases)
6. **`court_citations`** (array): Court citations
7. **`other_dates`** (array): Additional relevant dates

### Other Metadata
- `source` (int): Data source identifier
- `blocked` (bool): Whether case is sealed/blocked
- `mdl_status` (str): Multi-district litigation status
- `bankruptcy_information` (dict/null): Bankruptcy details if applicable
- `idb_data` (dict): Internal database metadata
- `original_court_info` (dict/null): Original court information
- `pacer_case_id` (str): PACER system case ID

## Nested Structures

### Docket Entries Structure
Each item in `docket_entries` contains:
- `id` (int): Entry ID
- `entry_number` (int): Sequential entry number
- `date_created` (str): Creation timestamp
- `date_modified` (str): Modification timestamp
- `date_filed` (str): Filing date
- `description` (str): Entry description
- `pacer_sequence_number` (int/null): PACER sequence
- `recap_sequence_number` (str): RECAP sequence
- `recap_documents` (array): Associated documents

### RECAP Documents Structure
Each document in `recap_documents` contains:
- `id` (int): Document ID
- `document_number` (str): Document number
- `attachment_number` (int/null): Attachment number if applicable
- `pacer_doc_id` (str): PACER document ID
- `description` (str): Document description
- `document_type` (int): Document type code
- `absolute_url` (str): Web URL
- `date_created` (str): Creation timestamp
- `date_modified` (str): Modification timestamp
- `date_upload` (str/null): Upload date
- `sha1` (str): SHA1 hash of document
- `page_count` (int/null): Number of pages
- `file_size` (int/null): File size in bytes
- `filepath_local` (str/null): Local file path
- `filepath_ia` (str): Internet Archive URL
- `is_available` (bool): Availability status
- `is_free_on_pacer` (bool/null): Free availability on PACER
- `is_sealed` (bool/null): Sealed status
- `thumbnail` (str/null): Thumbnail URL
- `thumbnail_status` (int): Thumbnail generation status
- `ocr_status` (int/null): OCR processing status
- `ia_upload_failure_count` (int/null): Upload failure count

### Parties Structure
Each party in `parties` contains:
- `id` (int): Party ID
- `name` (str): Party name
- `type` (int): Party type code
- `date_created` (str): Creation timestamp
- `date_modified` (str): Modification timestamp
- `extra_info` (str): Additional information
- `attorneys` (array): Representing attorneys

### Attorneys Structure
Each attorney contains:
- `id` (int): Attorney ID
- `name` (str): Attorney name
- `contact_raw` (str): Full contact information
- `phone` (str): Phone number
- `fax` (str): Fax number
- `email` (str): Email address
- `date_created` (str): Creation timestamp
- `date_modified` (str): Modification timestamp
- `roles` (array): Attorney roles in the case

## Data Patterns
- **Consistent Schema**: All analyzed files follow identical structure
- **Timestamps**: ISO 8601 format with timezone (Z suffix)
- **Null Handling**: Fields use `null` for missing data
- **File Sizes**: Correlate with number of docket entries
  - Smaller files (~300-400KB): 200-300 docket entries
  - Larger files (~6MB+): Fewer entries but more documents per entry

## Usage Notes
1. The `id` field serves as the primary identifier
2. `docket_entries` are chronologically ordered by `date_filed`
3. Document availability indicated by `is_available` flag
4. Some documents may be sealed (`is_sealed`)
5. Internet Archive URLs provide backup access to documents
6. PACER IDs enable cross-referencing with official court system