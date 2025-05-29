# Phase 4: PDF Service

## Objective

Create a simple service to handle opening PDF files in new browser tabs. This is a standalone service with minimal dependencies.

## Interface

```typescript
// services/pdfService.ts
export interface PDFService {
  /**
   * Opens a PDF in a new browser tab
   * @param filePath - Relative path from the data directory (e.g., "recap/gov.uscourts.nysb.290325/file.pdf")
   */
  openPDF(filePath: string): void;
  
  /**
   * Constructs the full URL for a PDF
   * @param filePath - Relative path from the data directory
   * @returns Full URL that can be used in an anchor tag or window.open
   */
  getPDFUrl(filePath: string): string;
  
  /**
   * Checks if a PDF URL is accessible (optional)
   * @param filePath - Relative path from the data directory
   * @returns Promise resolving to true if PDF exists
   */
  checkPDFExists(filePath: string): Promise<boolean>;
}
```

## Implementation

```typescript
export class PDFServiceImpl implements PDFService {
  private baseUrl: string;
  
  constructor(baseUrl: string = '/data/sata') {
    this.baseUrl = baseUrl;
  }
  
  openPDF(filePath: string): void {
    const url = this.getPDFUrl(filePath);
    window.open(url, '_blank');
  }
  
  getPDFUrl(filePath: string): string {
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    // Handle both full paths and relative paths
    if (cleanPath.startsWith('recap/')) {
      return `${this.baseUrl}/${cleanPath}`;
    }
    
    // Assume it's already a relative path within recap
    return `${this.baseUrl}/recap/${cleanPath}`;
  }
  
  async checkPDFExists(filePath: string): Promise<boolean> {
    try {
      const url = this.getPDFUrl(filePath);
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error checking PDF:', error);
      return false;
    }
  }
}

// Export singleton instance
export const pdfService = new PDFServiceImpl();
```

## Alternative Simple Implementation

If the above seems over-engineered, here's a minimal version:

```typescript
// services/pdfService.ts
export const pdfService = {
  openPDF(filePath: string): void {
    const url = `/data/sata/${filePath}`;
    window.open(url, '_blank');
  }
};
```

## Testing

### Manual Test HTML

Create `test-pdf-service.html` in the public directory:

```html
<!DOCTYPE html>
<html>
<head>
  <title>PDF Service Test</title>
</head>
<body>
  <h2>PDF Service Test</h2>
  
  <div>
    <p>Test PDF paths from sample data:</p>
    <button onclick="testPDF1()">Test PDF 1</button>
    <button onclick="testPDF2()">Test PDF 2</button>
    <button onclick="checkPDF()">Check PDF Exists</button>
  </div>
  
  <div id="results"></div>
  
  <script type="module">
    // Inline implementation for testing
    class PDFService {
      constructor(baseUrl = '/data/sata') {
        this.baseUrl = baseUrl;
      }
      
      openPDF(filePath) {
        const url = this.getPDFUrl(filePath);
        console.log('Opening PDF:', url);
        window.open(url, '_blank');
      }
      
      getPDFUrl(filePath) {
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        if (cleanPath.startsWith('recap/')) {
          return `${this.baseUrl}/${cleanPath}`;
        }
        return `${this.baseUrl}/recap/${cleanPath}`;
      }
      
      async checkPDFExists(filePath) {
        try {
          const url = this.getPDFUrl(filePath);
          const response = await fetch(url, { method: 'HEAD' });
          return response.ok;
        } catch (error) {
          return false;
        }
      }
    }
    
    const service = new PDFService();
    const results = document.getElementById('results');
    
    window.testPDF1 = () => {
      // Use actual path from sample data
      service.openPDF('recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf');
      results.innerHTML += '<p>✅ Attempted to open PDF 1</p>';
    };
    
    window.testPDF2 = () => {
      // Test with different path format
      service.openPDF('gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.15.0.pdf');
      results.innerHTML += '<p>✅ Attempted to open PDF 2</p>';
    };
    
    window.checkPDF = async () => {
      const exists = await service.checkPDFExists('recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf');
      results.innerHTML += `<p>${exists ? '✅' : '❌'} PDF exists check: ${exists}</p>`;
    };
  </script>
</body>
</html>
```

### Test Procedure

1. Start Vite dev server: `npm run dev`
2. Navigate to `http://localhost:5173/test-pdf-service.html`
3. Click test buttons:
   - "Test PDF 1" should open a PDF in a new tab
   - "Test PDF 2" should handle alternate path format
   - "Check PDF Exists" should return true for valid PDFs

## Success Criteria

- [ ] Can open PDFs in new browser tabs
- [ ] Handles different path formats correctly
- [ ] Returns correct URLs for PDF files
- [ ] checkPDFExists returns accurate results (optional)
- [ ] No TypeScript errors
- [ ] Works with sample data PDFs

## Usage Example

```typescript
// In a React component
import { pdfService } from '@/services/pdfService';

function DocumentRow({ document }) {
  const handleViewPDF = () => {
    if (document.filePath) {
      pdfService.openPDF(document.filePath);
    }
  };
  
  return (
    <div>
      <span>{document.description}</span>
      <button onClick={handleViewPDF}>View PDF</button>
    </div>
  );
}
```

## Notes for Integration

- This service is used by Phase 6 (React components)
- Assumes Vite is configured to serve PDFs (Phase 2)
- File paths come from the document data (Phase 3)
- Consider adding loading states or error handling in UI