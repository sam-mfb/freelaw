import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const dataRoot = process.env.USE_SAMPLE_DATA === 'true' ? './sample-data' : './data';
const debugMiddleware = process.env.DEBUG_MIDDLEWARE === 'true';

// Plugin to handle data directory routing for both dev and build
const dataRoutingPlugin = () => {
  const useSampleData = process.env.USE_SAMPLE_DATA === 'true';
  const indexDir = useSampleData ? 'sample-data' : 'data';
  
  return {
    name: 'vite-data-routing-plugin',
    
    // For development server
    configureServer(server) {
      // Serve index files (case-index.json, documents/, document-search/)
      server.middlewares.use((req, res, next) => {
        // Only handle requests that start with /data/ but not /data/docket-data or /data/sata
        if (!req.url?.startsWith('/data/') || 
            req.url?.startsWith('/data/docket-data') || 
            req.url?.startsWith('/data/sata')) {
          return next();
        }
        
        // Remove /data/ prefix to get the actual file path
        const urlPath = req.url.substring(6); // Remove '/data/'
        const filePath = path.join('./public', indexDir, urlPath);
        const fullPath = path.resolve(filePath);
        
        if (debugMiddleware) {
          console.log(`[Index Middleware] Request for: ${req.url}`);
          console.log(`[Index Middleware] URL path: ${urlPath}`);
          console.log(`[Index Middleware] Looking at: ${fullPath}`);
        }
        
        fs.promises.access(fullPath)
          .then(() => fs.promises.stat(fullPath))
          .then(stats => {
            if (stats.isFile()) {
              res.setHeader('Content-Type', 'application/json');
              fs.createReadStream(fullPath).pipe(res);
            } else {
              res.statusCode = 404;
              res.end('File not found');
            }
          })
          .catch(() => {
            res.statusCode = 404;
            res.end('File not found');
          });
      });
      
      // Serve raw docket data files
      server.middlewares.use('/data/docket-data', async (req, res, next) => {
        const filePath = path.join(dataRoot, 'docket-data', req.url!);
        const fullPath = path.resolve(filePath);
        
        try {
          await fs.promises.access(fullPath);
          const stats = await fs.promises.stat(fullPath);
          
          if (stats.isFile()) {
            res.setHeader('Content-Type', 'application/json');
            fs.createReadStream(fullPath).pipe(res);
          } else {
            res.statusCode = 404;
            res.end('File not found');
          }
        } catch {
          res.statusCode = 404;
          res.end('File not found');
        }
      });
      
      // Handle PDF requests - "sata" refers to the SATA storage system used by RECAP archive
      server.middlewares.use('/data/sata', async (req, res, next) => {
        if (debugMiddleware) {
          console.log(`[PDF Middleware] Request for: ${req.url}`);
          console.log(`[PDF Middleware] Using dataRoot: ${dataRoot}`);
        }
        
        const filePath = path.join(dataRoot, 'sata', req.url!);
        const fullPath = path.resolve(filePath);
        
        if (debugMiddleware) {
          console.log(`[PDF Middleware] Looking for file at: ${fullPath}`);
        }
        
        try {
          await fs.promises.access(fullPath);
          const stats = await fs.promises.stat(fullPath);
          
          if (stats.isFile()) {
            if (debugMiddleware) {
              console.log(`[PDF Middleware] Serving PDF: ${fullPath}`);
            }
            res.setHeader('Content-Type', 'application/pdf');
            fs.createReadStream(fullPath).pipe(res);
          } else {
            if (debugMiddleware) {
              console.log(`[PDF Middleware] Path is not a file: ${fullPath}`);
            }
            res.statusCode = 404;
            res.end('File not found');
          }
        } catch (error) {
          if (debugMiddleware) {
            console.log(`[PDF Middleware] File not found: ${fullPath}`, error);
          }
          res.statusCode = 404;
          res.end('File not found');
        }
      });
    },
    
    // For production build
    async buildStart() {
      if (process.env.NODE_ENV === 'production') {
        console.log(`Build mode: Using ${useSampleData ? 'sample' : 'production'} data`);
      }
    },
    
    // Transform index.html to inject correct data path for production
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === 'production') {
        // Inject a script that sets the data directory for production
        const script = `<script>window.__USE_SAMPLE_DATA__ = ${useSampleData};</script>`;
        return html.replace('</head>', `${script}\n</head>`);
      }
      return html;
    }
  };
};

export default defineConfig({
  publicDir: 'public',
  plugins: [
    react(),
    dataRoutingPlugin(),
  ],

  server: {
    port: 3000,
    host: '0.0.0.0',
    fs: {
      // Allow serving files outside of project root
      allow: ['..'],
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, dataRoot),
      '@types': path.resolve(__dirname, './src/types'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});