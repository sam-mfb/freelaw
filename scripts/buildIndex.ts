import * as fs from 'fs/promises';
import * as path from 'path';
import type { BuildConfig, RawCaseData, CaseIndex } from '../src/types/index.types';
import type { Court } from '../src/types/court.types';
import { COURT_MAPPINGS } from '../src/constants/courts';
import { extractCaseSummary } from './extractCaseSummary';
import { extractDocuments, type CaseContext } from './extractDocuments';
import { extractKeywords, createDocumentId } from './extractKeywords';
import type { CaseSummary } from '@/types/case.types';
import { ensureDirectoryExists, readJsonFile } from './utils';

function processDocumentsForKeywords(
  caseData: RawCaseData,
  keywordIndex: Map<string, Set<string>>,
): void {
  if (!caseData.docket_entries) return;

  for (const entry of caseData.docket_entries) {
    if (!entry.recap_documents) continue;

    for (const doc of entry.recap_documents) {
      if (!doc.is_available || !doc.description) continue;

      const documentId = createDocumentId(
        caseData.id,
        doc.document_number ?? '0',
        doc.attachment_number !== null && doc.attachment_number !== undefined
          ? doc.attachment_number
          : 'null',
      );

      const keywords = extractKeywords(doc.description);

      for (const keyword of keywords) {
        if (!keywordIndex.has(keyword)) {
          keywordIndex.set(keyword, new Set());
        }
        keywordIndex.get(keyword)!.add(documentId);
      }
    }
  }
}

async function writeDocumentSearchIndex(
  config: BuildConfig,
  keywordIndex: Map<string, Set<string>>,
): Promise<void> {
  const searchDir = path.join(config.outputDir, 'document-search');
  const keywordsDir = path.join(searchDir, 'keywords');

  await ensureDirectoryExists(searchDir);
  await ensureDirectoryExists(keywordsDir);

  const allKeywords = Array.from(keywordIndex.keys()).sort();
  const keywordsFile = {
    keywords: allKeywords,
  };

  await fs.writeFile(path.join(searchDir, 'keywords.json'), JSON.stringify(keywordsFile, null, 2));

  for (const [keyword, documentIds] of keywordIndex.entries()) {
    const keywordFile = {
      keyword,
      documentIds: Array.from(documentIds).sort(),
    };

    await fs.writeFile(
      path.join(keywordsDir, `${keyword}.json`),
      JSON.stringify(keywordFile, null, 2),
    );
  }

  console.log(`Document search index complete!`);
  console.log(`- Found ${allKeywords.length} unique keywords`);
  console.log(
    `- Indexed ${Array.from(keywordIndex.values()).reduce((sum, set) => sum + set.size, 0)} document references`,
  );
}

async function buildIndices(config: BuildConfig): Promise<void> {
  console.log('Starting index build...');
  console.log(`Reading JSON files from: ${config.jsonDir}`);
  console.log(`Output directory: ${config.outputDir}`);

  const cases: CaseSummary[] = [];
  const courtSet = new Set<string>();
  const keywordIndex = new Map<string, Set<string>>();
  let minDate: string | null = null;
  let maxDate: string | null = null;

  await ensureDirectoryExists(config.outputDir);
  await ensureDirectoryExists(path.join(config.outputDir, 'documents'));

  const files = await fs.readdir(config.jsonDir);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

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

    const caseContext: CaseContext = {
      caseId: caseData.id,
      caseName: caseSummary.name,
      court: caseSummary.court || 'unknown',
    };

    const documents = extractDocuments(caseData, caseContext);
    if (documents.length > 0) {
      const docFilePath = path.join(config.outputDir, 'documents', `${caseData.id}.json`);
      await fs.writeFile(docFilePath, JSON.stringify(documents, null, 2));
    }

    processDocumentsForKeywords(caseData, keywordIndex);

    processedCount++;
    if (processedCount % 100 === 0) {
      console.log(`Processed ${processedCount}/${jsonFiles.length} files...`);
    }
  }

  const courts: Court[] = Array.from(courtSet)
    .sort()
    .map((code) => ({
      code,
      name: COURT_MAPPINGS[code] || `Unknown Court (${code})`,
    }));

  const caseIndex: CaseIndex = {
    cases: cases.sort((a, b) => a.id - b.id),
    courts,
    dateRange: {
      min: minDate || '',
      max: maxDate || '',
    },
  };

  const indexPath = path.join(config.outputDir, 'case-index.json');
  await fs.writeFile(indexPath, JSON.stringify(caseIndex, null, 2));

  await writeDocumentSearchIndex(config, keywordIndex);

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
    pdfBaseDir: path.join(dataDir, 'sata'),
  };

  try {
    await buildIndices(config);
  } catch (error) {
    console.error('Error building indices:', error);
    process.exit(1);
  }
}

main().catch(console.error);
