import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const dataRoot = process.env.USE_SAMPLE_DATA === 'true' ? './sample-data' : './data';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-data-files',
      configureServer(server) {
        server.middlewares.use('/data/docket-data', (req, res, next) => {
          const filePath = path.join(dataRoot, 'docket-data', req.url!);
          const fullPath = path.resolve(filePath);
          
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            res.setHeader('Content-Type', 'application/json');
            fs.createReadStream(fullPath).pipe(res);
          } else {
            res.statusCode = 404;
            res.end('File not found');
          }
        });
        
        server.middlewares.use('/data/sata', (req, res, next) => {
          const filePath = path.join(dataRoot, 'sata', req.url!);
          const fullPath = path.resolve(filePath);
          
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            res.setHeader('Content-Type', 'application/pdf');
            fs.createReadStream(fullPath).pipe(res);
          } else {
            res.statusCode = 404;
            res.end('File not found');
          }
        });
      }
    }
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});
