import React from 'react';
import { useState } from 'react';
import { useAppSelector } from '../hooks/redux';
import { CaseSearch } from './CaseSearch';
import { CaseList } from './CaseList';
import { DocumentView } from './DocumentView';
import { DocumentSearch } from './DocumentSearch';

export const Layout: React.FC = () => {
  const { selectedCaseId } = useAppSelector((state) => state.cases);
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

      <div className="app-body">
        {activeTab === 'cases' && (
          <>
            <aside className="sidebar">
              <CaseSearch />
              <CaseList />
            </aside>

            <main className="main-content">
              {selectedCaseId ? (
                <DocumentView caseId={selectedCaseId} />
              ) : (
                <div className="no-selection">Select a case to view documents</div>
              )}
            </main>
          </>
        )}

        {activeTab === 'documents' && (
          <main className="main-content document-search-view">
            <DocumentSearch />
          </main>
        )}
      </div>
    </div>
  );
};
