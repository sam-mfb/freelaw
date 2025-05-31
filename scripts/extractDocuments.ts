import type { RawCaseData } from '../src/types/index.types';
import type { Document } from '../src/types/document.types';
import { createDocumentId } from './extractKeywords';

export interface CaseContext {
  caseId: number;
  caseName: string;
  court: string;
}

export function extractDocuments(caseData: RawCaseData, context?: CaseContext): Document[] {
  const documents: Document[] = [];

  if (caseData.docket_entries) {
    for (const entry of caseData.docket_entries) {
      if (entry.recap_documents) {
        for (const doc of entry.recap_documents) {
          if (doc.is_available && doc.filepath_local) {
            const attachmentNumber = doc.attachment_number ?? null;
            const searchId = createDocumentId(
              context?.caseId || caseData.id,
              doc.document_number,
              attachmentNumber ?? 'null',
            );

            documents.push({
              id: doc.id,
              entryNumber: entry.id,
              documentNumber: doc.document_number,
              attachmentNumber,
              description: doc.description || '',
              dateFiled: entry.date_entered || '',
              pageCount: doc.page_count ?? null,
              fileSize: doc.file_size ?? null,
              filePath: doc.filepath_local,
              sha1: doc.sha1 || '',
              caseId: context?.caseId || caseData.id,
              caseName: context?.caseName || caseData.case_name || `Case ${caseData.id}`,
              court: context?.court || caseData.court || 'unknown',
              searchId,
            });
          }
        }
      }
    }
  }

  return documents;
}
