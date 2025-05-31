import { promises as fs } from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { extractKeywords, createDocumentId } from './extractKeywords';
import type { RawCaseData } from '../src/types/index.types';

interface PerformanceMetrics {
  totalTime: number;
  fileReadTime: number;
  parseTime: number;
  keywordExtractionTime: number;
  indexBuildTime: number;
  fileWriteTime: number;
  memoryUsed: number;
  caseCount: number;
  documentCount: number;
  uniqueKeywordCount: number;
  indexSize: number;
}

async function measureIndexBuildPerformance(dataDir: string): Promise<PerformanceMetrics> {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  const metrics: PerformanceMetrics = {
    totalTime: 0,
    fileReadTime: 0,
    parseTime: 0,
    keywordExtractionTime: 0,
    indexBuildTime: 0,
    fileWriteTime: 0,
    memoryUsed: 0,
    caseCount: 0,
    documentCount: 0,
    uniqueKeywordCount: 0,
    indexSize: 0
  };

  // Step 1: Read JSON files
  const readStartTime = performance.now();
  const jsonDir = path.join(dataDir, 'docket-data');
  const files = await fs.readdir(jsonDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  metrics.caseCount = jsonFiles.length;
  
  const fileContents: string[] = [];
  for (const file of jsonFiles) {
    const content = await fs.readFile(path.join(jsonDir, file), 'utf-8');
    fileContents.push(content);
  }
  metrics.fileReadTime = performance.now() - readStartTime;

  // Step 2: Parse JSON
  const parseStartTime = performance.now();
  const cases: RawCaseData[] = [];
  for (const content of fileContents) {
    cases.push(JSON.parse(content));
  }
  metrics.parseTime = performance.now() - parseStartTime;

  // Step 3: Extract keywords and build index
  const keywordStartTime = performance.now();
  const keywordIndex = new Map<string, Set<string>>();
  let documentCount = 0;

  for (const caseData of cases) {
    const entries = (caseData as any).docket_entries;
    if (!entries) continue;
    
    for (const entry of entries) {
      if (!entry.recap_documents) continue;
      
      for (const doc of entry.recap_documents) {
        if (!doc.is_available || !doc.description) continue;
        
        documentCount++;
        const keywords = extractKeywords(doc.description);
        
        const documentId = createDocumentId(
          caseData.id,
          doc.document_number ?? '0',
          doc.attachment_number ?? 'null'
        );
        
        for (const keyword of keywords) {
          if (!keywordIndex.has(keyword)) {
            keywordIndex.set(keyword, new Set());
          }
          keywordIndex.get(keyword)!.add(documentId);
        }
      }
    }
  }
  
  metrics.documentCount = documentCount;
  metrics.uniqueKeywordCount = keywordIndex.size;
  metrics.keywordExtractionTime = performance.now() - keywordStartTime;

  // Step 4: Build final index structure (convert Sets to Arrays)
  const indexStartTime = performance.now();
  const keywordFiles: Record<string, any> = {};
  
  for (const [keyword, documentIds] of keywordIndex.entries()) {
    keywordFiles[keyword] = {
      keyword,
      documentIds: Array.from(documentIds).sort()
    };
  }
  
  const finalIndex = {
    keywordsIndex: { keywords: Array.from(keywordIndex.keys()).sort() },
    keywordFiles
  };
  metrics.indexBuildTime = performance.now() - indexStartTime;

  // Step 5: Measure serialized size (simulate file write)
  const writeStartTime = performance.now();
  const serializedIndex = JSON.stringify(finalIndex);
  metrics.indexSize = Buffer.byteLength(serializedIndex, 'utf8');
  metrics.fileWriteTime = performance.now() - writeStartTime;

  // Calculate totals
  metrics.totalTime = performance.now() - startTime;
  metrics.memoryUsed = process.memoryUsage().heapUsed - startMemory;

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
  console.log('Index Build Performance Test\n');
  console.log('Testing with sample data...\n');

  try {
    const metrics = await measureIndexBuildPerformance('./sample-data');
    
    console.log('Performance Metrics:');
    console.log('===================');
    console.log(`Total Time: ${formatTime(metrics.totalTime)}`);
    console.log(`  - File Reading: ${formatTime(metrics.fileReadTime)} (${(metrics.fileReadTime / metrics.totalTime * 100).toFixed(1)}%)`);
    console.log(`  - JSON Parsing: ${formatTime(metrics.parseTime)} (${(metrics.parseTime / metrics.totalTime * 100).toFixed(1)}%)`);
    console.log(`  - Keyword Extraction: ${formatTime(metrics.keywordExtractionTime)} (${(metrics.keywordExtractionTime / metrics.totalTime * 100).toFixed(1)}%)`);
    console.log(`  - Index Building: ${formatTime(metrics.indexBuildTime)} (${(metrics.indexBuildTime / metrics.totalTime * 100).toFixed(1)}%)`);
    console.log(`  - Serialization: ${formatTime(metrics.fileWriteTime)} (${(metrics.fileWriteTime / metrics.totalTime * 100).toFixed(1)}%)`);
    
    console.log('\nData Metrics:');
    console.log('=============');
    console.log(`Cases Processed: ${metrics.caseCount}`);
    console.log(`Documents Indexed: ${metrics.documentCount}`);
    console.log(`Unique Keywords: ${metrics.uniqueKeywordCount}`);
    console.log(`Index Size: ${formatBytes(metrics.indexSize)}`);
    console.log(`Memory Used: ${formatBytes(metrics.memoryUsed)}`);
    
    console.log('\nPerformance Rates:');
    console.log('==================');
    console.log(`Cases/second: ${(metrics.caseCount / (metrics.totalTime / 1000)).toFixed(2)}`);
    console.log(`Documents/second: ${(metrics.documentCount / (metrics.totalTime / 1000)).toFixed(2)}`);
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
    console.log(`Estimated index size: ${formatBytes(metrics.indexSize * scaleFactor)}`);
    console.log(`Estimated memory usage: ${formatBytes(metrics.memoryUsed * scaleFactor)}`);
    
    // Memory feasibility check
    const totalSystemMemory = require('os').totalmem();
    const estimatedMemoryNeeded = metrics.memoryUsed * scaleFactor;
    const memoryPercentage = (estimatedMemoryNeeded / totalSystemMemory * 100).toFixed(1);
    
    console.log('\nMemory Feasibility:');
    console.log('==================');
    console.log(`System Memory: ${formatBytes(totalSystemMemory)}`);
    console.log(`Estimated Memory Needed: ${formatBytes(estimatedMemoryNeeded)} (${memoryPercentage}%)`);
    
    if (estimatedMemoryNeeded > totalSystemMemory * 0.8) {
      console.log('\n⚠️  WARNING: Estimated memory usage exceeds 80% of system memory.');
      console.log('   Incremental indexing is recommended.');
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