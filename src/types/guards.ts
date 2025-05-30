import type { RawCaseData, RawDocketEntry, RawRecapDocument } from './index.types';

export function isRawRecapDocument(obj: unknown): obj is RawRecapDocument {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const doc = obj as Record<string, unknown>;
  
  return (
    typeof doc.id === 'number' &&
    typeof doc.document_number === 'string' &&
    typeof doc.is_available === 'boolean' &&
    (doc.filepath_local === undefined || typeof doc.filepath_local === 'string') &&
    (doc.description === undefined || typeof doc.description === 'string') &&
    (doc.page_count === undefined || doc.page_count === null || typeof doc.page_count === 'number') &&
    (doc.file_size === undefined || doc.file_size === null || typeof doc.file_size === 'number') &&
    (doc.sha1 === undefined || typeof doc.sha1 === 'string')
  );
}

export function isRawDocketEntry(obj: unknown): obj is RawDocketEntry {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const entry = obj as Record<string, unknown>;
  
  if (typeof entry.entry_number !== 'number') {
    return false;
  }
  
  if (entry.date_entered !== undefined && typeof entry.date_entered !== 'string') {
    return false;
  }
  
  if (entry.recap_documents !== undefined) {
    if (!Array.isArray(entry.recap_documents)) {
      return false;
    }
    
    return entry.recap_documents.every(doc => isRawRecapDocument(doc));
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
    'date_terminated'
  ];
  
  for (const field of optionalStringFields) {
    if (caseData[field] !== undefined && typeof caseData[field] !== 'string') {
      return false;
    }
  }
  
  // Check docket_entries if present
  if (caseData.docket_entries !== undefined) {
    if (!Array.isArray(caseData.docket_entries)) {
      return false;
    }
    
    return caseData.docket_entries.every(entry => isRawDocketEntry(entry));
  }
  
  return true;
}