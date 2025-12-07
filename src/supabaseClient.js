import { createClient } from "@supabase/supabase-js";

// Configure these in your .env file (with or without VITE_ prefix):
// The code supports both naming conventions:
// - VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (available at runtime)
// - SUPABASE_URL / SUPABASE_ANON_KEY (injected at build time via vite.config.js)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;


