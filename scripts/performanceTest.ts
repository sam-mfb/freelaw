/**
 * Performance Testing Script for Document Search Index Building
 * 
 * This script measures the performance and memory usage of the document search
 * index building process. It processes the sample data in the same way as the
 * production buildIndex.ts script, providing accurate measurements for:
 * 
 * - Processing time for each phase (file reading, parsing, extraction, writing)
 * - Memory usage (peak and final)
 * - Index sizes (case index, documents, keyword index)
 * - Extrapolation to full dataset (34,000 cases)
 * 
 * The script uses a streaming approach that mirrors the production implementation:
 * - Processes one case file at a time
 * - Writes document files immediately after processing
 * - Only keeps the keyword index in memory throughout
 * 
 * Usage: npm run test:performance
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { performance } from 'perf_hooks';
import { extractKeywords } from './extractKeywords';
import { extractCaseSummary } from './extractCaseSummary';
import { extractDocuments, type CaseContext } from './extractDocuments';
import { COURT_MAPPINGS } from '../src/constants/courts';
import type { CaseIndex } from '../src/types/index.types';
import type { CaseSummary } from '../src/types/case.types';
import type { Court } from '../src/types/court.types';
import { ensureDirectoryExists, readJsonFile } from './utils';

interface PerformanceMetrics {
  totalTime: number;
  fileProcessingTime: number;
  caseExtractionTime: number;
  documentExtractionTime: number;
  keywordExtractionTime: number;
  documentWriteTime: number;
  indexWriteTime: number;
  peakMemoryUsed: number;
  currentMemoryUsed: number;
  caseCount: number;
  documentCount: number;
  uniqueKeywordCount: number;
  totalIndexSize: number;
  caseIndexSize: number;
  documentFilesSize: number;
  keywordIndexSize: number;
}

// Helper to build keyword index from documents
function buildKeywordIndexFromDocuments(
  documents: ReturnType<typeof extractDocuments>,
  keywordIndex: Map<string, Set<string>>,
): void {
  for (const doc of documents) {
    if (!doc.description) continue;

    const keywords = extractKeywords(doc.description);

    for (const keyword of keywords) {
      if (!keywordIndex.has(keyword)) {
        keywordIndex.set(keyword, new Set());
      }
      keywordIndex.get(keyword)!.add(doc.searchId);
    }
  }
}

async function measureIndexBuildPerformance(dataDir: string): Promise<PerformanceMetrics> {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;
  let peakMemory = startMemory;

  // Function to update peak memory
  const updatePeakMemory = () => {
    const currentMemory = process.memoryUsage().heapUsed;
    if (currentMemory > peakMemory) {
      peakMemory = currentMemory;
    }
  };

  // Track memory usage periodically
  const memoryInterval = setInterval(updatePeakMemory, 10); // Check every 10ms for better accuracy

  const metrics: PerformanceMetrics = {
    totalTime: 0,
    fileProcessingTime: 0,
    caseExtractionTime: 0,
    documentExtractionTime: 0,
    keywordExtractionTime: 0,
    documentWriteTime: 0,
    indexWriteTime: 0,
    peakMemoryUsed: 0,
    currentMemoryUsed: 0,
    caseCount: 0,
    documentCount: 0,
    uniqueKeywordCount: 0,
    totalIndexSize: 0,
    caseIndexSize: 0,
    documentFilesSize: 0,
    keywordIndexSize: 0,
  };

  const outputDir = path.join(dataDir, 'test-output');
  const documentsDir = path.join(outputDir, 'documents');
  const searchDir = path.join(outputDir, 'document-search');
  const keywordsDir = path.join(searchDir, 'keywords');

  // Clean up any existing test output
  try {
    await fs.rm(outputDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore error if directory doesn't exist
  }

  await ensureDirectoryExists(outputDir);
  await ensureDirectoryExists(documentsDir);
  await ensureDirectoryExists(searchDir);
  await ensureDirectoryExists(keywordsDir);

  const cases: CaseSummary[] = [];
  const courtSet = new Set<string>();
  const keywordIndex = new Map<string, Set<string>>();
  let minDate: string | null = null;
  let maxDate: string | null = null;

  const jsonDir = path.join(dataDir, 'docket-data');
  const files = await fs.readdir(jsonDir);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));
  metrics.caseCount = jsonFiles.length;

  console.log(`Processing ${jsonFiles.length} JSON files...`);

  let processedCount = 0;
  let totalDocumentCount = 0;
  let totalDocumentFileSize = 0;

  const fileProcessingStartTime = performance.now();

  // Process files one at a time (streaming approach)
  for (const file of jsonFiles) {
    const filePath = path.join(jsonDir, file);
    const caseData = await readJsonFile(filePath);

    if (!caseData) {
      continue;
    }

    // Extract case summary
    const caseExtractionStart = performance.now();
    const caseSummary = extractCaseSummary(caseData);
    cases.push(caseSummary);
    metrics.caseExtractionTime += performance.now() - caseExtractionStart;
    updatePeakMemory(); // Check memory after case extraction

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

    // Extract documents and write immediately
    const documentExtractionStart = performance.now();
    const caseContext: CaseContext = {
      caseId: caseData.id,
      caseName: caseSummary.name,
      court: caseSummary.court || 'unknown',
    };

    const documents = extractDocuments(caseData, caseContext);
    metrics.documentExtractionTime += performance.now() - documentExtractionStart;

    if (documents.length > 0) {
      const documentWriteStart = performance.now();
      const docFilePath = path.join(documentsDir, `${caseData.id}.json`);
      const docContent = JSON.stringify(documents, null, 2);
      await fs.writeFile(docFilePath, docContent);
      totalDocumentFileSize += Buffer.byteLength(docContent, 'utf8');
      totalDocumentCount += documents.length;
      metrics.documentWriteTime += performance.now() - documentWriteStart;
    }

    // Process keywords using the already extracted documents
    const keywordExtractionStart = performance.now();
    buildKeywordIndexFromDocuments(documents, keywordIndex);
    metrics.keywordExtractionTime += performance.now() - keywordExtractionStart;
    updatePeakMemory(); // Check memory after keyword extraction

    processedCount++;
    if (processedCount % 100 === 0) {
      console.log(`Processed ${processedCount}/${jsonFiles.length} files...`);
    }
  }

  metrics.fileProcessingTime = performance.now() - fileProcessingStartTime;
  metrics.documentCount = totalDocumentCount;
  metrics.documentFilesSize = totalDocumentFileSize;

  // Build and write final indices
  const indexWriteStart = performance.now();

  // Write case index
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

  const indexPath = path.join(outputDir, 'case-index.json');
  const caseIndexContent = JSON.stringify(caseIndex, null, 2);
  await fs.writeFile(indexPath, caseIndexContent);
  metrics.caseIndexSize = Buffer.byteLength(caseIndexContent, 'utf8');

  // Write keyword indices
  const allKeywords = Array.from(keywordIndex.keys()).sort();
  metrics.uniqueKeywordCount = allKeywords.length;

  const keywordsFile = {
    keywords: allKeywords,
  };

  const keywordsIndexContent = JSON.stringify(keywordsFile, null, 2);
  await fs.writeFile(path.join(searchDir, 'keywords.json'), keywordsIndexContent);

  let keywordFilesSize = Buffer.byteLength(keywordsIndexContent, 'utf8');

  for (const [keyword, documentIds] of Array.from(keywordIndex.entries())) {
    const keywordFile = {
      keyword,
      documentIds: Array.from(documentIds).sort(),
    };

    const keywordFileContent = JSON.stringify(keywordFile, null, 2);
    await fs.writeFile(path.join(keywordsDir, `${keyword}.json`), keywordFileContent);
    keywordFilesSize += Buffer.byteLength(keywordFileContent, 'utf8');
  }

  metrics.keywordIndexSize = keywordFilesSize;
  metrics.indexWriteTime = performance.now() - indexWriteStart;

  // Final memory check
  updatePeakMemory();

  // Calculate totals
  clearInterval(memoryInterval);
  metrics.totalTime = performance.now() - startTime;
  metrics.currentMemoryUsed = process.memoryUsage().heapUsed - startMemory;
  metrics.peakMemoryUsed = peakMemory - startMemory;
  metrics.totalIndexSize =
    metrics.caseIndexSize + metrics.documentFilesSize + metrics.keywordIndexSize;

  // Clean up test output
  try {
    await fs.rm(outputDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error cleaning up test output:', error);
  }

  return metrics;
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

async function runPerformanceTest() {
  console.log('Index Build Performance Test (Accurate Streaming Implementation)\n');
  console.log('Testing with sample data...\n');

  try {
    const metrics = await measureIndexBuildPerformance('./sample-data');

    console.log('Performance Metrics:');
    console.log('===================');
    console.log(`Total Time: ${formatTime(metrics.totalTime)}`);
    console.log(
      `  - File Processing: ${formatTime(metrics.fileProcessingTime)} (${((metrics.fileProcessingTime / metrics.totalTime) * 100).toFixed(1)}%)`,
    );
    console.log(`    - Case Extraction: ${formatTime(metrics.caseExtractionTime)}`);
    console.log(`    - Document Extraction: ${formatTime(metrics.documentExtractionTime)}`);
    console.log(`    - Keyword Extraction: ${formatTime(metrics.keywordExtractionTime)}`);
    console.log(`    - Document Writing: ${formatTime(metrics.documentWriteTime)}`);
    console.log(
      `  - Index Writing: ${formatTime(metrics.indexWriteTime)} (${((metrics.indexWriteTime / metrics.totalTime) * 100).toFixed(1)}%)`,
    );

    console.log('\nData Metrics:');
    console.log('=============');
    console.log(`Cases Processed: ${metrics.caseCount}`);
    console.log(`Documents Indexed: ${metrics.documentCount}`);
    console.log(`Unique Keywords: ${metrics.uniqueKeywordCount}`);
    console.log(`Total Index Size: ${formatBytes(metrics.totalIndexSize)}`);
    console.log(`  - Case Index: ${formatBytes(metrics.caseIndexSize)}`);
    console.log(`  - Document Files: ${formatBytes(metrics.documentFilesSize)}`);
    console.log(`  - Keyword Index: ${formatBytes(metrics.keywordIndexSize)}`);

    console.log('\nMemory Usage:');
    console.log('=============');
    console.log(`Peak Memory Used: ${formatBytes(metrics.peakMemoryUsed)}`);
    console.log(`Final Memory Used: ${formatBytes(metrics.currentMemoryUsed)}`);

    console.log('\nPerformance Rates:');
    console.log('==================');
    console.log(`Cases/second: ${(metrics.caseCount / (metrics.totalTime / 1000)).toFixed(2)}`);
    console.log(
      `Documents/second: ${(metrics.documentCount / (metrics.totalTime / 1000)).toFixed(2)}`,
    );
    console.log(`Avg time per case: ${formatTime(metrics.totalTime / metrics.caseCount)}`);
    console.log(`Avg time per document: ${formatTime(metrics.totalTime / metrics.documentCount)}`);

    // Extrapolation to full dataset (34,000 cases)
    console.log('\nExtrapolation to Full Dataset (34,000 cases):');
    console.log('=============================================');
    const scaleFactor = 34000 / metrics.caseCount;
    const avgDocsPerCase = metrics.documentCount / metrics.caseCount;
    const estimatedDocuments = Math.round(avgDocsPerCase * 34000);

    console.log(`Estimated documents: ${estimatedDocuments.toLocaleString()}`);
    console.log(`Estimated time: ${formatTime(metrics.totalTime * scaleFactor)}`);
    console.log(`Estimated total index size: ${formatBytes(metrics.totalIndexSize * scaleFactor)}`);
    console.log(`  - Case Index: ${formatBytes(metrics.caseIndexSize * scaleFactor)}`);
    console.log(`  - Document Files: ${formatBytes(metrics.documentFilesSize * scaleFactor)}`);
    console.log(`  - Keyword Index: ${formatBytes(metrics.keywordIndexSize * scaleFactor)}`);

    // Memory feasibility check - using peak memory as the critical metric
    const totalSystemMemory = os.totalmem();
    // The keyword index is the main memory consumer that scales with dataset size
    // Case summaries also scale but are much smaller
    const estimatedPeakMemory = metrics.peakMemoryUsed * scaleFactor;
    const peakMemoryPercentage = ((estimatedPeakMemory / totalSystemMemory) * 100).toFixed(1);

    console.log('\nMemory Feasibility:');
    console.log('==================');
    console.log(`System Memory: ${formatBytes(totalSystemMemory)}`);
    console.log(
      `Estimated Peak Memory: ${formatBytes(estimatedPeakMemory)} (${peakMemoryPercentage}%)`,
    );

    // More accurate memory analysis
    // The keyword index uses Map<string, Set<string>> which is more memory-efficient than JSON
    // Estimate 1.3x the serialized size for in-memory structures (Map/Set overhead)
    const keywordIndexMemory = (metrics.keywordIndexSize / metrics.caseCount) * 34000 * 1.3;
    
    // Case summaries are kept in an array, similar size to serialized
    const caseSummariesMemory = (metrics.caseIndexSize / metrics.caseCount) * 34000;
    
    // Working memory: one case file + its documents at a time
    const avgCaseFileSize = metrics.documentFilesSize / metrics.caseCount;
    const workingMemory = avgCaseFileSize * 10; // Buffer for ~10 case files worth of working data
    
    const totalEstimatedMemory = keywordIndexMemory + caseSummariesMemory + workingMemory;

    console.log(`\nDetailed Memory Breakdown:`);
    console.log(`  - Keyword Index (in-memory): ${formatBytes(keywordIndexMemory)}`);
    console.log(`  - Case Summaries: ${formatBytes(caseSummariesMemory)}`);
    console.log(`  - Working Memory: ${formatBytes(workingMemory)}`);
    console.log(
      `  - Total Estimated: ${formatBytes(totalEstimatedMemory)} (${((totalEstimatedMemory / totalSystemMemory) * 100).toFixed(1)}%)`,
    );

    if (totalEstimatedMemory > totalSystemMemory * 0.8) {
      console.log('\n⚠️  WARNING: Estimated memory usage exceeds 80% of system memory.');
      console.log('   Consider chunking the keyword index build or using a streaming approach.');
    } else {
      console.log('\n✓ Memory usage appears feasible for single-pass indexing.');
    }
  } catch (error) {
    console.error('Performance test failed:', error);
    process.exit(1);
  }
}

// Run the test
runPerformanceTest();

