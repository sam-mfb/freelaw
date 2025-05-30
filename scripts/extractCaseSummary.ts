import type { RawCaseData } from '../src/types/index.types';
import type { CaseSummary } from '../src/types/case.types';

export function extractCaseSummary(caseData: RawCaseData): CaseSummary {
  let docCount = 0;
  let availCount = 0;

  if (caseData.docket_entries) {
    for (const entry of caseData.docket_entries) {
      if (entry.recap_documents) {
        for (const doc of entry.recap_documents) {
          docCount++;
          if (doc.is_available && doc.filepath_local) {
            availCount++;
          }
        }
      }
    }
  }

  return {
    id: caseData.id,
    name: caseData.case_name || 'Unknown Case',
    nameShort: caseData.case_name_short || caseData.case_name || 'Unknown',
    court: caseData.court || 'unknown',
    filed: caseData.date_filed || '',
    terminated: caseData.date_terminated ?? null,
    docCount,
    availCount,
  };
}
