# Phase 2: Vite Configuration

## Objective

Set up Vite development server to properly serve the React application, JSON data files, and PDF documents from their respective directories.

## Requirements

1. Serve React application on `http://localhost:5173`
2. Serve JSON index files from `public/data/`
3. Serve original JSON files from `data/docket-data/` (or `sample-data/`)
4. Serve PDF files from `data/sata/recap/` (or `sample-data/sata/recap/`)
5. Enable CORS for all file types
6. Support hot module replacement for React

## Implementation

### File: `vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  server: {
    fs: {
      // Allow serving files outside of project root
      allow: [".."],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@data": path.resolve(__dirname, "./data"),
    },
  },
});
```

### File Structure Expected

```
project-root/
├── src/                    # React application
├── public/
│   └── data/              # Index files from Phase 1
│       ├── case-index.json
│       └── documents/
├── data/                  # Production data
│   ├── docket-data/
│   └── sata/recap/
├── sample-data/           # Development data
│   ├── docket-data/
│   └── sata/recap/
└── vite.config.ts
```

## URL Mapping

The server should handle these URL patterns:

- `/` → React app
- `/data/case-index.json` → `public/data/case-index.json`
- `/data/documents/[id].json` → `public/data/documents/[id].json`
- `/data/docket-data/[id].json` → Full JSON from source
- `/data/sata/recap/[court]/[file].pdf` → PDF files

## Development vs Production Data

Use environment variable to switch data sources:

```typescript
// In vite.config.ts or separate config
const dataRoot =
  process.env.USE_SAMPLE_DATA === "true" ? "./sample-data" : "./data";
```

## Testing

### Manual Test Procedure

1. Create `test-vite-setup.html` in public directory:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Vite Config Test</title>
  </head>
  <body>
    <h2>Vite Configuration Test</h2>
    <div id="test-results"></div>

    <script type="module">
      const tests = [
        {
          url: "/data/case-index.json",
          desc: "Index from public/data",
          check: async (r) => r.ok && (await r.json()).cases,
        },
        {
          url: "/data/documents/14560346.json",
          desc: "Document index",
          check: async (r) => r.ok && Array.isArray(await r.json()),
        },
        {
          url: "/data/docket-data/14560346.json",
          desc: "Original JSON",
          check: async (r) => r.ok && (await r.json()).id === 14560346,
        },
        {
          url: "/data/sata/recap/gov.uscourts.kyed.88372/gov.uscourts.kyed.88372.1.0.pdf",
          desc: "PDF file",
          check: async (r) =>
            r.ok && r.headers.get("content-type").includes("pdf"),
        },
      ];

      const results = document.getElementById("test-results");

      for (const test of tests) {
        try {
          const response = await fetch(test.url);
          const passed = await test.check(response);
          const status = passed ? "✅" : "❌";
          results.innerHTML += `<p>${status} ${test.desc}: ${response.status}</p>`;
        } catch (e) {
          results.innerHTML += `<p>❌ ${test.desc}: ${e.message}</p>`;
        }
      }
    </script>
  </body>
</html>
```

2. Start server: `npm run dev`
3. Navigate to `http://localhost:3000/test-vite-setup.html`
4. All tests should show ✅

## Success Criteria

- [ ] React app loads at localhost:3000
- [ ] Can fetch case-index.json from /data/
- [ ] Can fetch document JSON files from /data/documents/
- [ ] Can fetch original JSON files from /data/docket-data/
- [ ] Can load PDF files in browser
- [ ] Hot reload works for React components
- [ ] No CORS errors in console

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "dev:sample": "USE_SAMPLE_DATA=true vite --host 0.0.0.0 --port 3000"
  }
}
```

## Notes for Integration

- This phase provides the foundation all other phases run on
- The URL structure defined here is used by Phases 3, 4, and 6
- Make sure to test with both sample-data and full data directories
- Consider adding proxy configuration if needed for API calls

