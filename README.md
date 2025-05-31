# Legal Document Browser

A web application for browsing and searching legal court documents from the RECAP archive. Built with React, TypeScript, Redux Toolkit, and Vite.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build search indices from sample data
npm run build:index:sample
npm run build:document-search:sample

# Start development server
npm run dev:sample
```

Visit http://localhost:3000 to access the application.

## ✨ Features

### Case Browsing
- **Search 34,418+ legal cases** by case name, court, or docket number
- **Browse documents** within each case with full metadata
- **Filter by court** using a comprehensive court directory
- **Open PDFs** directly in your browser

### Document Search (New!)
- **Keyword-based document search** across all documents in the archive
- **Smart keyword suggestions** as you type
- **AND/OR search operators** for precise or broad searches
- **Highlighted search results** showing matched keywords
- **Paginated results** with configurable page sizes
- **Document metadata display** including case name, court, date, and file details

### Performance & Design
- **Fast client-side search** with pre-built indices
- **Lazy-loaded keyword indices** for efficient memory usage
- **Responsive design** with tabbed navigation
- **Keyboard accessible** interface

## 🏗️ Architecture

The application follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ React Components│────▶│ Redux Store      │────▶│ Data Services   │
│ (UI Layer)      │     │ (State Mgmt)     │     │ (Data Access)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Search Services │     │ Type Guards      │     │ Index Files     │
│ (Doc Search)    │     │ (Type Safety)    │     │ (Pre-built)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Core Components

#### Case Browsing
- **Layout** (`src/components/Layout.tsx`) - Main application layout with tabbed navigation
- **CaseSearch** - Search interface with filtering
- **CaseList** - Displays filtered search results
- **DocumentView** - Shows documents for selected case
- **DocumentList** - Lists all documents with metadata

#### Document Search
- **DocumentSearch** - Main search interface container
- **DocumentSearchKeywords** - Keyword input with auto-suggestions
- **DocumentSearchResults** - Paginated results display with highlighting

### Data Flow

#### Case Browsing Flow
1. **Build Time**: Index builder processes JSON files into case index
2. **Load Time**: Data service loads case index into Redux store
3. **Search Time**: User input filters cases client-side
4. **Selection**: Clicking a case loads its documents via data service
5. **Viewing**: Clicking a document opens the PDF in a new tab

#### Document Search Flow
1. **Build Time**: Keyword extractor analyzes document descriptions
2. **Index Time**: Creates inverted index mapping keywords to document IDs
3. **Search Time**: User selects keywords and search operator (AND/OR)
4. **Results**: Lazy-loads matching keyword files and resolves document metadata
5. **Display**: Shows paginated results with keyword highlighting

## 📁 Project Structure

```
freelaw/
├── src/
│   ├── components/         # React UI components
│   │   ├── App.tsx        # Root application component
│   │   ├── Layout.tsx     # Main layout with tabbed navigation
│   │   ├── CaseSearch.tsx # Search and filter interface
│   │   ├── CaseList.tsx   # Case results list
│   │   ├── DocumentView.tsx # Document viewer for selected case
│   │   ├── DocumentList.tsx # Document list with metadata
│   │   ├── DocumentSearch.tsx # Document search container
│   │   ├── DocumentSearchKeywords.tsx # Keyword input component
│   │   ├── DocumentSearchResults.tsx # Search results display
│   │   └── DocumentSearch.css # Document search styles
│   ├── services/           # Data access layer
│   │   ├── dataService.ts  # Loads cases and documents
│   │   ├── documentSearchService.ts # Document search functionality
│   │   ├── pdfService.ts   # Handles PDF file operations
│   │   └── types.ts        # Service type definitions
│   ├── store/              # Redux store and slices
│   │   ├── casesSlice.ts   # Case data and search state
│   │   ├── documentsSlice.ts # Document data state
│   │   ├── documentSearchSlice.ts # Document search state
│   │   ├── uiSlice.ts      # UI state (selections, filters)
│   │   └── createAppStore.ts # Store configuration
│   ├── types/              # TypeScript type definitions
│   │   ├── case.types.ts   # Case and case summary types
│   │   ├── document.types.ts # Document metadata and search types
│   │   ├── court.types.ts  # Court code mappings
│   │   ├── index.types.ts  # Index file structures
│   │   └── guards.ts       # Runtime type validation
│   ├── constants/
│   │   └── courts.ts       # Federal court code mappings
│   └── hooks/
│       └── redux.ts        # Typed Redux hooks
├── scripts/                # Build and utility scripts
│   ├── buildIndex.ts       # Generates case search indices
│   ├── buildDocumentSearchIndex.ts # Generates document search indices
│   ├── extractCaseSummary.ts # Extracts case metadata
│   ├── extractDocuments.ts # Extracts document lists
│   └── extractKeywords.ts  # Extracts searchable keywords
├── public/
│   └── data/               # Generated index files
│       ├── case-index.json # Main case search index
│       ├── documents/      # Individual case document files
│       └── document-search/ # Document search indices
│           ├── keywords.json # Master keyword list
│           └── keywords/    # Individual keyword index files
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
npm run build:index       # Build case index from production data
npm run build:index:sample # Build case index from sample data
npm run build:document-search # Build document search index from production data
npm run build:document-search:sample # Build document search index from sample data
npm run build:index:full  # Build both indices for production

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
- **case-index.json** - Searchable case summaries (~5MB)
- **documents/*.json** - Document lists per case (34K+ files)
- **document-search/keywords.json** - Master keyword list
- **document-search/keywords/*.json** - Inverted index files (one per keyword)
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

### Case Search
- **Text search** across case names and docket numbers
- **Court filtering** with dropdown selection
- **Real-time results** with client-side filtering
- **Case selection** loads full document list
- **PDF viewing** opens documents in browser

### Document Search
- **Keyword-based search** across all document descriptions
- **Auto-complete suggestions** from extracted keywords
- **Boolean operators** (AND/OR) for complex queries
- **Result highlighting** shows matched keywords
- **Pagination controls** for managing large result sets
- **Metadata display** for each found document
- **Direct PDF access** from search results

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
# Build both search indices from sample data
npm run build:index:sample
npm run build:document-search:sample

# Start development server
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

### Document Search Implementation

The document search feature uses an inverted index for efficient keyword-based searching:

1. **Keyword Extraction**: Analyzes document descriptions to extract meaningful terms
2. **Index Structure**: Creates individual JSON files for each keyword
3. **Lazy Loading**: Only loads keyword files when searched
4. **Memory Efficient**: Caches recently searched keywords
5. **Search Operators**: Supports AND (intersection) and OR (union) operations

Example keyword index structure:
```json
// public/data/document-search/keywords.json
{
  "keywords": ["motion", "deposition", "order", "summary", "judgment"]
}

// public/data/document-search/keywords/motion.json
{
  "keyword": "motion",
  "documentIds": ["100877-1-0", "234561-5-0", "789012-3-0"]
}
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