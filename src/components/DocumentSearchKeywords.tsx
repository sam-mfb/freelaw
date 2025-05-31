import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
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

export const DocumentSearchKeywords: React.FC<DocumentSearchKeywordsProps> = ({
  onSearch,
  loading = false,
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
      const filtered = keywordSuggestions.filter((keyword) =>
        keyword.toLowerCase().includes(inputValue.toLowerCase()),
      );
      setFilteredSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue, keywordSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleAddKeyword = (keyword: string): void => {
    const trimmed = keyword.trim().toLowerCase();
    if (trimmed && availableKeywords.includes(trimmed)) {
      dispatch(addSearchKeyword(trimmed));
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveKeyword = (keyword: string): void => {
    dispatch(removeSearchKeyword(keyword));
  };

  const handleOperatorChange = (newOperator: 'AND' | 'OR'): void => {
    dispatch(setSearchOperator(newOperator));
  };

  const handleSearch = (): void => {
    onSearch(keywords, operator);
  };

  const handleSuggestionClick = (suggestion: string): void => {
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
              {filteredSuggestions.map((suggestion) => (
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
            {keywords.map((keyword) => (
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
            {['motion', 'deposition', 'order', 'summary', 'judgment', 'brief'].map(
              (keyword) =>
                availableKeywords.includes(keyword) && (
                  <button
                    key={keyword}
                    onClick={() => handleAddKeyword(keyword)}
                    className="common-keyword"
                    disabled={loading}
                  >
                    {keyword}
                  </button>
                ),
            )}
          </div>
        </div>
      )}
    </div>
  );
};
