import React from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { selectCase } from '../store/casesSlice';
import { loadDocuments } from '../store/documentsSlice';

export const CaseList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { filteredCases, selectedCaseId, loading } = useAppSelector((state) => state.cases);

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
        {filteredCases.map((caseItem) => (
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
