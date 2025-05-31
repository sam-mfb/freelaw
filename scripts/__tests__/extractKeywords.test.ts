import { describe, it, expect } from 'vitest';
import { extractKeywords, createDocumentId, parseDocumentId } from '../extractKeywords';

describe('extractKeywords', () => {
  it('should extract legal keywords correctly', () => {
    const description = "Motion for Summary Judgment on Patent Claims";
    const keywords = extractKeywords(description);
    
    expect(keywords).toContain('motion');
    expect(keywords).toContain('summary');
    expect(keywords).toContain('judgment');
    expect(keywords).toContain('patent');
    expect(keywords).toContain('claims');
  });
  
  it('should filter stop words', () => {
    const description = "The Motion for the Summary";
    const keywords = extractKeywords(description);
    
    expect(keywords).not.toContain('the');
    expect(keywords).not.toContain('for');
  });

  it('should handle punctuation correctly', () => {
    const description = "Motion, Order & Response; Brief-Filing";
    const keywords = extractKeywords(description);
    
    expect(keywords).toContain('motion');
    expect(keywords).toContain('order');
    expect(keywords).toContain('response');
    expect(keywords).toContain('brief');
    expect(keywords).toContain('filing');
  });

  it('should handle case insensitivity', () => {
    const description = "MOTION for Summary JUDGMENT";
    const keywords = extractKeywords(description);
    
    expect(keywords).toContain('motion');
    expect(keywords).toContain('summary');
    expect(keywords).toContain('judgment');
  });

  it('should filter short words (less than 3 characters)', () => {
    const description = "Re: Motion to File Ex Parte";
    const keywords = extractKeywords(description);
    
    expect(keywords).not.toContain('re');
    expect(keywords).not.toContain('ex');
    expect(keywords).toContain('motion');
    expect(keywords).toContain('file');
    expect(keywords).toContain('parte');
  });

  it('should prioritize legal keywords even if short', () => {
    const description = "Motion and Order regarding Discovery";
    const keywords = extractKeywords(description);
    
    expect(keywords).toContain('motion');
    expect(keywords).toContain('order');
    expect(keywords).toContain('discovery');
    expect(keywords).toContain('regarding');
  });

  it('should deduplicate keywords', () => {
    const description = "Motion for Motion to File Motion";
    const keywords = extractKeywords(description);
    
    const motionCount = keywords.filter(k => k === 'motion').length;
    expect(motionCount).toBe(1);
  });

  it('should return sorted keywords', () => {
    const description = "Response to Motion for Discovery";
    const keywords = extractKeywords(description);
    
    const sorted = [...keywords].sort();
    expect(keywords).toEqual(sorted);
  });

  it('should handle empty or invalid input', () => {
    expect(extractKeywords('')).toEqual([]);
    expect(extractKeywords('   ')).toEqual([]);
    expect(extractKeywords('!@#$%^&*()')).toEqual([]);
  });

  it('should extract keywords from complex legal descriptions', () => {
    const description = "Defendant's Opposition to Plaintiff's Motion for Preliminary Injunction and Request for Expedited Hearing";
    const keywords = extractKeywords(description);
    
    expect(keywords).toContain('defendant');
    expect(keywords).toContain('opposition');
    expect(keywords).toContain('plaintiff');
    expect(keywords).toContain('motion');
    expect(keywords).toContain('preliminary');
    expect(keywords).toContain('injunction');
    expect(keywords).toContain('request');
    expect(keywords).toContain('expedited');
    expect(keywords).toContain('hearing');
  });
});

describe('createDocumentId', () => {
  it('should create document ID with correct format', () => {
    const id = createDocumentId(100877, '15', 0);
    expect(id).toBe('100877-15-0');
  });

  it('should handle string document numbers', () => {
    const id = createDocumentId(234561, '5A', 2);
    expect(id).toBe('234561-5A-2');
  });

  it('should handle attachment numbers', () => {
    const id = createDocumentId(12345, '1', 3);
    expect(id).toBe('12345-1-3');
  });

  it('should handle null attachment numbers', () => {
    const id = createDocumentId(100877, '15', 'null');
    expect(id).toBe('100877-15-null');
  });
});

describe('parseDocumentId', () => {
  it('should parse valid document ID correctly', () => {
    const result = parseDocumentId('100877-15-0');
    expect(result).toEqual({
      caseId: 100877,
      documentNumber: '15',
      attachmentNumber: 0
    });
  });

  it('should handle string document numbers', () => {
    const result = parseDocumentId('234561-5A-2');
    expect(result).toEqual({
      caseId: 234561,
      documentNumber: '5A',
      attachmentNumber: 2
    });
  });

  it('should handle null attachment numbers', () => {
    const result = parseDocumentId('100877-15-null');
    expect(result).toEqual({
      caseId: 100877,
      documentNumber: '15',
      attachmentNumber: null
    });
  });

  it('should throw error for invalid format', () => {
    expect(() => parseDocumentId('invalid')).toThrow('Invalid document ID format');
    expect(() => parseDocumentId('100-200')).toThrow('Invalid document ID format');
    expect(() => parseDocumentId('100-200-300-400')).toThrow('Invalid document ID format');
  });

  it('should handle edge cases', () => {
    const result = parseDocumentId('0-0-0');
    expect(result).toEqual({
      caseId: 0,
      documentNumber: '0',
      attachmentNumber: 0
    });
  });
});