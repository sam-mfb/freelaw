# Legal Document Browser - Project Overview

## Project Goal

Build a web application that allows easy navigation of legal documents (PDFs) using metadata from JSON files. Users can search cases by name, browse documents within cases, and open PDFs in their browser.

## Key Features

1. **Case Search**: Search 34,418 legal cases by name, court, or date
2. **Document Listing**: View all documents for a selected case with descriptions
3. **PDF Viewing**: Click to open any available PDF in a new browser tab
4. **Filtering**: Filter by court, date range, or case status

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  React UI       │────▶│  Redux Store     │────▶│  Data Service   │
│  (Phase 6)      │     │  (Phase 5)       │     │  (Phase 3)      │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                           │
                                                           ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  PDF Service    │     │  Vite Dev Server │────▶│  Index Files    │
│  (Phase 4)      │     │  (Phase 2)       │     │  (Phase 1)      │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Data Flow

1. **Build Time**: Phase 1 processes 34K JSON files into searchable indices
2. **Load Time**: Phase 3 loads case index into Redux store (Phase 5)
3. **Search Time**: User input filters cases in Redux store
4. **Select Time**: Selecting a case loads its documents via Phase 3
5. **View Time**: Clicking a document uses Phase 4 to open the PDF

## Technology Stack

- **TypeScript**: Strict typing throughout
- **React**: UI components
- **Redux Toolkit**: State management
- **Vite**: Development server and build tool
- **No production backend**: Runs entirely in development mode

## Development Approach

The project is split into 6 independent phases that can be developed in parallel:

1. **Index Builder**: Preprocesses JSON data for fast searching
2. **Vite Config**: Sets up development server with proper file serving
3. **Data Service**: Loads and manages case/document data
4. **PDF Service**: Handles PDF file opening
5. **Redux Store**: Manages application state
6. **React Components**: User interface

Each phase has mock interfaces allowing independent development and testing.