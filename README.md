# Legal Document Browser

A web application for browsing and searching legal court documents from the RECAP archive. Built with React, TypeScript, Redux Toolkit, and Vite.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build search indices from sample data
npm run build:index:sample

# Start development server
npm run dev:sample
```

Visit http://localhost:3000 to access the application.

## ✨ Features

- **Search 34,418+ legal cases** by case name, court, or docket number
- **Browse documents** within each case with full metadata
- **Open PDFs** directly in your browser
- **Filter by court** using a comprehensive court directory
- **Fast search** with pre-built client-side indices
- **Responsive design** with sidebar navigation

## 🏗️ Architecture

The application follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ React Components│────▶│ Redux Store      │────▶│ Data Service    │
│ (UI Layer)      │     │ (State Mgmt)     │     │ (Data Access)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ PDF Service     │     │ Type Guards      │     │ Index Files     │
│ (PDF Handling)  │     │ (Type Safety)    │     │ (Pre-built)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Core Components

- **Layout** (`src/components/Layout.tsx`) - Main application layout
- **CaseSearch** - Search interface with filtering
- **CaseList** - Displays filtered search results
- **DocumentView** - Shows documents for selected case
- **DocumentList** - Lists all documents with metadata

### Data Flow

1. **Build Time**: Index builder processes JSON files into searchable indices
2. **Load Time**: Data service loads case index into Redux store
3. **Search Time**: User input filters cases client-side
4. **Selection**: Clicking a case loads its documents via data service
5. **Viewing**: Clicking a document opens the PDF in a new tab

## 📁 Project Structure

```
freelaw/
├── src/
│   ├── components/         # React UI components
│   │   ├── App.tsx        # Root application component
│   │   ├── Layout.tsx     # Main layout with sidebar
│   │   ├── CaseSearch.tsx # Search and filter interface
│   │   ├── CaseList.tsx   # Case results list
│   │   ├── DocumentView.tsx # Document viewer for selected case
│   │   └── DocumentList.tsx # Document list with metadata
│   ├── services/           # Data access layer
│   │   ├── dataService.ts  # Loads cases and documents
│   │   ├── pdfService.ts   # Handles PDF file operations
│   │   └── types.ts        # Service type definitions
│   ├── store/              # Redux store and slices
│   │   ├── casesSlice.ts   # Case data and search state
│   │   ├── documentsSlice.ts # Document data state
│   │   ├── uiSlice.ts      # UI state (selections, filters)
│   │   └── index.ts        # Store configuration
│   ├── types/              # TypeScript type definitions
│   │   ├── case.types.ts   # Case and case summary types
│   │   ├── document.types.ts # Document metadata types
│   │   ├── court.types.ts  # Court code mappings
│   │   ├── index.types.ts  # Index file structures
│   │   └── guards.ts       # Runtime type validation
│   ├── constants/
│   │   └── courts.ts       # Federal court code mappings
│   └── hooks/
│       └── redux.ts        # Typed Redux hooks
├── scripts/                # Build and utility scripts
│   ├── buildIndex.ts       # Generates search indices
│   ├── extractCaseSummary.ts # Extracts case metadata
│   └── extractDocuments.ts # Extracts document lists
├── public/
│   └── data/               # Generated index files
│       ├── case-index.json # Main case search index
│       └── documents/      # Individual case document files
├── sample-data/            # Development data (10 cases)
│   ├── docket-data/        # Sample JSON files
│   └── sata/recap/         # Sample PDF files
└── data/                   # Production data (34K+ cases)
    ├── docket-data/        # Full JSON dataset
    └── sata/recap/         # Full PDF collection
```

## 🛠️ Technology Stack

### Core Technologies
- **TypeScript** - Strict mode enabled, no `any` types allowed
- **React 18+** - Functional components with hooks only (no class components)
- **Redux Toolkit** - State management with `createSlice` and `createAsyncThunk`
- **Vite** - Development server with hot module replacement and file serving
- **vite-node** - Run TypeScript scripts without compilation step

### Development Standards
- **Strict TypeScript**: All function parameters and return values must be typed
- **Redux Required**: Use Redux Toolkit for all state management (not Context API)
- **Typed Hooks**: Use `useAppDispatch` and `useAppSelector` from `src/hooks/redux.ts`
- **File Organization**: Components in `.tsx`, utilities in `.ts`, types in dedicated files
- **Type Guards**: Runtime validation with `isRawCaseData()`, `isCaseIndex()`, etc.

### Key Dependencies
- `@reduxjs/toolkit` - State management
- `react-redux` - React-Redux bindings
- `@vitejs/plugin-react` - React support for Vite
- `vitest` - Testing framework
- `eslint` & `prettier` - Code quality tools

## 🛠️ Development

### Available Scripts

```bash
# Development servers
npm run dev              # Start with production data
npm run dev:sample       # Start with sample data (recommended)
npm run dev:sample:debug # Start with debug middleware

# Index building
npm run build:index       # Build from production data
npm run build:index:sample # Build from sample data

# Code quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run typecheck        # TypeScript type checking

# Testing
npm run test             # Run test suite
npm run test:ui          # Run tests with UI

# Production
npm run build            # Build for production
npm run preview          # Preview production build
```

### Type Safety

All components use strict TypeScript with comprehensive type definitions:

```typescript
import type { Case, CaseSummary } from '@/types/case.types';
import type { Document } from '@/types/document.types';
import type { Court } from '@/types/court.types';
```

Runtime type validation ensures data integrity:
- `isRawCaseData()` - Validates incoming JSON structure
- `isCaseIndex()` - Validates index file format
- `isDocumentArray()` - Validates document lists

### State Management

Redux Toolkit with async thunks for data loading:

```typescript
// Load case index on app start
dispatch(loadCaseIndex());

// Load documents for selected case
dispatch(loadDocuments(caseId));

// Search and filter cases
dispatch(setSearchTerm("patent litigation"));
dispatch(setCourtFilter("cacd"));
```

## 📊 Data Structure

The application processes federal court data from the RECAP archive:

### Input Data
- **34,418 JSON files** with case metadata from PACER
- **446,571+ PDF files** containing court documents
- **Federal court coverage** across all districts

### Generated Indices
- **case-index.json** - Searchable case summaries
- **documents/*.json** - Document lists per case
- **Court mappings** - Human-readable court names

### Example Case Structure
```json
{
  "id": 100877,
  "caseName": "Patent Litigation Case",
  "court": "cacd",
  "docketNumber": "2:20-cv-01234",
  "dateFiled": "2020-03-15",
  "documentCount": 45,
  "availableDocumentCount": 23
}
```

## 🔍 Search Features

- **Text search** across case names and docket numbers
- **Court filtering** with dropdown selection
- **Real-time results** with client-side filtering
- **Case selection** loads full document list
- **PDF viewing** opens documents in browser

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers supported

## 📈 Performance

- **Client-side search** for instant results
- **Lazy loading** of document lists
- **Caching** of loaded data
- **Optimized bundle** with Vite

## 🔒 Security

- **Read-only access** to court documents
- **Type validation** on all data inputs
- **No server dependencies** for core functionality
- **Local development** environment

## 🚧 Development Notes

### Working with Sample Data

For development, use the sample dataset (10 cases) instead of the full 34K+ case collection:

```bash
npm run build:index:sample
npm run dev:sample
```

### Adding New Courts

Update `src/constants/courts.ts` with new court code mappings:

```typescript
export const COURT_MAPPINGS: Record<string, string> = {
  'cacd': 'California Central District Court',
  'nysd': 'New York Southern District Court',
  // Add new mappings here
};
```

### Debugging Data Issues

Enable debug middleware to log data loading:

```bash
npm run dev:sample:debug
```

## 📄 Related Documentation

- [DATA_STRUCTURE_OVERVIEW.md](./DATA_STRUCTURE_OVERVIEW.md) - Detailed data format documentation
- [JSON_STRUCTURE_DOCUMENTATION.md](./JSON_STRUCTURE_DOCUMENTATION.md) - JSON schema reference
- [scripts/ANALYSIS_SCRIPTS_DOCUMENTATION.md](./scripts/ANALYSIS_SCRIPTS_DOCUMENTATION.md) - Analysis tools

## 🤝 Contributing

1. Review the type definitions in `src/types/`
2. Follow existing component patterns
3. Run tests before submitting changes
4. Use the sample data for development

## 📜 License

This project processes public court documents from the RECAP archive. See individual file headers for specific licensing terms.

## 🙏 Acknowledgments

Built using data from the [RECAP Archive](https://free.law/recap/) by the Free Law Project, providing free access to federal court documents.