import React from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  setCurrentPage,
  setResultsPerPage,
  setSortBy,
  setSortOrder,
  selectPaginatedResults,
  selectCurrentSearch,
  selectSortingState,
} from '../store/documentSearchSlice';
import type { SortBy } from '../store/documentSearchSlice';
import { getPdfPath } from '../constants/paths';

export const DocumentSearchResults: React.FC = () => {
  const dispatch = useAppDispatch();
  const { keywords, operator } = useAppSelector(selectCurrentSearch);
  const { sortBy, sortOrder } = useAppSelector(selectSortingState);
  const {
    results,
    totalResults,
    currentPage,
    resultsPerPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  } = useAppSelector(selectPaginatedResults);

  const handlePageChange = (page: number): void => {
    dispatch(setCurrentPage(page));
  };

  const handlePageSizeChange = (size: number): void => {
    dispatch(setResultsPerPage(size));
  };

  const handleSortByChange = (newSortBy: SortBy): void => {
    dispatch(setSortBy(newSortBy));
  };

  const handleSortOrderChange = (): void => {
    dispatch(setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'));
  };

  const highlightKeywords = (text: string): string => {
    if (!text || keywords.length === 0) return text || '';

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
          <div className="sort-controls">
            <label htmlFor="sort-by">Sort by:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => handleSortByChange(e.target.value as SortBy)}
              className="sort-select"
            >
              <option value="relevance">Relevance</option>
              <option value="pageCount">Page Count</option>
              <option value="dateFiled">Date Filed</option>
              <option value="fileSize">File Size</option>
              <option value="description">Description</option>
            </select>
            <button
              onClick={handleSortOrderChange}
              className="sort-order-btn"
              aria-label={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
              title={`Currently sorting ${sortOrder === 'asc' ? 'ascending' : 'descending'}. Click to reverse.`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          
          <div className="pagination-controls">
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
      </div>

      <div className="results-list">
        {results.map((document) => (
          <div key={document.searchId} className="document-result-card">
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

            {document.filePath && (
              <div className="document-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (document.filePath) {
                      const path = getPdfPath(document.filePath);
                      window.open(path, '_blank');
                    }
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Open PDF
                </button>
              </div>
            )}
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
    </div>
  );
};
