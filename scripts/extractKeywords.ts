const STOP_WORDS = new Set([
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'a',
  'an',
  'as',
  'is',
  'was',
  'are',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'should',
  'could',
  'may',
  'might',
  'must',
  'shall',
  'can',
  'could',
  'would',
  'should',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'there',
  'their',
  'them',
  'they',
  'we',
  'our',
  'ours',
  'you',
  'your',
  'yours',
  'he',
  'his',
  'she',
  'her',
  'hers',
  'me',
  'my',
  'mine',
  'i',
  'us',
  'him',
  'than',
  'then',
  'so',
  'no',
  'not',
  'nor',
  'only',
  'just',
  'if',
  'all',
  'any',
  'both',
  'each',
  'few',
  'more',
  'most',
  'some',
  'such',
  'from',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'under',
  'over',
]);

export function extractKeywords(description: string): string[] {
  const normalized = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = normalized
    .split(' ')
    .filter((word) => word.length >= 3)
    .filter((word) => !STOP_WORDS.has(word))
    .filter((word) => /^[a-z]+$/.test(word));

  const keywords = words
    .filter((word) => word.length >= 4)
    .filter((word, index, self) => self.indexOf(word) === index);

  return keywords.sort();
}

export function createDocumentId(
  caseId: number,
  documentNumber: string,
  attachmentNumber: number | string,
): string {
  return `${caseId}-${documentNumber}-${attachmentNumber}`;
}

export function parseDocumentId(documentId: string): {
  caseId: number;
  documentNumber: string;
  attachmentNumber: number | null;
} {
  const parts = documentId.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid document ID format: ${documentId}`);
  }

  return {
    caseId: parseInt(parts[0], 10),
    documentNumber: parts[1],
    attachmentNumber: parts[2] === 'null' ? null : parseInt(parts[2], 10),
  };
}
