// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Get environment variables (with or without VITE_ prefix)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  return {
    plugins: [react()],
    // Expose environment variables to client-side code
    // This allows using SUPABASE_URL and SUPABASE_ANON_KEY without VITE_ prefix
    define: {
      'import.meta.env.SUPABASE_URL': JSON.stringify(supabaseUrl || ''),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey || ''),
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
