import React from 'react';
import { useAppSelector } from '../hooks/redux';
import { createPDFService } from '../services/pdfService';

interface DocumentListProps {
  caseId: number;
}

export const DocumentList: React.FC<DocumentListProps> = () => {
  const { currentDocuments, loading } = useAppSelector(state => state.documents);
  const { documentListView } = useAppSelector(state => state.ui);
  
  const pdfService = createPDFService();
  
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