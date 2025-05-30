import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const dataRoot = process.env.USE_SAMPLE_DATA === 'true' ? './sample-data' : './data';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    host: '0.0.0.0',
    fs: {
      // Allow serving files outside of project root
      allow: ['..'],
    },
    proxy: {
      // Proxy requests for original docket JSON files
      '/data/docket-data': {
        target: `file://${path.resolve(__dirname, dataRoot, 'docket-data')}`,
        rewrite: (path) => path.replace('/data/docket-data', ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
          });
        },
      },
      // Proxy requests for PDF files
      '/data/sata': {
        target: `file://${path.resolve(__dirname, dataRoot, 'sata')}`,
        rewrite: (path) => path.replace('/data/sata', ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
          });
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['content-type'] = 'application/pdf';
          });
        },
      },
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
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
