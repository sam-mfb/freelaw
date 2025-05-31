const STOP_WORDS = new Set([
  'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
  'by', 'a', 'an', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
  'may', 'might', 'must', 'shall', 'can', 'could', 'would', 'should',
  'it', 'its', 'this', 'that', 'these', 'those', 'there', 'their', 'them',
  'they', 'we', 'our', 'ours', 'you', 'your', 'yours', 'he', 'his', 'she',
  'her', 'hers', 'me', 'my', 'mine', 'i', 'us', 'him', 'than', 'then',
  'so', 'no', 'not', 'nor', 'only', 'just', 'if', 'all', 'any', 'both',
  'each', 'few', 'more', 'most', 'some', 'such', 'from', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'under', 'over'
]);

const LEGAL_KEYWORDS = new Set([
  'motion', 'order', 'deposition', 'brief', 'complaint', 'answer', 'response',
  'reply', 'summary', 'judgment', 'injunction', 'discovery', 'settlement',
  'hearing', 'trial', 'appeal', 'filing', 'conference', 'notice', 'objection',
  'memorandum', 'affidavit', 'declaration', 'exhibit', 'stipulation', 'subpoena',
  'transcript', 'opinion', 'ruling', 'verdict', 'sentence', 'plea', 'dismissal',
  'continuance', 'opposition', 'joinder', 'consent', 'waiver', 'certificate',
  'appearance', 'summons', 'warrant', 'petition', 'application', 'claim',
  'counterclaim', 'crossclaim', 'interpleader', 'intervention', 'consolidation',
  'remand', 'removal', 'transfer', 'recusal', 'disqualification', 'sanction',
  'contempt', 'default', 'amendment', 'supplement', 'correction', 'clarification',
  'reconsideration', 'rehearing', 'review', 'mandamus', 'certiorari', 'habeas',
  'corpus', 'amicus', 'curiae', 'protective', 'restraining', 'preliminary',
  'permanent', 'temporary', 'emergency', 'expedited', 'joint', 'unopposed',
  'sealed', 'redacted', 'confidential', 'privileged', 'proposed', 'final',
  'initial', 'supplemental', 'amended', 'corrected', 'revised', 'modified'
]);

export function extractKeywords(description: string): string[] {
  const normalized = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = normalized.split(' ')
    .filter(word => word.length >= 3)
    .filter(word => !STOP_WORDS.has(word))
    .filter(word => /^[a-z]+$/.test(word));
  
  const keywords = new Set<string>();
  
  for (const word of words) {
    if (LEGAL_KEYWORDS.has(word)) {
      keywords.add(word);
    } else if (word.length >= 4) {
      keywords.add(word);
    }
  }
  
  return Array.from(keywords).sort();
}

export function createDocumentId(
  caseId: number, 
  documentNumber: string, 
  attachmentNumber: number
): string {
  return `${caseId}-${documentNumber}-${attachmentNumber}`;
}

export function parseDocumentId(documentId: string): {
  caseId: number;
  documentNumber: string; 
  attachmentNumber: number;
} {
  const parts = documentId.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid document ID format: ${documentId}`);
  }
  
  return {
    caseId: parseInt(parts[0], 10),
    documentNumber: parts[1],
    attachmentNumber: parseInt(parts[2], 10)
  };
}