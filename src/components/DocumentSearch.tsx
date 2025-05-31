import React from 'react';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  loadDocumentKeywords,
  searchDocuments,
  clearSearch,
  selectSearchState,
} from '../store/documentSearchSlice';
import { DocumentSearchKeywords } from './DocumentSearchKeywords';
import { DocumentSearchResults } from './DocumentSearchResults';

interface DocumentSearchProps {
  className?: string;
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const { loading, error, hasResults, isEmpty } = useAppSelector(selectSearchState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize keywords on mount
  useEffect(() => {
    if (!isInitialized) {
      dispatch(loadDocumentKeywords());
      setIsInitialized(true);
    }
  }, [dispatch, isInitialized]);

  const handleClearSearch = (): void => {
    dispatch(clearSearch());
  };

  const handleSearch = (keywords: string[], operator: 'AND' | 'OR'): void => {
    if (keywords.length > 0) {
      dispatch(searchDocuments({ keywords, operator }));
    }
  };

  return (
    <div className={`document-search ${className}`}>
      <div className="document-search-header">
        <h2>Document Search</h2>
        <div className="document-search-actions">
          <button
            onClick={handleClearSearch}
            className="btn btn-secondary"
            disabled={isEmpty}
            aria-label="Clear search"
          >
            Clear
          </button>
        </div>
      </div>

      <DocumentSearchKeywords onSearch={handleSearch} loading={loading} error={error} />

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {hasResults && <DocumentSearchResults />}

      {!isEmpty && !hasResults && !loading && (
        <div className="no-results">
          <p>No documents found for the selected keywords.</p>
          <p>Try adjusting your search terms or using the OR operator.</p>
        </div>
      )}
    </div>
  );
};