# Phase 4: React UI for Document Search

## Objective
Create React components for document search functionality, including keyword input, search interface, results display, and integration with the existing application layout.

## Deliverables
1. **DocumentSearch.tsx** - Main search interface component
2. **DocumentSearchResults.tsx** - Results display and pagination
3. **DocumentSearchKeywords.tsx** - Keyword management interface
4. **DocumentViewer.tsx** - Enhanced document viewer for search results
5. **Enhanced Layout.tsx** - Integration with existing application layout

## Component Architecture

### Component Hierarchy
```
Layout.tsx (enhanced)
├── Existing case search components
└── DocumentSearch.tsx (new)
    ├── DocumentSearchKeywords.tsx
    ├── DocumentSearchResults.tsx
    │   ├── DocumentResultCard.tsx
    │   └── SearchPagination.tsx
    └── DocumentViewer.tsx (enhanced)
```

### Component Responsibilities

- **DocumentSearch**: Container component, manages search state and actions
- **DocumentSearchKeywords**: Keyword input, suggestions, and management
- **DocumentSearchResults**: Results list, filtering, and pagination
- **DocumentViewer**: Display selected documents with search context
- **Layout**: Toggle between case search and document search modes

## Implementation

### 1. Main Document Search Component

Create `src/components/DocumentSearch.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  loadDocumentKeywords,
  searchDocuments,
  setSearchActive,
  clearSearch,
  selectDocumentSearch,
  selectCurrentSearch,
  selectSearchState,
} from '../store/documentSearchSlice';
import DocumentSearchKeywords from './DocumentSearchKeywords';
import DocumentSearchResults from './DocumentSearchResults';
import DocumentViewer from './DocumentViewer';

interface DocumentSearchProps {
  className?: string;
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const { isSearchActive } = useAppSelector(selectCurrentSearch);
  const { loading, error, hasResults, isEmpty } = useAppSelector(selectSearchState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize keywords on mount
  useEffect(() => {
    if (!isInitialized) {
      dispatch(loadDocumentKeywords());
      setIsInitialized(true);
    }
  }, [dispatch, isInitialized]);

  const handleToggleSearch = () => {
    if (isSearchActive) {
      dispatch(setSearchActive(false));
    } else {
      dispatch(setSearchActive(true));
    }
  };

  const handleClearSearch = () => {
    dispatch(clearSearch());
  };

  const handleSearch = (keywords: string[], operator: 'AND' | 'OR') => {
    if (keywords.length > 0) {
      dispatch(searchDocuments({ keywords, operator }));
    }
  };

  if (!isSearchActive) {
    return (
      <div className={`document-search-toggle ${className}`}>
        <button
          onClick={handleToggleSearch}
          className="btn btn-primary"
          aria-label="Open document search"
        >
          🔍 Search Documents
        </button>
      </div>
    );
  }

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
          <button
            onClick={handleToggleSearch}
            className="btn btn-outline"
            aria-label="Close document search"
          >
            ✕
          </button>
        </div>
      </div>

      <DocumentSearchKeywords
        onSearch={handleSearch}
        loading={loading}
        error={error}
      />

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {hasResults && (
        <DocumentSearchResults />
      )}

      {!isEmpty && !hasResults && !loading && (
        <div className="no-results">
          <p>No documents found for the selected keywords.</p>
          <p>Try adjusting your search terms or using the OR operator.</p>
        </div>
      )}
    </div>
  );
};

export default DocumentSearch;
```

### 2. Keywords Management Component

Create `src/components/DocumentSearchKeywords.tsx`:

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  setSearchKeywords,
  addSearchKeyword,
  removeSearchKeyword,
  setSearchOperator,
  selectCurrentSearch,
  selectKeywordSuggestions,
  selectAvailableKeywords,
} from '../store/documentSearchSlice';

interface DocumentSearchKeywordsProps {
  onSearch: (keywords: string[], operator: 'AND' | 'OR') => void;
  loading?: boolean;
  error?: string | null;
}

const DocumentSearchKeywords: React.FC<DocumentSearchKeywordsProps> = ({
  onSearch,
  loading = false,
  error = null,
}) => {
  const dispatch = useAppDispatch();
  const { keywords, operator } = useAppSelector(selectCurrentSearch);
  const availableKeywords = useAppSelector(selectAvailableKeywords);
  const keywordSuggestions = useAppSelector(selectKeywordSuggestions);
  
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.length >= 2) {
      const filtered = keywordSuggestions.filter(keyword =>
        keyword.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue, keywordSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleAddKeyword = (keyword: string) => {
    const trimmed = keyword.trim().toLowerCase();
    if (trimmed && availableKeywords.includes(trimmed)) {
      dispatch(addSearchKeyword(trimmed));
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    dispatch(removeSearchKeyword(keyword));
  };

  const handleOperatorChange = (newOperator: 'AND' | 'OR') => {
    dispatch(setSearchOperator(newOperator));
  };

  const handleSearch = () => {
    onSearch(keywords, operator);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAddKeyword(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="document-search-keywords">
      <div className="keyword-input-section">
        <div className="keyword-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="Add keyword (e.g., motion, deposition)..."
            className="keyword-input"
            disabled={loading}
            aria-label="Add search keyword"
          />
          
          {showSuggestions && (
            <div className="keyword-suggestions">
              {filteredSuggestions.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="keyword-suggestion"
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => handleAddKeyword(inputValue)}
          disabled={!inputValue.trim() || loading}
          className="btn btn-secondary"
          aria-label="Add keyword"
        >
          Add
        </button>
      </div>

      {keywords.length > 0 && (
        <div className="selected-keywords">
          <div className="keyword-tags">
            {keywords.map(keyword => (
              <span key={keyword} className="keyword-tag">
                {keyword}
                <button
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="keyword-remove"
                  aria-label={`Remove keyword ${keyword}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          <div className="search-controls">
            <div className="operator-selector">
              <label htmlFor="search-operator">Match:</label>
              <select
                id="search-operator"
                value={operator}
                onChange={(e) => handleOperatorChange(e.target.value as 'AND' | 'OR')}
                disabled={loading}
              >
                <option value="OR">Any keyword (OR)</option>
                <option value="AND">All keywords (AND)</option>
              </select>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading || keywords.length === 0}
              className="btn btn-primary search-button"
            >
              {loading ? 'Searching...' : 'Search Documents'}
            </button>
          </div>
        </div>
      )}

      {keywords.length === 0 && (
        <div className="keyword-help">
          <p>Start typing to see available keywords, or choose from common document types:</p>
          <div className="common-keywords">
            {['motion', 'deposition', 'order', 'summary', 'judgment', 'brief'].map(keyword => (
              availableKeywords.includes(keyword) && (
                <button
                  key={keyword}
                  onClick={() => handleAddKeyword(keyword)}
                  className="common-keyword"
                  disabled={loading}
                >
                  {keyword}
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSearchKeywords;
```

### 3. Search Results Component

Create `src/components/DocumentSearchResults.tsx`:

```typescript
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

const DocumentSearchResults: React.FC = () => {
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

  const handleSelectDocument = (document: SearchableDocument) => {
    dispatch(selectDocument(document.id));
  };

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  const handlePageSizeChange = (size: number) => {
    dispatch(setResultsPerPage(size));
  };

  const highlightKeywords = (text: string) => {
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
            <span className="search-summary">
              {' '}for "{keywords.join(` ${operator} `)}"
            </span>
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
        {results.map(document => (
          <div
            key={document.id}
            className={`document-result-card ${selectedDocument?.id === document.id ? 'selected' : ''}`}
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
                    __html: highlightKeywords(document.description) 
                  }} 
                />
              </h4>
              <span className="document-id">{document.id}</span>
            </div>
            
            <div className="document-meta">
              <span className="case-name" title={document.caseName}>
                {document.caseName.length > 50 
                  ? `${document.caseName.substring(0, 50)}...` 
                  : document.caseName
                }
              </span>
              <span className="court">{document.court.toUpperCase()}</span>
              {document.dateCreated && (
                <span className="date">{new Date(document.dateCreated).toLocaleDateString()}</span>
              )}
            </div>
            
            <div className="document-details">
              <span>Doc #{document.documentNumber}</span>
              {document.attachmentNumber > 0 && (
                <span>Attachment {document.attachmentNumber}</span>
              )}
              {document.pageCount && (
                <span>{document.pageCount} pages</span>
              )}
              {document.fileSize && (
                <span>{(document.fileSize / 1024).toFixed(1)} KB</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="results-pagination">
          <div className="pagination-info">
            Showing {(currentPage - 1) * resultsPerPage + 1}-{Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults}
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
          <p><strong>Description:</strong> {selectedDocument.description}</p>
          <p><strong>Case:</strong> {selectedDocument.caseName}</p>
          {selectedDocument.filePath && (
            <button
              onClick={() => window.open(selectedDocument.filePath, '_blank')}
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

export default DocumentSearchResults;
```

### 4. Enhanced Layout Integration

Update `src/components/Layout.tsx`:

```typescript
import React, { useState } from 'react';
import CaseSearch from './CaseSearch';
import DocumentSearch from './DocumentSearch';

const Layout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cases' | 'documents'>('cases');

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>Legal Document Browser</h1>
        <nav className="main-navigation">
          <button
            onClick={() => setActiveTab('cases')}
            className={`nav-tab ${activeTab === 'cases' ? 'active' : ''}`}
          >
            Browse Cases
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`nav-tab ${activeTab === 'documents' ? 'active' : ''}`}
          >
            Search Documents
          </button>
        </nav>
      </header>

      <main className="app-main">
        <div className="search-panel">
          {activeTab === 'cases' && (
            <div className="case-search-panel">
              <CaseSearch />
              {/* Existing case list and document view components */}
            </div>
          )}
          
          {activeTab === 'documents' && (
            <div className="document-search-panel">
              <DocumentSearch />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Layout;
```

### 5. CSS Styles

Create `src/components/DocumentSearch.css`:

```css
/* Document Search Styles */
.document-search {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.document-search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.document-search-actions {
  display: flex;
  gap: 10px;
}

/* Keywords Component */
.document-search-keywords {
  margin-bottom: 30px;
}

.keyword-input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.keyword-input-wrapper {
  flex: 1;
  position: relative;
}

.keyword-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.keyword-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.keyword-suggestion {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}

.keyword-suggestion:hover {
  background-color: #f5f5f5;
}

.selected-keywords {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.keyword-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 12px;
}

.keyword-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.search-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.operator-selector {
  display: flex;
  align-items: center;
  gap: 5px;
}

.search-button {
  padding: 8px 20px;
}

.keyword-help {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  text-align: center;
}

.common-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 10px;
}

.common-keyword {
  padding: 6px 12px;
  background: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.common-keyword:hover {
  background: #dee2e6;
}

/* Results Component */
.document-search-results {
  margin-top: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.search-summary {
  font-weight: normal;
  color: #666;
}

.results-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.document-result-card {
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.document-result-card:hover {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.document-result-card.selected {
  border-color: #007bff;
  background-color: #e3f2fd;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.document-title {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.document-title mark {
  background-color: #ffeb3b;
  padding: 1px 2px;
}

.document-id {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.document-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.case-name {
  font-weight: 500;
  color: #333;
}

.court {
  font-weight: 600;
  color: #007bff;
}

.document-details {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 12px;
  color: #888;
}

/* Pagination */
.results-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-top: 1px solid #e0e0e0;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-btn {
  padding: 6px 10px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.pagination-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-current {
  font-weight: 500;
  padding: 0 10px;
}

/* Selected Document Preview */
.selected-document-preview {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

/* Navigation Tabs */
.main-navigation {
  display: flex;
  gap: 0;
}

.nav-tab {
  padding: 10px 20px;
  border: 1px solid #ccc;
  background: #f8f9fa;
  cursor: pointer;
  border-bottom: none;
}

.nav-tab.active {
  background: white;
  border-bottom: 1px solid white;
  position: relative;
  z-index: 1;
}

.nav-tab:first-child {
  border-radius: 4px 0 0 0;
}

.nav-tab:last-child {
  border-radius: 0 4px 0 0;
}

/* Common Utilities */
.btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-outline {
  background: transparent;
  color: #007bff;
  border-color: #007bff;
}

.btn:hover {
  opacity: 0.9;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alert {
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

/* Responsive Design */
@media (max-width: 768px) {
  .document-search-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .search-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-button {
    width: 100%;
  }

  .results-pagination {
    flex-direction: column;
    gap: 10px;
  }

  .document-meta {
    flex-direction: column;
    gap: 5px;
  }

  .main-navigation {
    width: 100%;
  }

  .nav-tab {
    flex: 1;
    text-align: center;
  }
}
```

## Testing Strategy

### 1. Component Unit Tests

Create `src/components/__tests__/DocumentSearch.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi } from 'vitest';
import DocumentSearch from '../DocumentSearch';
import documentSearchReducer from '../../store/documentSearchSlice';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      documentSearch: documentSearchReducer,
    },
    preloadedState: {
      documentSearch: {
        availableKeywords: ['motion', 'deposition', 'order'],
        isSearchActive: false,
        currentKeywords: [],
        searchResults: [],
        searchLoading: false,
        searchError: null,
        ...initialState,
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            services: {
              dataService: {
                loadDocumentSearchKeywords: vi.fn().mockResolvedValue(['motion', 'deposition']),
                searchDocumentsByKeyword: vi.fn().mockResolvedValue([]),
                resolveDocumentIds: vi.fn().mockResolvedValue([]),
              },
            },
          },
        },
      }),
  });
};

describe('DocumentSearch', () => {
  it('should render toggle button when search is inactive', () => {
    const store = createMockStore({ isSearchActive: false });
    
    render(
      <Provider store={store}>
        <DocumentSearch />
      </Provider>
    );
    
    expect(screen.getByText('🔍 Search Documents')).toBeInTheDocument();
  });

  it('should render search interface when active', () => {
    const store = createMockStore({ isSearchActive: true });
    
    render(
      <Provider store={store}>
        <DocumentSearch />
      </Provider>
    );
    
    expect(screen.getByText('Document Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add keyword/)).toBeInTheDocument();
  });

  it('should toggle search state when button clicked', () => {
    const store = createMockStore({ isSearchActive: false });
    
    render(
      <Provider store={store}>
        <DocumentSearch />
      </Provider>
    );
    
    const toggleButton = screen.getByText('🔍 Search Documents');
    fireEvent.click(toggleButton);
    
    // Check if search became active
    const state = store.getState();
    expect(state.documentSearch.isSearchActive).toBe(true);
  });

  it('should display error messages', () => {
    const store = createMockStore({
      isSearchActive: true,
      searchError: 'Failed to load keywords',
    });
    
    render(
      <Provider store={store}>
        <DocumentSearch />
      </Provider>
    );
    
    expect(screen.getByText('Failed to load keywords')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

Create `src/components/__tests__/DocumentSearch.integration.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, it, expect, vi } from 'vitest';
import { createAppStore } from '../../store';
import DocumentSearch from '../DocumentSearch';

describe('DocumentSearch Integration', () => {
  it('should complete full search workflow', async () => {
    const user = userEvent.setup();
    
    // Create store with mock services
    const store = createAppStore({
      dataService: {
        loadDocumentSearchKeywords: vi.fn().mockResolvedValue(['motion', 'deposition']),
        searchDocumentsByKeyword: vi.fn().mockImplementation((keyword) => {
          const results = {
            'motion': ['100877-1-0', '234561-3-0'],
            'deposition': ['567890-2-0'],
          };
          return Promise.resolve(results[keyword as keyof typeof results] || []);
        }),
        resolveDocumentIds: vi.fn().mockImplementation((ids) => {
          return Promise.resolve(ids.map(id => ({
            id,
            caseId: parseInt(id.split('-')[0]),
            documentNumber: id.split('-')[1],
            attachmentNumber: parseInt(id.split('-')[2]),
            description: `Mock document for ${id}`,
            caseName: `Mock Case ${id.split('-')[0]}`,
            court: 'cacd',
          })));
        }),
      } as any,
    });

    render(
      <Provider store={store}>
        <DocumentSearch />
      </Provider>
    );

    // 1. Activate search
    await user.click(screen.getByText('🔍 Search Documents'));
    
    // 2. Add keywords
    const keywordInput = screen.getByPlaceholderText(/Add keyword/);
    await user.type(keywordInput, 'motion');
    await user.click(screen.getByText('Add'));
    
    // 3. Search
    await user.click(screen.getByText('Search Documents'));
    
    // 4. Wait for results
    await waitFor(() => {
      expect(screen.getByText(/documents found/)).toBeInTheDocument();
    });

    // 5. Verify results displayed
    expect(screen.getByText('Mock document for 100877-1-0')).toBeInTheDocument();
  });
});
```

### 3. Visual Component Testing

Create `public/tests/test-document-search-components.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Document Search Components Test</title>
    <link rel="stylesheet" href="../src/components/DocumentSearch.css">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .component-demo { margin: 40px 0; padding: 20px; border: 1px solid #ccc; }
        .demo-title { background: #f5f5f5; margin: -20px -20px 20px -20px; padding: 10px 20px; }
    </style>
</head>
<body>
    <h1>Document Search Components Visual Test</h1>
    
    <div class="component-demo">
        <h2 class="demo-title">1. Keywords Input Component</h2>
        <div class="document-search-keywords">
            <div class="keyword-input-section">
                <div class="keyword-input-wrapper">
                    <input type="text" class="keyword-input" placeholder="Add keyword (e.g., motion, deposition)..." value="mot">
                    <div class="keyword-suggestions">
                        <button class="keyword-suggestion">motion</button>
                        <button class="keyword-suggestion">mortgage</button>
                    </div>
                </div>
                <button class="btn btn-secondary">Add</button>
            </div>
            
            <div class="selected-keywords">
                <div class="keyword-tags">
                    <span class="keyword-tag">
                        motion
                        <button class="keyword-remove">✕</button>
                    </span>
                    <span class="keyword-tag">
                        summary
                        <button class="keyword-remove">✕</button>
                    </span>
                </div>
                
                <div class="search-controls">
                    <div class="operator-selector">
                        <label>Match:</label>
                        <select>
                            <option>Any keyword (OR)</option>
                            <option>All keywords (AND)</option>
                        </select>
                    </div>
                    <button class="btn btn-primary search-button">Search Documents</button>
                </div>
            </div>
        </div>
    </div>
    
    <div class="component-demo">
        <h2 class="demo-title">2. Search Results Component</h2>
        <div class="document-search-results">
            <div class="results-header">
                <h3>25 documents found <span class="search-summary">for "motion OR summary"</span></h3>
                <div class="results-controls">
                    <label>Show:</label>
                    <select>
                        <option>10 per page</option>
                        <option selected>20 per page</option>
                        <option>50 per page</option>
                    </select>
                </div>
            </div>
            
            <div class="results-list">
                <div class="document-result-card selected">
                    <div class="document-header">
                        <h4 class="document-title">
                            <mark>Motion</mark> for <mark>Summary</mark> Judgment on Patent Claims
                        </h4>
                        <span class="document-id">100877-1-0</span>
                    </div>
                    <div class="document-meta">
                        <span class="case-name">Apple Inc. v. Samsung Electronics Co.</span>
                        <span class="court">CACD</span>
                        <span class="date">2023-03-15</span>
                    </div>
                    <div class="document-details">
                        <span>Doc #1</span>
                        <span>45 pages</span>
                        <span>2.3 MB</span>
                    </div>
                </div>
                
                <div class="document-result-card">
                    <div class="document-header">
                        <h4 class="document-title">
                            Expert Deposition Transcript - Dr. Smith
                        </h4>
                        <span class="document-id">234561-5-0</span>
                    </div>
                    <div class="document-meta">
                        <span class="case-name">Microsoft Corp. v. Google LLC</span>
                        <span class="court">NYSD</span>
                        <span class="date">2023-02-28</span>
                    </div>
                    <div class="document-details">
                        <span>Doc #5</span>
                        <span>156 pages</span>
                        <span>8.7 MB</span>
                    </div>
                </div>
            </div>
            
            <div class="results-pagination">
                <div class="pagination-info">
                    Showing 1-20 of 25
                </div>
                <div class="pagination-controls">
                    <button class="pagination-btn" disabled>⏮</button>
                    <button class="pagination-btn" disabled>◀</button>
                    <span class="pagination-current">Page 1 of 2</span>
                    <button class="pagination-btn">▶</button>
                    <button class="pagination-btn">⏭</button>
                </div>
            </div>
        </div>
    </div>
    
    <div class="component-demo">
        <h2 class="demo-title">3. Navigation Tabs</h2>
        <header class="app-header">
            <h1>Legal Document Browser</h1>
            <nav class="main-navigation">
                <button class="nav-tab">Browse Cases</button>
                <button class="nav-tab active">Search Documents</button>
            </nav>
        </header>
    </div>

    <script>
        // Add basic interactivity for demo purposes
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('keyword-suggestion')) {
                e.target.parentElement.style.display = 'none';
                document.querySelector('.keyword-input').value = e.target.textContent;
            }
            
            if (e.target.classList.contains('document-result-card')) {
                document.querySelectorAll('.document-result-card').forEach(card => {
                    card.classList.remove('selected');
                });
                e.target.classList.add('selected');
            }
            
            if (e.target.classList.contains('nav-tab')) {
                document.querySelectorAll('.nav-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                e.target.classList.add('active');
            }
        });
    </script>
</body>
</html>
```

## Success Criteria

Phase 4 is complete when:

1. ✅ **Component Functionality**: All components render and respond to user interactions
2. ✅ **Redux Integration**: Components properly dispatch actions and read state
3. ✅ **Visual Design**: UI follows consistent design patterns with existing app
4. ✅ **Accessibility**: Components support keyboard navigation and screen readers
5. ✅ **Responsive Design**: Interface works well on mobile and desktop
6. ✅ **Independent Testing**: Components work with mocked Redux state

## Independence Verification

This phase works independently by:

- **Mocked Redux State**: Components receive mock state via test store
- **Visual Testing**: HTML page demonstrates all UI components with static data
- **Unit Tests**: Components tested in isolation with mocked dependencies
- **No Backend Dependencies**: All data comes from Redux store mocks

## Files Created/Modified

- `src/components/DocumentSearch.tsx` (new)
- `src/components/DocumentSearchKeywords.tsx` (new)
- `src/components/DocumentSearchResults.tsx` (new)
- `src/components/Layout.tsx` (enhanced)
- `src/components/DocumentSearch.css` (new)
- `src/components/__tests__/DocumentSearch.test.tsx` (new)
- `src/components/__tests__/DocumentSearch.integration.test.tsx` (new)
- `public/tests/test-document-search-components.html` (new)

## Integration Notes

When integrating all phases:

1. **Phase 1 → Phase 2**: Point data service to generated index files
2. **Phase 2 → Phase 3**: Replace mocked service with real implementation
3. **Phase 3 → Phase 4**: Replace mocked Redux state with real store
4. **Final Integration**: Test complete workflow end-to-end