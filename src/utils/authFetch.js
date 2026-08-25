import { supabase } from '../supabaseClient';

/**
 * fetch() wrapper that attaches the current Supabase session's access token
 * as a Bearer Authorization header. Use this for any /api/* call the server
 * verifies against a real session (i.e. anything that used to trust a
 * client-supplied userId).
 */
export async function authFetch(url, options = {}) {
  let token = null;
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token || null;
    } catch {
      token = null;
    }
  }

  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return fetch(url, { ...options, headers });
}
