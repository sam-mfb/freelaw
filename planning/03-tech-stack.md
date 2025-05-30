# Technology Stack & Setup

## Core Technologies

### TypeScript (Strict Mode)

- All code must be written in TypeScript with strict mode enabled
- No `any` types allowed - use proper interfaces
- Type all function parameters and return values

### React 19+

- Functional components only (no class components)
- Use hooks for state and effects
- Components should be in `.tsx` files
- Use useEffects only for idiomatic patterns

### Redux Toolkit

- **Required** for state management (not Context API or other solutions)
- Use `createSlice` for reducers
- Use `createAsyncThunk` for async operations
- Typed hooks: `useAppDispatch` and `useAppSelector`

### Vite

- Development server only (no production build needed)
- Handles file serving for JSONs and PDFs
- Hot module replacement for React

## Node

- Use `node-vite` for running typescript node scripts

## Project Structure

```
src/
├── store/
│   ├── index.ts              # Store configuration
│   ├── casesSlice.ts         # Case-related state
│   ├── documentsSlice.ts     # Document state
│   └── uiSlice.ts            # UI state
├── components/
│   └── [ComponentName].tsx   # React components
├── services/
│   ├── dataService.ts        # Data fetching
│   └── pdfService.ts         # PDF handling
├── hooks/
│   └── [hookName].ts         # Custom hooks
├── types/
│   └── [type].types.ts       # TypeScript interfaces
└── utils/
    └── [utility].ts          # Helper functions

public/
└── data/                     # Generated index files
    ├── case-index.json
    └── documents/
        └── [caseId].json

scripts/
└── buildIndex.ts             # Preprocessing script
```

## Type Definitions

All shared types should be defined in the `types/` directory:

```typescript
// types/case.types.ts
export interface Case {
  id: number;
  caseName: string;
  caseNameShort: string;
  court: string;
  dateFiled: string;
  dateTerminated: string | null;
  // ... etc
}

// types/document.types.ts
export interface Document {
  id: number;
  entryNumber: number;
  description: string;
  filePath: string | null;
  isAvailable: boolean;
  // ... etc
}
```

## Development Setup

```bash
# Install dependencies
npm install

# Build indices from sample data
npm run build:index:sample

# Start development server
npm run dev
```

## Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
```

## Redux Setup

```typescript
// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import casesReducer from "./casesSlice";
import documentsReducer from "./documentsSlice";
import uiReducer from "./uiSlice";

export const store = configureStore({
  reducer: {
    cases: casesReducer,
    documents: documentsReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Vite Configuration

The Vite config must allow serving files from the data directories:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    fs: {
      allow: [".."], // Allow serving outside project root
    },
  },
});
```

