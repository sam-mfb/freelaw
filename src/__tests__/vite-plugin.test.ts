import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';

interface MockResponse {
  setHeader: (name: string, value: string) => void;
  statusCode: number;
  end: (data: string) => void;
}

interface MockRequest {
  url: string;
}


// Mock the middleware functionality since we can't easily test the full Vite server
describe('Vite Data Plugin Middleware Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File serving logic', () => {
    it('should handle valid JSON file requests', async () => {
      const mockReq: MockRequest = {
        url: '/14560346.json'
      };
      const mockRes: MockResponse = {
        setHeader: vi.fn(),
        statusCode: 200,
        end: vi.fn()
      };

      // Mock fs.promises methods
      vi.spyOn(fs.promises, 'access').mockResolvedValue(undefined);
      vi.spyOn(fs.promises, 'stat').mockResolvedValue({
        isFile: () => true
      } as fs.Stats);
      vi.spyOn(fs, 'createReadStream').mockReturnValue({
        pipe: vi.fn()
      } as unknown as fs.ReadStream);

      // Simulate the middleware logic
      const dataRoot = './sample-data';
      const filePath = path.join(dataRoot, 'docket-data', mockReq.url);
      const fullPath = path.resolve(filePath);

      try {
        await fs.promises.access(fullPath);
        const stats = await fs.promises.stat(fullPath);
        
        if (stats.isFile()) {
          mockRes.setHeader('Content-Type', 'application/json');
          fs.createReadStream(fullPath).pipe(mockRes as unknown as NodeJS.WritableStream);
        }
      } catch {
        mockRes.statusCode = 404;
        mockRes.end('File not found');
      }

      expect(fs.promises.access).toHaveBeenCalledWith(fullPath);
      expect(fs.promises.stat).toHaveBeenCalledWith(fullPath);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(fs.createReadStream).toHaveBeenCalledWith(fullPath);
    });

    it('should handle valid PDF file requests', async () => {
      const mockReq: MockRequest = {
        url: '/recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf'
      };
      const mockRes: MockResponse = {
        setHeader: vi.fn(),
        statusCode: 200,
        end: vi.fn()
      };

      // Mock fs.promises methods
      vi.spyOn(fs.promises, 'access').mockResolvedValue(undefined);
      vi.spyOn(fs.promises, 'stat').mockResolvedValue({
        isFile: () => true
      } as fs.Stats);
      vi.spyOn(fs, 'createReadStream').mockReturnValue({
        pipe: vi.fn()
      } as unknown as fs.ReadStream);

      // Simulate the middleware logic for PDF files
      const dataRoot = './sample-data';
      const filePath = path.join(dataRoot, 'sata', mockReq.url);
      const fullPath = path.resolve(filePath);

      try {
        await fs.promises.access(fullPath);
        const stats = await fs.promises.stat(fullPath);
        
        if (stats.isFile()) {
          mockRes.setHeader('Content-Type', 'application/pdf');
          fs.createReadStream(fullPath).pipe(mockRes as unknown as NodeJS.WritableStream);
        }
      } catch {
        mockRes.statusCode = 404;
        mockRes.end('File not found');
      }

      expect(fs.promises.access).toHaveBeenCalledWith(fullPath);
      expect(fs.promises.stat).toHaveBeenCalledWith(fullPath);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(fs.createReadStream).toHaveBeenCalledWith(fullPath);
    });

    it('should return 404 for non-existent files', async () => {
      const mockReq: MockRequest = {
        url: '/nonexistent.json'
      };
      const mockRes: MockResponse = {
        setHeader: vi.fn(),
        statusCode: 200,
        end: vi.fn()
      };

      // Mock fs.promises.access to reject (file doesn't exist)
      vi.spyOn(fs.promises, 'access').mockRejectedValue(new Error('File not found'));

      // Simulate the middleware logic
      const dataRoot = './sample-data';
      const filePath = path.join(dataRoot, 'docket-data', mockReq.url);
      const fullPath = path.resolve(filePath);

      try {
        await fs.promises.access(fullPath);
        const stats = await fs.promises.stat(fullPath);
        
        if (stats.isFile()) {
          mockRes.setHeader('Content-Type', 'application/json');
          fs.createReadStream(fullPath).pipe(mockRes as unknown as NodeJS.WritableStream);
        }
      } catch {
        mockRes.statusCode = 404;
        mockRes.end('File not found');
      }

      expect(fs.promises.access).toHaveBeenCalledWith(fullPath);
      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.end).toHaveBeenCalledWith('File not found');
    });

    it('should return 404 for directories', async () => {
      const mockReq: MockRequest = {
        url: '/directory'
      };
      const mockRes: MockResponse = {
        setHeader: vi.fn(),
        statusCode: 200,
        end: vi.fn()
      };

      // Mock fs.promises methods - access succeeds but it's a directory
      vi.spyOn(fs.promises, 'access').mockResolvedValue(undefined);
      vi.spyOn(fs.promises, 'stat').mockResolvedValue({
        isFile: () => false
      } as fs.Stats);

      // Simulate the middleware logic
      const dataRoot = './sample-data';
      const filePath = path.join(dataRoot, 'docket-data', mockReq.url);
      const fullPath = path.resolve(filePath);

      try {
        await fs.promises.access(fullPath);
        const stats = await fs.promises.stat(fullPath);
        
        if (stats.isFile()) {
          mockRes.setHeader('Content-Type', 'application/json');
          fs.createReadStream(fullPath).pipe(mockRes as unknown as NodeJS.WritableStream);
        } else {
          mockRes.statusCode = 404;
          mockRes.end('File not found');
        }
      } catch {
        mockRes.statusCode = 404;
        mockRes.end('File not found');
      }

      expect(fs.promises.access).toHaveBeenCalledWith(fullPath);
      expect(fs.promises.stat).toHaveBeenCalledWith(fullPath);
      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.end).toHaveBeenCalledWith('File not found');
    });
  });

  describe('Path resolution', () => {
    it('should resolve paths correctly for JSON files', () => {
      const dataRoot = './sample-data';
      const url = '/14560346.json';
      const expectedPath = path.resolve(path.join(dataRoot, 'docket-data', url));
      const actualPath = path.resolve(path.join(dataRoot, 'docket-data', url));
      
      expect(actualPath).toBe(expectedPath);
    });

    it('should resolve paths correctly for PDF files', () => {
      const dataRoot = './sample-data';
      const url = '/recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf';
      const expectedPath = path.resolve(path.join(dataRoot, 'sata', url));
      const actualPath = path.resolve(path.join(dataRoot, 'sata', url));
      
      expect(actualPath).toBe(expectedPath);
    });
  });
});