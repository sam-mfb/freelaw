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

export interface SearchableDocument {
  id: string;
  caseId: number;
  documentNumber: string;
  attachmentNumber: number;
  description: string;
  caseName: string;
  court: string;
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
}
