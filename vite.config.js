// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy API requests to Vercel dev server (when running) or production
        '/api': {
          target: process.env.VERCEL_DEV_URL || 'http://localhost:3000',
          changeOrigin: true,
          // Don't rewrite the path - keep /api in the request
        }
      }
    },
    optimizeDeps: {
      include: ['pdfjs-dist/build/pdf.worker.entry'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            pdfjs: ['pdfjs-dist']
          }
        }
      }
    }
  };
});
