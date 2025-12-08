import { createClient } from "@supabase/supabase-js";

// Configure these in your .env file (with or without VITE_ prefix):
// The code supports both naming conventions:
// - VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (available at runtime) - RECOMMENDED
// - SUPABASE_URL / SUPABASE_ANON_KEY (injected at build time via vite.config.js)
// 
// IMPORTANT NOTE: The Supabase anon key is SAFE to expose to the client. It's designed
// for client-side use. Security comes from Row Level Security (RLS) policies in Supabase,
// not from hiding the key. The VITE_ prefix doesn't make it "more exposed" - both are
// visible in the browser bundle.

// Try runtime variables first (VITE_ prefix), then build-time injected ones
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || import.meta.env.BUILD_TIME_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || import.meta.env.BUILD_TIME_SUPABASE_ANON_KEY || '';

// Validate that we have both URL and key, and they're not empty strings
const hasValidConfig = supabaseUrl && supabaseAnonKey && 
  typeof supabaseUrl === 'string' && typeof supabaseAnonKey === 'string' &&
  supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '' &&
  supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined';

// Debug logging (will help identify configuration issues)
if (typeof window !== 'undefined') {
  if (!hasValidConfig) {
    console.error('⚠️ Supabase configuration missing or invalid:', {
      hasViteUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasViteKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      hasUrl: !!import.meta.env.SUPABASE_URL,
      hasKey: !!import.meta.env.SUPABASE_ANON_KEY,
      hasBuildUrl: !!import.meta.env.BUILD_TIME_SUPABASE_URL,
      hasBuildKey: !!import.meta.env.BUILD_TIME_SUPABASE_ANON_KEY,
      urlType: typeof supabaseUrl,
      keyType: typeof supabaseAnonKey,
      urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing',
      keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'missing',
    });
    console.error('💡 Tip: Check Vercel build logs to ensure SUPABASE_URL and SUPABASE_ANON_KEY are available during build');
  } else {
    console.log('✅ Supabase client initialized successfully');
    console.log('📍 Supabase URL:', supabaseUrl);
    console.log('🔑 Supabase Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'missing');
    
    // Validate URL format
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      console.warn('⚠️ Warning: Supabase URL may be incorrect. Expected format: https://xxxxx.supabase.co');
    }
  }
}

export const supabase = hasValidConfig
  ? createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return hasValidConfig && supabase !== null;
};


