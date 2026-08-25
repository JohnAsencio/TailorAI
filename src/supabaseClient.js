import { createClient } from "@supabase/supabase-js";

// Configure these in your .env file with VITE_ prefix:
// - VITE_SUPABASE_URL
// - VITE_SUPABASE_ANON_KEY
// 
// IMPORTANT NOTE: The Supabase anon key is SAFE to expose to the client. It's designed
// for client-side use. Security comes from Row Level Security (RLS) policies in Supabase,
// not from hiding the key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate that we have both URL and key, and they're not empty strings
const hasValidConfig = supabaseUrl && supabaseAnonKey && 
  typeof supabaseUrl === 'string' && typeof supabaseAnonKey === 'string' &&
  supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '' &&
  supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined';

// Debug logging (will help identify configuration issues) — dev only, never in production
if (import.meta.env.DEV && typeof window !== 'undefined') {
  if (!hasValidConfig) {
    console.error('⚠️ Supabase configuration missing or invalid:', {
      hasViteUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasViteKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      urlType: typeof supabaseUrl,
      keyType: typeof supabaseAnonKey,
      urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing',
      keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'missing',
    });
    console.error('💡 Tip: Check Vercel environment variables to ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
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


