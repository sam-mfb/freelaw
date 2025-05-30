# Legal Document Browser - Development Instructions

## Overview

This directory contains the planning documentation for building a Legal Document Browser application. The project is divided into 6 independent phases that can be developed in parallel.

## For Developers

To implement a specific phase:

1. **Read the general documentation files** (in order):

   - `01-project-overview.md` - Project goals and architecture
   - `02-data-structure.md` - Understanding the data format
   - `03-tech-stack.md` - Technology choices and setup

2. **Read your specific phase document**:

   - `phase-1-index-builder.md` - Data preprocessing scripts
   - `phase-2-vite-config.md` - Development server setup
   - `phase-3-data-service.md` - Data loading services
   - `phase-4-pdf-service.md` - PDF file serving
   - `phase-5-redux-store.md` - State management
   - `phase-6-react-components.md` - UI components

3. **Development workflow**:
   - Each phase has its own test procedures
   - Use the `sample-data/` directory for development
   - Your phase should work independently with mocks
   - Commit your code to a feature branch named `phase-X-description`

## Phase Dependencies

While phases must be developed in parallel, here are the integration points:

- **Phase 1** produces index files that Phases 3-6 consume
- **Phase 2** provides the server that all other phases run on
- **Phase 3** provides data that Phases 5-6 use
- **Phase 4** is standalone but used by Phase 6
- **Phase 5** provides state management for Phase 6
- **Phase 6** integrates all other phases

## Testing Your Phase

Each phase document includes:

- Standalone test procedures
- Mock data/interfaces for dependencies
- Success criteria

You must be able to demonstrate your phase working in isolation before integration.

## File Structure

```
planning/
├── INSTRUCTIONS.md          # This file
├── 01-project-overview.md   # Project goals, architecture
├── 02-data-structure.md     # JSON/PDF structure documentation
├── 03-tech-stack.md         # TypeScript, React, Redux setup
├── phase-1-index-builder.md # Index builder implementation
├── phase-2-vite-config.md   # Vite server configuration
├── phase-3-data-service.md  # Data service implementation
├── phase-4-pdf-service.md   # PDF serving implementation
├── phase-5-redux-store.md   # Redux store implementation
└── phase-6-react-components.md # React components

sample-data/                 # Test data for development
├── docket-data/            # 10 sample JSON files
└── sata/recap/             # Sample PDF files
```

## Quick Start Example

To implement Phase 4 (PDF Service):

```bash
# 1. Read the general docs
cat planning/01-project-overview.md
cat planning/02-data-structure.md
cat planning/03-tech-stack.md

# 2. Read your phase doc
cat planning/phase-4-pdf-service.md

# 3. Implement and test
# (Follow instructions in phase-4-pdf-service.md)
```

