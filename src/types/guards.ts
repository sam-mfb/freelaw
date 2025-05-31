import type { RawCaseData, RawDocketEntry, RawRecapDocument, CaseIndex } from './index.types';
import type { CaseSummary } from './case.types';
import type { Court } from './court.types';
import type { Document } from './document.types';

export function isRawRecapDocument(obj: unknown): obj is RawRecapDocument {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const doc = obj as Record<string, unknown>;

  return (
    typeof doc.id === 'number' &&
    typeof doc.document_number === 'string' &&
    typeof doc.is_available === 'boolean' &&
    (doc.filepath_local === undefined ||
      doc.filepath_local === null ||
      typeof doc.filepath_local === 'string') &&
    (doc.description === undefined ||
      doc.description === null ||
      typeof doc.description === 'string') &&
    (doc.page_count === undefined ||
      doc.page_count === null ||
      typeof doc.page_count === 'number') &&
    (doc.file_size === undefined || doc.file_size === null || typeof doc.file_size === 'number') &&
    (doc.sha1 === undefined || doc.sha1 === null || typeof doc.sha1 === 'string')
  );
}

export function isRawDocketEntry(obj: unknown): obj is RawDocketEntry {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const entry = obj as Record<string, unknown>;

  if (typeof entry.id !== 'number') {
    return false;
  }

  if (entry.date_entered !== undefined && typeof entry.date_entered !== 'string') {
    return false;
  }

  if (entry.recap_documents !== undefined) {
    if (!Array.isArray(entry.recap_documents)) {
      return false;
    }

    return entry.recap_documents.every((doc) => isRawRecapDocument(doc));
  }

  return true;
}

export function isRawCaseData(obj: unknown): obj is RawCaseData {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const caseData = obj as Record<string, unknown>;

  // Required fields
  if (typeof caseData.id !== 'number') {
    return false;
  }

  // Optional string fields
  const optionalStringFields = [
    'case_name',
    'case_name_short',
    'court',
    'date_filed',
    'date_terminated',
  ];

  for (const field of optionalStringFields) {
    if (
      caseData[field] !== undefined &&
      caseData[field] !== null &&
      typeof caseData[field] !== 'string'
    ) {
      return false;
    }
  }

  // Check docket_entries if present
  if (caseData.docket_entries !== undefined) {
    if (!Array.isArray(caseData.docket_entries)) {
      return false;
    }

    return caseData.docket_entries.every((entry) => isRawDocketEntry(entry));
  }

  return true;
}

export function isCaseSummary(obj: unknown): obj is CaseSummary {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const summary = obj as Record<string, unknown>;

  return (
    typeof summary.id === 'number' &&
    typeof summary.name === 'string' &&
    typeof summary.nameShort === 'string' &&
    typeof summary.court === 'string' &&
    typeof summary.filed === 'string' &&
    (summary.terminated === null || typeof summary.terminated === 'string') &&
    typeof summary.docCount === 'number' &&
    typeof summary.availCount === 'number'
  );
}

export function isCourt(obj: unknown): obj is Court {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const court = obj as Record<string, unknown>;

  return typeof court.code === 'string' && typeof court.name === 'string';
}

export function isCaseIndex(obj: unknown): obj is CaseIndex {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const index = obj as Record<string, unknown>;

  // Check cases array
  if (!Array.isArray(index.cases) || !index.cases.every((case_) => isCaseSummary(case_))) {
    return false;
  }

  // Check courts array
  if (!Array.isArray(index.courts) || !index.courts.every((court) => isCourt(court))) {
    return false;
  }

  // Check dateRange
  if (!index.dateRange || typeof index.dateRange !== 'object') {
    return false;
  }

  const dateRange = index.dateRange as Record<string, unknown>;
  return typeof dateRange.min === 'string' && typeof dateRange.max === 'string';
}

export function isDocument(obj: unknown): obj is Document {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const doc = obj as Record<string, unknown>;

  return (
    typeof doc.id === 'number' &&
    typeof doc.entryNumber === 'number' &&
    typeof doc.documentNumber === 'string' &&
    typeof doc.description === 'string' &&
    typeof doc.dateFiled === 'string' &&
    (doc.pageCount === null || typeof doc.pageCount === 'number') &&
    (doc.fileSize === null || typeof doc.fileSize === 'number') &&
    (doc.filePath === null || typeof doc.filePath === 'string') &&
    typeof doc.sha1 === 'string'
  );
}

export function isDocumentArray(obj: unknown): obj is Document[] {
  return Array.isArray(obj) && obj.every((doc) => isDocument(doc));
}

/**
 * Safely parse JSON and cast to unknown to force type checking
 */
export async function safeJsonParse(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
