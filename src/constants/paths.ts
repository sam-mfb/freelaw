// Path constants for the application

// Base path for PDF files - this is intercepted by Vite middleware
// which routes to either ./data/sata or ./sample-data/sata based on USE_SAMPLE_DATA env var
export const PDF_BASE_PATH = '/data/sata';

// Base path for docket data - also intercepted by Vite middleware
export const DOCKET_DATA_BASE_PATH = '/data/docket-data';

// Function to get the full PDF path
export const getPdfPath = (filePath: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  return `${PDF_BASE_PATH}/${cleanPath}`;
};