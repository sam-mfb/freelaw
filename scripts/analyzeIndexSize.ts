import { promises as fs } from 'fs';
import path from 'path';
import { extractKeywords, createDocumentId } from './extractKeywords';
import type { Case } from '../src/types/case.types';

interface SizeAnalysis {
  totalSize: number;
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
  descriptionRedundancy: {
    uniqueDescriptions: number;
    totalDescriptions: number;
    avgDescriptionLength: number;
    totalDescriptionBytes: number;
  };
}

async function analyzeIndexSize(dataDir: string): Promise<SizeAnalysis> {
  // Build the index first
  const jsonDir = path.join(dataDir, 'docket-data');
  const files = await fs.readdir(jsonDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  const cases: Case[] = [];
  for (const file of jsonFiles) {
    const content = await fs.readFile(path.join(jsonDir, file), 'utf-8');
    cases.push(JSON.parse(content));
  }

  // Build document search index
  const documentSearchIndex: Record<string, Array<{ documentId: string; description: string }>> = {};
  const allDescriptions = new Set<string>();
  let totalDescriptionCount = 0;
  let totalDescriptionLength = 0;

  for (const caseData of cases) {
    if (!caseData.docket_entries) continue;
    
    for (const entry of caseData.docket_entries) {
      const description = entry.description || '';
      allDescriptions.add(description);
      totalDescriptionCount++;
      totalDescriptionLength += description.length;
      
      const keywords = extractKeywords(description);
      
      const documentId = createDocumentId(
        caseData.id,
        entry.document_number ?? '0',
        entry.recap_documents?.[0]?.attachment_number ?? 'null'
      );
      
      for (const keyword of keywords) {
        if (!documentSearchIndex[keyword]) {
          documentSearchIndex[keyword] = [];
        }
        documentSearchIndex[keyword].push({ documentId, description });
      }
    }
  }

  // Analyze sizes
  const keywordSizes: Array<{
    keyword: string;
    documentCount: number;
    sizeBytes: number;
  }> = [];

  let totalDocumentReferences = 0;
  let totalDescriptionBytes = 0;

  for (const [keyword, documents] of Object.entries(documentSearchIndex)) {
    const serialized = JSON.stringify({ [keyword]: documents });
    const sizeBytes = Buffer.byteLength(serialized, 'utf8');
    
    keywordSizes.push({
      keyword,
      documentCount: documents.length,
      sizeBytes
    });
    
    totalDocumentReferences += documents.length;
    
    // Count description bytes
    for (const doc of documents) {
      totalDescriptionBytes += Buffer.byteLength(doc.description, 'utf8');
    }
  }

  // Sort by size and frequency
  const topBySize = [...keywordSizes]
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 20);
    
  const topByFrequency = [...keywordSizes]
    .sort((a, b) => b.documentCount - a.documentCount)
    .slice(0, 20);

  const totalSize = keywordSizes.reduce((sum, k) => sum + k.sizeBytes, 0);

  return {
    totalSize,
    keywordCount: keywordSizes.length,
    documentReferenceCount: totalDocumentReferences,
    avgReferencesPerKeyword: totalDocumentReferences / keywordSizes.length,
    topKeywordsBySize: topBySize.map(k => ({
      ...k,
      sizePercentage: (k.sizeBytes / totalSize) * 100
    })),
    topKeywordsByFrequency: topByFrequency.map(k => ({
      keyword: k.keyword,
      documentCount: k.documentCount
    })),
    descriptionRedundancy: {
      uniqueDescriptions: allDescriptions.size,
      totalDescriptions: totalDescriptionCount,
      avgDescriptionLength: totalDescriptionLength / totalDescriptionCount,
      totalDescriptionBytes
    }
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
  console.log('Analyzing sample data index...\n');

  try {
    const analysis = await analyzeIndexSize('./sample-data');
    
    console.log('Overall Statistics:');
    console.log('==================');
    console.log(`Total Index Size: ${formatBytes(analysis.totalSize)}`);
    console.log(`Unique Keywords: ${analysis.keywordCount}`);
    console.log(`Total Document References: ${analysis.documentReferenceCount}`);
    console.log(`Avg References per Keyword: ${analysis.avgReferencesPerKeyword.toFixed(1)}`);
    
    console.log('\nDescription Redundancy:');
    console.log('======================');
    console.log(`Unique Descriptions: ${analysis.descriptionRedundancy.uniqueDescriptions}`);
    console.log(`Total Description Occurrences: ${analysis.descriptionRedundancy.totalDescriptions}`);
    console.log(`Redundancy Factor: ${(analysis.descriptionRedundancy.totalDescriptions / analysis.descriptionRedundancy.uniqueDescriptions).toFixed(1)}x`);
    console.log(`Avg Description Length: ${analysis.descriptionRedundancy.avgDescriptionLength.toFixed(0)} chars`);
    console.log(`Total Description Bytes in Index: ${formatBytes(analysis.descriptionRedundancy.totalDescriptionBytes)}`);
    console.log(`Description % of Index: ${(analysis.descriptionRedundancy.totalDescriptionBytes / analysis.totalSize * 100).toFixed(1)}%`);
    
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
    console.log('\nProblem Analysis:');
    console.log('=================');
    console.log('The main issue is storing full descriptions with every keyword reference.');
    console.log(`Currently: ${(analysis.descriptionRedundancy.totalDescriptionBytes / analysis.totalSize * 100).toFixed(0)}% of index size is duplicate description text.`);
    
    console.log('\nPotential Solutions:');
    console.log('===================');
    console.log('1. Store only document IDs in the keyword index (not descriptions)');
    console.log('2. Create a separate document lookup table');
    console.log('3. Load descriptions on-demand when needed');
    
    // Calculate savings
    const bytesPerReference = analysis.totalSize / analysis.documentReferenceCount;
    const bytesPerIdOnly = 20; // Rough estimate for just storing IDs
    const potentialSize = analysis.documentReferenceCount * bytesPerIdOnly;
    const savings = ((analysis.totalSize - potentialSize) / analysis.totalSize * 100);
    
    console.log(`\nEstimated size with ID-only index: ${formatBytes(potentialSize)} (${savings.toFixed(0)}% reduction)`);
    console.log(`Extrapolated to full dataset: ${formatBytes(potentialSize * scaleFactor)}`);
    
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
runAnalysis();