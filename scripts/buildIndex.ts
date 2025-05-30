import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { BuildConfig, RawCaseData, CaseIndex } from '../src/types/index.types';
import { CaseSummary } from '../src/types/case.types';
import { Document } from '../src/types/document.types';
import { Court, COURT_MAPPINGS } from '../src/types/court.types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
  }
}

async function readJsonFile(filePath: string): Promise<RawCaseData | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as RawCaseData;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

function extractCaseSummary(caseData: RawCaseData): CaseSummary {
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
    terminated: caseData.date_terminated,
    docCount,
    availCount
  };
}

function extractDocuments(caseData: RawCaseData): Document[] {
  const documents: Document[] = [];

  if (caseData.docket_entries) {
    for (const entry of caseData.docket_entries) {
      if (entry.recap_documents) {
        for (const doc of entry.recap_documents) {
          if (doc.is_available && doc.filepath_local) {
            documents.push({
              id: doc.id,
              entryNumber: entry.entry_number,
              documentNumber: doc.document_number,
              description: doc.description || '',
              dateFiled: entry.date_entered || '',
              pageCount: doc.page_count,
              fileSize: doc.file_size,
              filePath: doc.filepath_local,
              sha1: doc.sha1 || ''
            });
          }
        }
      }
    }
  }

  return documents;
}

async function buildIndices(config: BuildConfig): Promise<void> {
  console.log('Starting index build...');
  console.log(`Reading JSON files from: ${config.jsonDir}`);
  console.log(`Output directory: ${config.outputDir}`);

  const cases: CaseSummary[] = [];
  const courtSet = new Set<string>();
  let minDate: string | null = null;
  let maxDate: string | null = null;

  await ensureDirectoryExists(config.outputDir);
  await ensureDirectoryExists(path.join(config.outputDir, 'documents'));

  const files = await fs.readdir(config.jsonDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  console.log(`Found ${jsonFiles.length} JSON files to process`);

  let processedCount = 0;
  for (const file of jsonFiles) {
    const filePath = path.join(config.jsonDir, file);
    const caseData = await readJsonFile(filePath);

    if (!caseData) {
      continue;
    }

    const caseSummary = extractCaseSummary(caseData);
    cases.push(caseSummary);
    
    if (caseSummary.court) {
      courtSet.add(caseSummary.court);
    }

    if (caseSummary.filed) {
      if (!minDate || caseSummary.filed < minDate) {
        minDate = caseSummary.filed;
      }
      if (!maxDate || caseSummary.filed > maxDate) {
        maxDate = caseSummary.filed;
      }
    }

    const documents = extractDocuments(caseData);
    if (documents.length > 0) {
      const docFilePath = path.join(config.outputDir, 'documents', `${caseData.id}.json`);
      await fs.writeFile(docFilePath, JSON.stringify(documents, null, 2));
    }

    processedCount++;
    if (processedCount % 100 === 0) {
      console.log(`Processed ${processedCount}/${jsonFiles.length} files...`);
    }
  }

  const courts: Court[] = Array.from(courtSet)
    .sort()
    .map(code => ({
      code,
      name: COURT_MAPPINGS[code] || `Unknown Court (${code})`
    }));

  const caseIndex: CaseIndex = {
    cases: cases.sort((a, b) => a.id - b.id),
    courts,
    dateRange: {
      min: minDate || '',
      max: maxDate || ''
    }
  };

  const indexPath = path.join(config.outputDir, 'case-index.json');
  await fs.writeFile(indexPath, JSON.stringify(caseIndex, null, 2));

  console.log(`\nIndex build complete!`);
  console.log(`- Processed ${cases.length} cases`);
  console.log(`- Found ${courts.length} unique courts`);
  console.log(`- Date range: ${minDate} to ${maxDate}`);
  console.log(`- Output written to: ${config.outputDir}`);
}

async function main() {
  const args = process.argv.slice(2);
  let dataDir = './data';

  for (const arg of args) {
    if (arg.startsWith('--data-dir=')) {
      dataDir = arg.split('=')[1];
    }
  }

  const config: BuildConfig = {
    jsonDir: path.join(dataDir, 'docket-data'),
    outputDir: './public/data',
    pdfBaseDir: path.join(dataDir, 'sata')
  };

  try {
    await buildIndices(config);
  } catch (error) {
    console.error('Error building indices:', error);
    process.exit(1);
  }
}

main().catch(console.error);

export { buildIndices };