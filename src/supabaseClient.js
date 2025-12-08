import { createClient } from "@supabase/supabase-js";

// Configure these in your .env file (with or without VITE_ prefix):
// The code supports both naming conventions:
// - VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (available at runtime)
// - SUPABASE_URL / SUPABASE_ANON_KEY (injected at build time via vite.config.js)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

// Validate that we have both URL and key, and they're not empty strings
const hasValidConfig = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '';

// Debug logging (will help identify configuration issues)
if (!hasValidConfig && typeof window !== 'undefined') {
  console.error('Supabase configuration missing or invalid:', {
    hasViteUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasViteKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    hasUrl: !!import.meta.env.SUPABASE_URL,
    hasKey: !!import.meta.env.SUPABASE_ANON_KEY,
    urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing',
    keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'missing',
  });
}

export const supabase = hasValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;


