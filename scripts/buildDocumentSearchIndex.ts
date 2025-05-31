import * as fs from 'fs/promises';
import * as path from 'path';
import type { BuildConfig, RawCaseData } from '../src/types/index.types';
import { isRawCaseData } from '../src/types/guards';
import { extractKeywords, createDocumentId } from './extractKeywords';

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
    const data = JSON.parse(content);

    if (!isRawCaseData(data)) {
      console.error(`Invalid case data structure in file ${filePath}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

function processDocumentsForKeywords(
  caseData: RawCaseData, 
  keywordIndex: Map<string, Set<string>>
): void {
  if (!caseData.docket_entries) return;
  
  for (const entry of caseData.docket_entries) {
    if (!entry.recap_documents) continue;
    
    for (const doc of entry.recap_documents) {
      if (!doc.is_available || !doc.description) continue;
      
      const documentId = createDocumentId(
        caseData.id,
        doc.document_number || '0',
        doc.attachment_number !== null && doc.attachment_number !== undefined 
          ? doc.attachment_number 
          : 'null'
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
  keywordIndex: Map<string, Set<string>>
): Promise<void> {
  const searchDir = path.join(config.outputDir, 'document-search');
  const keywordsDir = path.join(searchDir, 'keywords');
  
  await ensureDirectoryExists(searchDir);
  await ensureDirectoryExists(keywordsDir);
  
  const allKeywords = Array.from(keywordIndex.keys()).sort();
  const keywordsFile = {
    keywords: allKeywords
  };
  
  await fs.writeFile(
    path.join(searchDir, 'keywords.json'),
    JSON.stringify(keywordsFile, null, 2)
  );
  
  for (const [keyword, documentIds] of keywordIndex.entries()) {
    const keywordFile = {
      keyword,
      documentIds: Array.from(documentIds).sort()
    };
    
    await fs.writeFile(
      path.join(keywordsDir, `${keyword}.json`),
      JSON.stringify(keywordFile, null, 2)
    );
  }
  
  console.log(`\nDocument search index complete!`);
  console.log(`- Found ${allKeywords.length} unique keywords`);
  console.log(`- Indexed ${Array.from(keywordIndex.values()).reduce((sum, set) => sum + set.size, 0)} document references`);
}

async function buildDocumentSearchIndexStandalone(config: BuildConfig): Promise<void> {
  console.log('Building document search index (standalone)...');
  console.log(`Reading JSON files from: ${config.jsonDir}`);
  console.log(`Output directory: ${config.outputDir}`);
  
  const keywordIndex = new Map<string, Set<string>>();
  
  const files = await fs.readdir(config.jsonDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`Found ${jsonFiles.length} JSON files to process`);
  
  let processedCount = 0;
  for (const file of jsonFiles) {
    const filePath = path.join(config.jsonDir, file);
    const caseData = await readJsonFile(filePath);
    
    if (!caseData) continue;
    
    processDocumentsForKeywords(caseData, keywordIndex);
    
    processedCount++;
    if (processedCount % 100 === 0) {
      console.log(`Processed ${processedCount}/${jsonFiles.length} files...`);
    }
  }
  
  await writeDocumentSearchIndex(config, keywordIndex);
  
  console.log(`Processing complete! Processed ${processedCount} case files`);
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
    await buildDocumentSearchIndexStandalone(config);
  } catch (error) {
    console.error('Error building document search index:', error);
    process.exit(1);
  }
}

main().catch(console.error);