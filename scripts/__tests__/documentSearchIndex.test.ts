import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Document Search Index Output', () => {
  const outputDir = './public/data/document-search';
  
  beforeAll(() => {
    // Ensure the index is built with sample data
    try {
      execSync('npm run build:index:full:sample', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to build sample index:', error);
    }
  });

  it('should create keywords.json with correct structure', async () => {
    const keywordsPath = path.join(outputDir, 'keywords.json');
    const exists = await fs.access(keywordsPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
    
    const content = await fs.readFile(keywordsPath, 'utf-8');
    const data = JSON.parse(content);
    
    expect(data).toHaveProperty('keywords');
    expect(Array.isArray(data.keywords)).toBe(true);
    expect(data.keywords.length).toBeGreaterThan(0);
    
    // Keywords should be sorted
    const sorted = [...data.keywords].sort();
    expect(data.keywords).toEqual(sorted);
  });

  it('should create individual keyword files', async () => {
    const keywordsDir = path.join(outputDir, 'keywords');
    const dirExists = await fs.access(keywordsDir).then(() => true).catch(() => false);
    expect(dirExists).toBe(true);
    
    const files = await fs.readdir(keywordsDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.every(f => f.endsWith('.json'))).toBe(true);
  });

  it('should have valid document ID format in keyword files', async () => {
    const keywordsDir = path.join(outputDir, 'keywords');
    const files = await fs.readdir(keywordsDir);
    
    // Test the first few keyword files
    const testFiles = files.slice(0, 5);
    
    for (const file of testFiles) {
      const content = await fs.readFile(path.join(keywordsDir, file), 'utf-8');
      const data = JSON.parse(content);
      
      expect(data).toHaveProperty('keyword');
      expect(data).toHaveProperty('documentIds');
      expect(Array.isArray(data.documentIds)).toBe(true);
      
      // Check document ID format
      for (const docId of data.documentIds) {
        const parts = docId.split('-');
        expect(parts).toHaveLength(3);
        
        const [caseId, docNum, attachNum] = parts;
        expect(Number.isInteger(Number(caseId))).toBe(true);
        expect(typeof docNum).toBe('string');
        // Attachment number can be 'null' or a number
        expect(attachNum === 'null' || Number.isInteger(Number(attachNum))).toBe(true);
      }
      
      // Document IDs should be sorted
      const sorted = [...data.documentIds].sort();
      expect(data.documentIds).toEqual(sorted);
    }
  });

  it('should have consistent keyword naming', async () => {
    const keywordsPath = path.join(outputDir, 'keywords.json');
    const keywordsContent = await fs.readFile(keywordsPath, 'utf-8');
    const keywordsData = JSON.parse(keywordsContent);
    
    const keywordsDir = path.join(outputDir, 'keywords');
    const files = await fs.readdir(keywordsDir);
    
    // Each keyword in keywords.json should have a corresponding file
    for (const keyword of keywordsData.keywords) {
      const fileName = `${keyword}.json`;
      expect(files).toContain(fileName);
      
      // File content should match keyword
      const fileContent = await fs.readFile(path.join(keywordsDir, fileName), 'utf-8');
      const fileData = JSON.parse(fileContent);
      expect(fileData.keyword).toBe(keyword);
    }
  });

  it('should contain expected legal keywords', async () => {
    const keywordsPath = path.join(outputDir, 'keywords.json');
    const content = await fs.readFile(keywordsPath, 'utf-8');
    const data = JSON.parse(content);
    
    // Common legal keywords that should appear in most datasets
    const expectedKeywords = ['motion', 'order', 'brief', 'judgment'];
    
    for (const keyword of expectedKeywords) {
      expect(data.keywords).toContain(keyword);
    }
  });
});