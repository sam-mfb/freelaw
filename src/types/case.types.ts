export interface Case {
  id: number;
  caseName: string;
  caseNameShort: string;
  caseNameFull: string;
  court: string;
  docketNumber: string;
  dateFiled: string;
  dateTerminated: string | null;
  assignedTo: string;
  documentCount: number;
  availableDocumentCount: number;
}

export interface CaseSummary {
  id: number;
  name: string;
  nameShort: string;
  court: string;
  filed: string;
  terminated: string | null;
  docCount: number;
  availCount: number;
}