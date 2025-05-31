import { promises as fs } from 'fs';
import path from 'path';

interface SizeAnalysis {
  totalIndexSize: number;
  keywordIndexSize: number;
  documentFilesSize: number;
  caseIndexSize: number;
  keywordCount: number;
  documentReferenceCount: number;
  avgReferencesPerKeyword: number;
  topKeywordsBySize: Array<{
    keyword: string;
    documentCount: number;
    sizeBytes: number;
    sizePercentage: number;
  }>;
  topKeywordsByFrequency: Array<{
    keyword: string;
    documentCount: number;
  }>;
}

async function analyzeIndexSize(outputDir: string): Promise<SizeAnalysis> {
  // Analyze the actual index files created by buildIndex.ts
  const searchDir = path.join(outputDir, 'document-search');
  const keywordsDir = path.join(searchDir, 'keywords');
  
  // Read the main keywords list
  const keywordsContent = await fs.readFile(path.join(searchDir, 'keywords.json'), 'utf-8');
  const keywordsData = JSON.parse(keywordsContent);
  const keywords = keywordsData.keywords as string[];
  
  // Calculate size of keywords.json
  const keywordIndexSize = Buffer.byteLength(keywordsContent, 'utf8');

  // Analyze individual keyword files
  const keywordSizes: Array<{
    keyword: string;
    documentCount: number;
    sizeBytes: number;
  }> = [];

  let totalDocumentReferences = 0;
  let totalKeywordFilesSize = 0;

  for (const keyword of keywords) {
    try {
      const keywordContent = await fs.readFile(path.join(keywordsDir, `${keyword}.json`), 'utf-8');
      const keywordData = JSON.parse(keywordContent);
      const sizeBytes = Buffer.byteLength(keywordContent, 'utf8');
      const documentIds = keywordData.documentIds as string[];
      
      keywordSizes.push({
        keyword,
        documentCount: documentIds.length,
        sizeBytes
      });
      
      totalDocumentReferences += documentIds.length;
      totalKeywordFilesSize += sizeBytes;
    } catch (err) {
      console.warn(`Failed to read keyword file for '${keyword}':`, err);
    }
  }

  // Calculate document files size
  const documentsDir = path.join(outputDir, 'documents');
  let documentFilesSize = 0;
  try {
    const docFiles = await fs.readdir(documentsDir);
    for (const file of docFiles) {
      const stats = await fs.stat(path.join(documentsDir, file));
      documentFilesSize += stats.size;
    }
  } catch (err) {
    console.warn('Failed to calculate document files size:', err);
  }
  
  // Calculate case index size
  let caseIndexSize = 0;
  try {
    const caseIndexStats = await fs.stat(path.join(outputDir, 'case-index.json'));
    caseIndexSize = caseIndexStats.size;
  } catch (err) {
    console.warn('Failed to get case index size:', err);
  }

  // Sort by size and frequency
  const topBySize = [...keywordSizes]
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 20);
    
  const topByFrequency = [...keywordSizes]
    .sort((a, b) => b.documentCount - a.documentCount)
    .slice(0, 20);

  const totalIndexSize = keywordIndexSize + totalKeywordFilesSize + documentFilesSize + caseIndexSize;

  return {
    totalIndexSize,
    keywordIndexSize,
    documentFilesSize,
    caseIndexSize,
    keywordCount: keywordSizes.length,
    documentReferenceCount: totalDocumentReferences,
    avgReferencesPerKeyword: totalDocumentReferences / keywordSizes.length,
    topKeywordsBySize: topBySize.map(k => ({
      ...k,
      sizePercentage: (k.sizeBytes / totalKeywordFilesSize) * 100
    })),
    topKeywordsByFrequency: topByFrequency.map(k => ({
      keyword: k.keyword,
      documentCount: k.documentCount
    }))
  };
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

async function runAnalysis() {
  console.log('Index Size Analysis\n');
  console.log('Analyzing actual index files...\n');

  try {
    const analysis = await analyzeIndexSize('./public/data');
    
    console.log('Index File Sizes:');
    console.log('================');
    console.log(`Total Index Size: ${formatBytes(analysis.totalIndexSize)}`);
    console.log(`  - Keywords list: ${formatBytes(analysis.keywordIndexSize)}`);
    console.log(`  - Keyword files: ${formatBytes(analysis.totalIndexSize - analysis.keywordIndexSize - analysis.documentFilesSize - analysis.caseIndexSize)}`);
    console.log(`  - Document files: ${formatBytes(analysis.documentFilesSize)}`);
    console.log(`  - Case index: ${formatBytes(analysis.caseIndexSize)}`);
    
    console.log('\nIndex Statistics:');
    console.log('=================');
    console.log(`Unique Keywords: ${analysis.keywordCount}`);
    console.log(`Total Document References: ${analysis.documentReferenceCount}`);
    console.log(`Avg References per Keyword: ${analysis.avgReferencesPerKeyword.toFixed(1)}`);
    
    console.log('\nTop 20 Keywords by Size:');
    console.log('========================');
    for (const keyword of analysis.topKeywordsBySize) {
      console.log(`${keyword.keyword.padEnd(20)} ${keyword.documentCount.toString().padStart(5)} docs  ${formatBytes(keyword.sizeBytes).padStart(10)}  (${keyword.sizePercentage.toFixed(1)}%)`);
    }
    
    console.log('\nTop 20 Keywords by Frequency:');
    console.log('=============================');
    for (const keyword of analysis.topKeywordsByFrequency) {
      console.log(`${keyword.keyword.padEnd(20)} ${keyword.documentCount.toString().padStart(5)} docs`);
    }
    
    // Extrapolation
    const scaleFactor = 34000 / 10; // 34k cases vs 10 sample cases
    console.log('\nExtrapolation to Full Dataset (34,000 cases):');
    console.log('=============================================');
    console.log(`Estimated total index size: ${formatBytes(analysis.totalIndexSize * scaleFactor)}`);
    console.log(`  - Keywords index: ${formatBytes(analysis.keywordIndexSize * Math.sqrt(scaleFactor))} (grows slower)`);
    console.log(`  - Keyword files: ${formatBytes((analysis.totalIndexSize - analysis.keywordIndexSize - analysis.documentFilesSize - analysis.caseIndexSize) * scaleFactor)}`);
    console.log(`  - Document files: ${formatBytes(analysis.documentFilesSize * scaleFactor)}`);
    console.log(`  - Case index: ${formatBytes(analysis.caseIndexSize * scaleFactor)}`);
    
    console.log('\nAnalysis:');
    console.log('=========');
    console.log('The index is now optimized to store only document IDs in keyword files.');
    console.log('Document metadata is stored separately in document files.');
    console.log('This eliminates redundancy and significantly reduces index size.');
    
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
runAnalysis();