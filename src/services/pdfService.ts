const DEFAULT_BASE_URL = '/data/sata';

/**
 * Factory function to create PDF service with custom base URL
 * @param baseUrl - Custom base URL for PDF files (defaults to '/data/sata')
 * @returns Object with PDF service methods bound to the custom base URL
 */
export function createPDFService(baseUrl: string = DEFAULT_BASE_URL) {
  /**
   * Constructs the full URL for a PDF
   * @param filePath - Relative path from the data directory
   * @returns Full URL that can be used in an anchor tag or window.open
   */
  function getPDFUrl(filePath: string): string {
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

    if (cleanPath.startsWith('recap/')) {
      return `${baseUrl}/${cleanPath}`;
    }

    return `${baseUrl}/recap/${cleanPath}`;
  }

  /**
   * Opens a PDF in a new browser tab
   * @param filePath - Relative path from the data directory (e.g., "recap/gov.uscourts.nysb.290325/file.pdf")
   */
  function openPDF(filePath: string): void {
    const url = getPDFUrl(filePath);
    window.open(url, '_blank');
  }

  /**
   * Checks if a PDF URL is accessible
   * @param filePath - Relative path from the data directory
   * @returns Promise resolving to true if PDF exists
   */
  async function checkPDFExists(filePath: string): Promise<boolean> {
    try {
      const url = getPDFUrl(filePath);
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error checking PDF:', error);
      return false;
    }
  }

  return {
    openPDF,
    getPDFUrl,
    checkPDFExists,
  };
}
