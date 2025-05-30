import type { CaseSummary } from './case.types';
import type { Court } from './court.types';

export interface CaseIndex {
  cases: CaseSummary[];
  courts: Court[];
  dateRange: {
    min: string;
    max: string;
  };
}

export interface BuildConfig {
  jsonDir: string;
  outputDir: string;
  pdfBaseDir: string;
}

export interface RawRecapDocument {
  id: number;
  document_number: string;
  description?: string;
  page_count?: number | null;
  file_size?: number | null;
  filepath_local?: string;
  is_available: boolean;
  sha1?: string;
}

export interface RawDocketEntry {
  id: number;
  description?: string;
  date_entered?: string;
  recap_documents?: RawRecapDocument[];
}

export interface RawCaseData {
  id: number;
  case_name?: string;
  case_name_short?: string;
  case_name_full?: string;
  court?: string;
  docket_number?: string;
  date_filed?: string;
  date_terminated?: string | null;
  assigned_to_str?: string;
  docket_entries?: RawDocketEntry[];
}
