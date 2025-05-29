# Phase 6: React Components

## Objective

Build the React UI components that integrate with Redux store and services to create the complete user interface.

## Component Hierarchy

```
App.tsx
├── Layout.tsx
│   ├── Header.tsx
│   └── Sidebar.tsx (collapsible)
├── CaseSearch.tsx
├── CaseList.tsx
│   └── CaseCard.tsx
└── DocumentView.tsx
    ├── DocumentList.tsx
    └── DocumentCard.tsx
```

## Core Components

### App.tsx
```typescript
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { Layout } from './components/Layout';
import { useAppDispatch } from './hooks/redux';
import { loadCaseIndex } from './store/casesSlice';

function AppContent() {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    // Load case index on app start
    dispatch(loadCaseIndex());
  }, [dispatch]);
  
  return <Layout />;
}

export function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
```

### Layout.tsx
```typescript
import React from 'react';
import { useAppSelector } from '../hooks/redux';
import { CaseSearch } from './CaseSearch';
import { CaseList } from './CaseList';
import { DocumentView } from './DocumentView';

export const Layout: React.FC = () => {
  const { sidebarOpen } = useAppSelector(state => state.ui);
  const { selectedCaseId } = useAppSelector(state => state.cases);
  
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>Legal Document Browser</h1>
      </header>
      
      <div className="app-body">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <CaseSearch />
          <CaseList />
        </aside>
        
        <main className="main-content">
          {selectedCaseId ? (
            <DocumentView caseId={selectedCaseId} />
          ) : (
            <div className="no-selection">
              Select a case to view documents
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
```

### CaseSearch.tsx
```typescript
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { 
  setSearchTerm, 
  setCourtFilter, 
  setDateFilter,
  setOnlyActive,
  clearFilters 
} from '../store/casesSlice';

export const CaseSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const { searchTerm, filters, index } = useAppSelector(state => state.cases);
  const [dateFrom, setDateFrom] = useState(filters.dateFrom || '');
  const [dateTo, setDateTo] = useState(filters.dateTo || '');
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchTerm(e.target.value));
  };
  
  const handleCourtChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setCourtFilter(e.target.value || null));
  };
  
  const handleDateChange = () => {
    dispatch(setDateFilter({ from: dateFrom, to: dateTo }));
  };
  
  return (
    <div className="case-search">
      <h2>Search Cases</h2>
      
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search by case name..."
        className="search-input"
      />
      
      <select 
        value={filters.court || ''} 
        onChange={handleCourtChange}
        className="court-filter"
      >
        <option value="">All Courts</option>
        {index?.courts.map(court => (
          <option key={court.code} value={court.code}>
            {court.name}
          </option>
        ))}
      </select>
      
      <div className="date-filters">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          onBlur={handleDateChange}
          placeholder="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          onBlur={handleDateChange}
          placeholder="To date"
        />
      </div>
      
      <label className="checkbox">
        <input
          type="checkbox"
          checked={filters.onlyActive}
          onChange={(e) => dispatch(setOnlyActive(e.target.checked))}
        />
        Active cases only
      </label>
      
      <button onClick={() => dispatch(clearFilters())}>
        Clear Filters
      </button>
    </div>
  );
};
```

### CaseList.tsx
```typescript
import React from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { selectCase } from '../store/casesSlice';
import { loadDocuments } from '../store/documentsSlice';

export const CaseList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { filteredCases, selectedCaseId, loading } = useAppSelector(state => state.cases);
  
  const handleCaseClick = (caseId: number) => {
    dispatch(selectCase(caseId));
    dispatch(loadDocuments(caseId));
  };
  
  if (loading) {
    return <div className="loading">Loading cases...</div>;
  }
  
  return (
    <div className="case-list">
      <h3>Cases ({filteredCases.length})</h3>
      
      <div className="case-items">
        {filteredCases.map(caseItem => (
          <div
            key={caseItem.id}
            className={`case-card ${caseItem.id === selectedCaseId ? 'selected' : ''}`}
            onClick={() => handleCaseClick(caseItem.id)}
          >
            <h4>{caseItem.nameShort || caseItem.name}</h4>
            <div className="case-meta">
              <span>{caseItem.court}</span>
              <span>Filed: {caseItem.filed}</span>
              <span>{caseItem.availCount} documents</span>
            </div>
            {!caseItem.terminated && <span className="badge">Active</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### DocumentView.tsx
```typescript
import React from 'react';
import { useAppSelector } from '../hooks/redux';
import { DocumentList } from './DocumentList';

interface DocumentViewProps {
  caseId: number;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ caseId }) => {
  const selectedCase = useAppSelector(state => 
    state.cases.filteredCases.find(c => c.id === caseId)
  );
  
  if (!selectedCase) {
    return <div>Case not found</div>;
  }
  
  return (
    <div className="document-view">
      <header className="case-header">
        <h2>{selectedCase.name}</h2>
        <div className="case-details">
          <span>Court: {selectedCase.court}</span>
          <span>Filed: {selectedCase.filed}</span>
          {selectedCase.terminated && (
            <span>Closed: {selectedCase.terminated}</span>
          )}
        </div>
      </header>
      
      <DocumentList caseId={caseId} />
    </div>
  );
};
```

### DocumentList.tsx
```typescript
import React from 'react';
import { useAppSelector } from '../hooks/redux';
import { pdfService } from '../services/pdfService';

interface DocumentListProps {
  caseId: number;
}

export const DocumentList: React.FC<DocumentListProps> = ({ caseId }) => {
  const { currentDocuments, loading } = useAppSelector(state => state.documents);
  const { documentListView } = useAppSelector(state => state.ui);
  
  const handleOpenPDF = (filePath: string) => {
    pdfService.openPDF(filePath);
  };
  
  if (loading) {
    return <div>Loading documents...</div>;
  }
  
  return (
    <div className={`document-list ${documentListView}`}>
      <h3>Documents ({currentDocuments.length})</h3>
      
      {currentDocuments.map(doc => (
        <div key={doc.id} className="document-card">
          <div className="doc-header">
            <span className="doc-number">#{doc.entryNumber}</span>
            <span className="doc-date">{doc.dateFiled}</span>
          </div>
          
          <p className="doc-description">{doc.description}</p>
          
          <div className="doc-meta">
            {doc.pageCount && <span>{doc.pageCount} pages</span>}
            {doc.fileSize && <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>}
          </div>
          
          {doc.filePath && (
            <button 
              className="view-pdf-btn"
              onClick={() => handleOpenPDF(doc.filePath!)}
            >
              View PDF
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

## Basic Styles (App.css)

```css
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  background: #1a365d;
  color: white;
  padding: 1rem;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  background: #f7fafc;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  padding: 1rem;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.case-card {
  padding: 1rem;
  margin: 0.5rem 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
}

.case-card.selected {
  border-color: #3182ce;
  background: #ebf8ff;
}

.document-card {
  padding: 1rem;
  margin: 1rem 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.view-pdf-btn {
  background: #3182ce;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

## Testing

### Component Test Example
```typescript
// components/CaseSearch.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CaseSearch } from './CaseSearch';
import casesReducer from '../store/casesSlice';

const mockStore = configureStore({
  reducer: { cases: casesReducer },
  preloadedState: {
    cases: {
      searchTerm: '',
      filters: { court: null, dateFrom: null, dateTo: null, onlyActive: false },
      index: {
        cases: [],
        courts: [{ code: 'test', name: 'Test Court' }],
        dateRange: { min: '2020-01-01', max: '2023-12-31' }
      },
      filteredCases: [],
      selectedCaseId: null,
      loading: false,
      error: null
    }
  }
});

test('CaseSearch renders and updates search', () => {
  render(
    <Provider store={mockStore}>
      <CaseSearch />
    </Provider>
  );
  
  const searchInput = screen.getByPlaceholderText('Search by case name...');
  fireEvent.change(searchInput, { target: { value: 'test' } });
  
  expect(mockStore.getState().cases.searchTerm).toBe('test');
});
```

## Success Criteria

- [ ] App loads and displays case list
- [ ] Search filters cases in real-time
- [ ] Court filter works correctly
- [ ] Clicking a case loads its documents
- [ ] PDF buttons open PDFs in new tabs
- [ ] UI is responsive and accessible
- [ ] No TypeScript errors

## Notes for Integration

- Assumes all other phases are complete or mocked
- Uses mock data if services aren't ready
- Can be developed with static HTML first
- Consider adding loading states and error handling
- Add CSS framework (Tailwind, MUI) as needed