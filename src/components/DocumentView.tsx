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
      
      <DocumentList />
    </div>
  );
};