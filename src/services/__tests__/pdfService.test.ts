import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPDFService } from '../pdfService';

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(globalThis, 'window', {
  value: {
    open: mockWindowOpen,
  },
  writable: true,
});

// Mock fetch for checkPDFExists tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('createPDFService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPDFUrl', () => {
    it('should construct URL with default base URL for recap path', () => {
      const service = createPDFService();
      const filePath = 'recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf';
      const result = service.getPDFUrl(filePath);
      expect(result).toBe(
        '/data/sata/recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf',
      );
    });

    it('should construct URL for path without recap prefix', () => {
      const service = createPDFService();
      const filePath = 'gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf';
      const result = service.getPDFUrl(filePath);
      expect(result).toBe(
        '/data/sata/recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf',
      );
    });

    it('should handle leading slash in file path', () => {
      const service = createPDFService();
      const filePath = '/recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf';
      const result = service.getPDFUrl(filePath);
      expect(result).toBe(
        '/data/sata/recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf',
      );
    });

    it('should use custom base URL when provided', () => {
      const service = createPDFService('/custom/data/path');
      const filePath = 'recap/test.pdf';
      const result = service.getPDFUrl(filePath);
      expect(result).toBe('/custom/data/path/recap/test.pdf');
    });
  });

  describe('openPDF', () => {
    it('should open PDF in new tab with correct URL', () => {
      const service = createPDFService();
      const filePath = 'recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf';
      service.openPDF(filePath);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        '/data/sata/recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf',
        '_blank',
      );
    });

    it('should use custom base URL when provided', () => {
      const service = createPDFService('/custom/base');
      const filePath = 'recap/test.pdf';
      service.openPDF(filePath);

      expect(mockWindowOpen).toHaveBeenCalledWith('/custom/base/recap/test.pdf', '_blank');
    });
  });

  describe('checkPDFExists', () => {
    it('should return true when PDF exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const service = createPDFService();
      const filePath = 'recap/test.pdf';
      const result = await service.checkPDFExists(filePath);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/data/sata/recap/test.pdf', { method: 'HEAD' });
    });

    it('should return false when PDF does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const service = createPDFService();
      const filePath = 'recap/nonexistent.pdf';
      const result = await service.checkPDFExists(filePath);

      expect(result).toBe(false);
    });

    it('should return false when fetch throws an error', async () => {
      // Suppress expected error output using vitest's built-in console mocking
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const service = createPDFService();
      const filePath = 'recap/test.pdf';
      const result = await service.checkPDFExists(filePath);

      expect(result).toBe(false);
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('factory function', () => {
    it('should create service with default base URL', () => {
      const service = createPDFService();
      const url = service.getPDFUrl('recap/test.pdf');
      expect(url).toBe('/data/sata/recap/test.pdf');
    });

    it('should create service with custom base URL', () => {
      const service = createPDFService('/custom/base');
      const url = service.getPDFUrl('recap/test.pdf');
      expect(url).toBe('/custom/base/recap/test.pdf');
    });

    it('should openPDF using service instance', () => {
      const service = createPDFService();
      service.openPDF('recap/test.pdf');

      expect(mockWindowOpen).toHaveBeenCalledWith('/data/sata/recap/test.pdf', '_blank');
    });

    it('should checkPDFExists using service instance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const service = createPDFService();
      const result = await service.checkPDFExists('recap/test.pdf');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/data/sata/recap/test.pdf', { method: 'HEAD' });
    });
  });
});
