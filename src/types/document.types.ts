export interface Document {
  id: number;
  entryNumber: number;
  documentNumber: string;
  description: string;
  dateFiled: string;
  pageCount: number | null;
  fileSize: number | null;
  filePath: string | null;
  sha1: string;
}


export interface DocketEntry {
  recap_documents: RecapDocument[];
  entry_number: number;
  description: string;
  date_entered: string;
}

export interface RecapDocument {
  id: number;
  document_number: string;
  description: string;
  page_count: number | null;
  file_size: number | null;
  filepath_local: string | null;
  is_available: boolean;
  sha1: string;
  attachment_number?: number;
}

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
  attachmentNumber: number | null;
  description: string;
  caseName: string;
  court: string;
  dateCreated?: string;
  filePath?: string;
  pageCount?: number;
  fileSize?: number;
}

export interface DocumentSearchCache {
  keywords: string[] | null;
  keywordFiles: Map<string, string[]>;
  resolvedDocuments: Map<string, SearchableDocument>;
}
