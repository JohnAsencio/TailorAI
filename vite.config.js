// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Get environment variables (with or without VITE_ prefix)
  // Priority: VITE_ prefix first (runtime), then non-prefixed (build-time)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  // Log for debugging during build (only in non-production or when variables are missing)
  if (mode !== 'production' || !supabaseUrl || !supabaseAnonKey) {
    console.log('[Vite Config] Supabase env vars:', {
      hasViteUrl: !!process.env.VITE_SUPABASE_URL,
      hasViteKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      hasBuildUrl: !!process.env.SUPABASE_URL,
      hasBuildKey: !!process.env.SUPABASE_ANON_KEY,
      finalUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
      finalKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'MISSING',
    });
  }

  return {
    plugins: [react()],
    // Expose environment variables to client-side code
    // This allows using SUPABASE_URL and SUPABASE_ANON_KEY without VITE_ prefix
    // Note: These are injected at build time, so they must be available during Vercel build
    define: {
      'import.meta.env.SUPABASE_URL': JSON.stringify(supabaseUrl || ''),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey || ''),
      // Also define them with explicit build-time check
      'import.meta.env.BUILD_TIME_SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
      'import.meta.env.BUILD_TIME_SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || ''),
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
