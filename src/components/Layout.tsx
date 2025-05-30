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