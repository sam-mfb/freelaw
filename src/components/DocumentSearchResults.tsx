import React from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  selectDocument,
  setCurrentPage,
  setResultsPerPage,
  selectPaginatedResults,
  selectCurrentSearch,
  selectSelectedDocument,
} from '../store/documentSearchSlice';
import type { SearchableDocument } from '../types/document.types';

export const DocumentSearchResults: React.FC = () => {
  const dispatch = useAppDispatch();
  const { keywords, operator } = useAppSelector(selectCurrentSearch);
  const selectedDocument = useAppSelector(selectSelectedDocument);
  const {
    results,
    totalResults,
    currentPage,
    resultsPerPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  } = useAppSelector(selectPaginatedResults);

  const handleSelectDocument = (document: SearchableDocument): void => {
    dispatch(selectDocument(document.searchId));
  };

  const handlePageChange = (page: number): void => {
    dispatch(setCurrentPage(page));
  };

  const handlePageSizeChange = (size: number): void => {
    dispatch(setResultsPerPage(size));
  };

  const highlightKeywords = (text: string): string => {
    if (keywords.length === 0) return text;

    const keywordPattern = new RegExp(`(${keywords.join('|')})`, 'gi');
    return text.replace(keywordPattern, '<mark>$1</mark>');
  };

  return (
    <div className="document-search-results">
      <div className="results-header">
        <h3>
          {totalResults} document{totalResults !== 1 ? 's' : ''} found
          {keywords.length > 0 && (
            <span className="search-summary"> for "{keywords.join(` ${operator} `)}"</span>
          )}
        </h3>

        <div className="results-controls">
          <label htmlFor="results-per-page">Show:</label>
          <select
            id="results-per-page"
            value={resultsPerPage}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      <div className="results-list">
        {results.map((document) => (
          <div
            key={document.id}
            className={`document-result-card ${selectedDocument?.searchId === document.searchId ? 'selected' : ''}`}
            onClick={() => handleSelectDocument(document)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectDocument(document);
              }
            }}
          >
            <div className="document-header">
              <h4 className="document-title">
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightKeywords(document.description),
                  }}
                />
              </h4>
              <span className="document-id">{document.searchId}</span>
            </div>

            <div className="document-meta">
              <span className="case-name" title={document.caseName}>
                {document.caseName.length > 50
                  ? `${document.caseName.substring(0, 50)}...`
                  : document.caseName}
              </span>
              <span className="court">{document.court.toUpperCase()}</span>
              {document.dateFiled && (
                <span className="date">{new Date(document.dateFiled).toLocaleDateString()}</span>
              )}
            </div>

            <div className="document-details">
              <span>Doc #{document.documentNumber}</span>
              {document.attachmentNumber && document.attachmentNumber > 0 && (
                <span>Attachment {document.attachmentNumber}</span>
              )}
              {document.pageCount && <span>{document.pageCount} pages</span>}
              {document.fileSize && <span>{(document.fileSize / 1024).toFixed(1)} KB</span>}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="results-pagination">
          <div className="pagination-info">
            Showing {(currentPage - 1) * resultsPerPage + 1}-
            {Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults}
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="pagination-btn"
              aria-label="First page"
            >
              ⏮
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPreviousPage}
              className="pagination-btn"
              aria-label="Previous page"
            >
              ◀
            </button>

            <span className="pagination-current">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
              className="pagination-btn"
              aria-label="Next page"
            >
              ▶
            </button>

            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
              aria-label="Last page"
            >
              ⏭
            </button>
          </div>
        </div>
      )}

      {selectedDocument && (
        <div className="selected-document-preview">
          <h4>Selected Document</h4>
          <p>
            <strong>Description:</strong> {selectedDocument.description}
          </p>
          <p>
            <strong>Case:</strong> {selectedDocument.caseName}
          </p>
          {selectedDocument.filePath && (
            <button
              onClick={() => window.open(selectedDocument.filePath as string, '_blank')}
              className="btn btn-primary"
            >
              Open PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
};
