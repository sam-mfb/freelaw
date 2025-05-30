import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Placeholder App component - Phase 6 will implement the full component
function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Legal Document Browser</h1>
      <p>This application is being developed in 6 phases:</p>
      <ul>
        <li>Phase 1: Index Builder (scripts/buildIndex.ts)</li>
        <li>Phase 2: Vite Configuration (vite.config.ts)</li>
        <li>Phase 3: Data Service (services/dataService.ts)</li>
        <li>Phase 4: PDF Service (services/pdfService.ts)</li>
        <li>Phase 5: Redux Store (store/)</li>
        <li>Phase 6: React Components (components/)</li>
      </ul>
      <p>
        Each phase can be developed independently. Check the planning/ directory for instructions.
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
