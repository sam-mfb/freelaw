# Phase 4: PDF Service

## Objective

Create a simple service to handle opening PDF files in new browser tabs. This is a standalone service with minimal dependencies.

## Interface

```typescript
// services/pdfService.ts

/**
 * Opens a PDF in a new browser tab
 * @param filePath - Relative path from the data directory (e.g., "recap/gov.uscourts.nysb.290325/file.pdf")
 * @param baseUrl - Optional base URL (defaults to '/data/sata')
 */
export function openPDF(filePath: string, baseUrl?: string): void;

/**
 * Constructs the full URL for a PDF
 * @param filePath - Relative path from the data directory
 * @param baseUrl - Optional base URL (defaults to '/data/sata')
 * @returns Full URL that can be used in an anchor tag or window.open
 */
export function getPDFUrl(filePath: string, baseUrl?: string): string;

/**
 * Checks if a PDF URL is accessible (optional)
 * @param filePath - Relative path from the data directory
 * @param baseUrl - Optional base URL (defaults to '/data/sata')
 * @returns Promise resolving to true if PDF exists
 */
export function checkPDFExists(filePath: string, baseUrl?: string): Promise<boolean>;
```

## Implementation

```typescript
// Default base URL for PDF files
const DEFAULT_BASE_URL = '/data/sata';

/**
 * Opens a PDF in a new browser tab
 */
export function openPDF(filePath: string, baseUrl: string = DEFAULT_BASE_URL): void {
  const url = getPDFUrl(filePath, baseUrl);
  window.open(url, '_blank');
}

/**
 * Constructs the full URL for a PDF
 */
export function getPDFUrl(filePath: string, baseUrl: string = DEFAULT_BASE_URL): string {
  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  // Handle both full paths and relative paths
  if (cleanPath.startsWith('recap/')) {
    return `${baseUrl}/${cleanPath}`;
  }
  
  // Assume it's already a relative path within recap
  return `${baseUrl}/recap/${cleanPath}`;
}

/**
 * Checks if a PDF URL is accessible
 */
export async function checkPDFExists(filePath: string, baseUrl: string = DEFAULT_BASE_URL): Promise<boolean> {
  try {
    const url = getPDFUrl(filePath, baseUrl);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking PDF:', error);
    return false;
  }
}

// Factory function to create PDF service with custom base URL
export function createPDFService(baseUrl: string = DEFAULT_BASE_URL) {
  return {
    openPDF: (filePath: string) => openPDF(filePath, baseUrl),
    getPDFUrl: (filePath: string) => getPDFUrl(filePath, baseUrl),
    checkPDFExists: (filePath: string) => checkPDFExists(filePath, baseUrl),
  };
}
```

## Alternative Simple Implementation

If the above seems over-engineered, here's a minimal version:

```typescript
// services/pdfService.ts
export function openPDF(filePath: string): void {
  const url = `/data/sata/${filePath}`;
  window.open(url, '_blank');
}
```

## Testing

### Test File: `services/pdfService.test.ts`

Write a simple test that verifies:
- The service can construct PDF URLs correctly
- The service attempts to open PDFs in new tabs
- The service works without dependencies on other phases

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
    <button onclick="testPDF1()">Test PDF 1 (Module Functions)</button>
    <button onclick="testPDF2()">Test PDF 2 (Module Functions)</button>
    <button onclick="checkPDF()">Check PDF Exists</button>
    <br><br>
    <button onclick="testFactory()">Test Factory Function</button>
    <button onclick="testCustomBaseUrl()">Test Custom Base URL</button>
  </div>
  
  <div id="results"></div>
  
  <script type="module">
    // Inline implementation for testing
    const DEFAULT_BASE_URL = '/data/sata';
    
    function openPDF(filePath, baseUrl = DEFAULT_BASE_URL) {
      const url = getPDFUrl(filePath, baseUrl);
      console.log('Opening PDF:', url);
      window.open(url, '_blank');
    }
    
    function getPDFUrl(filePath, baseUrl = DEFAULT_BASE_URL) {
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      if (cleanPath.startsWith('recap/')) {
        return `${baseUrl}/${cleanPath}`;
      }
      return `${baseUrl}/recap/${cleanPath}`;
    }
    
    async function checkPDFExists(filePath, baseUrl = DEFAULT_BASE_URL) {
      try {
        const url = getPDFUrl(filePath, baseUrl);
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch (error) {
        return false;
      }
    }
    
    function createPDFService(baseUrl = DEFAULT_BASE_URL) {
      return {
        openPDF: (filePath) => openPDF(filePath, baseUrl),
        getPDFUrl: (filePath) => getPDFUrl(filePath, baseUrl),
        checkPDFExists: (filePath) => checkPDFExists(filePath, baseUrl),
      };
    }
    
    const results = document.getElementById('results');
    
    window.testPDF1 = () => {
      // Use actual path from sample data
      openPDF('recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf');
      results.innerHTML += '<p>✅ Attempted to open PDF 1 using module function</p>';
    };
    
    window.testPDF2 = () => {
      // Test with different path format
      openPDF('gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.15.0.pdf');
      results.innerHTML += '<p>✅ Attempted to open PDF 2 using module function</p>';
    };
    
    window.checkPDF = async () => {
      const exists = await checkPDFExists('recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf');
      results.innerHTML += `<p>${exists ? '✅' : '❌'} PDF exists check: ${exists}</p>`;
    };
    
    window.testFactory = () => {
      const service = createPDFService();
      service.openPDF('recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf');
      results.innerHTML += '<p>✅ Attempted to open PDF using factory function</p>';
    };
    
    window.testCustomBaseUrl = () => {
      const service = createPDFService('/custom/data/path');
      const url = service.getPDFUrl('recap/test.pdf');
      results.innerHTML += `<p>✅ Custom base URL: ${url}</p>`;
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
import { openPDF } from '@/services/pdfService';

function DocumentRow({ document }) {
  const handleViewPDF = () => {
    if (document.filePath) {
      openPDF(document.filePath);
    }
  };
  
  return (
    <div>
      <span>{document.description}</span>
      <button onClick={handleViewPDF}>View PDF</button>
    </div>
  );
}

// Using the factory function for custom base URL
import { createPDFService } from '@/services/pdfService';

function DocumentViewer({ baseUrl }) {
  const pdfService = createPDFService(baseUrl);
  
  const handleViewPDF = (filePath: string) => {
    pdfService.openPDF(filePath);
  };
  
  return (
    // Component JSX
  );
}
```

## Notes for Integration

- This service is used by Phase 6 (React components)
- Module-level functions (`openPDF`, `getPDFUrl`, `checkPDFExists`) are the primary API
- The factory function `createPDFService()` is useful when you need a custom base URL
- Assumes Vite is configured to serve PDFs (Phase 2)
- File paths come from the document data (Phase 3)
- Consider adding loading states or error handling in UI
- Functions are tree-shakeable for optimal bundle size