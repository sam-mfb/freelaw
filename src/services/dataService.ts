import type { CaseIndex } from '../types/index.types';
import type { Document } from '../types/document.types';

export async function loadCaseIndex(): Promise<CaseIndex> {
  try {
    const response = await fetch('/data/case-index.json');
    if (!response.ok) {
      throw new Error(`Failed to load case index: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading case index:', error);
    throw error;
  }
}

export async function loadCaseDocuments(caseId: number): Promise<Document[]> {
  try {
    const response = await fetch(`/data/documents/${caseId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load documents for case ${caseId}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading documents for case ${caseId}:`, error);
    throw error;
  }
}