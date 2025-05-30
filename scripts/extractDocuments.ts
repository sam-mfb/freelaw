import type { RawCaseData } from '../src/types/index.types';
import type { Document } from '../src/types/document.types';

export function extractDocuments(caseData: RawCaseData): Document[] {
  const documents: Document[] = [];

  if (caseData.docket_entries) {
    for (const entry of caseData.docket_entries) {
      if (entry.recap_documents) {
        for (const doc of entry.recap_documents) {
          if (doc.is_available && doc.filepath_local) {
            documents.push({
              id: doc.id,
              entryNumber: entry.id,
              documentNumber: doc.document_number,
              description: doc.description || '',
              dateFiled: entry.date_entered || '',
              pageCount: doc.page_count ?? null,
              fileSize: doc.file_size ?? null,
              filePath: doc.filepath_local,
              sha1: doc.sha1 || '',
            });
          }
        }
      }
    }
  }

  return documents;
}