import { supabase, getCachedAccessToken } from '../supabaseClient';

// supabase-js serializes getSession() calls behind an internal lock with no
// timeout: if several components each call it concurrently (very common
// right after a page navigation, when multiple things mount and fetch data
// at once), and anything upstream stalls, every queued call can hang forever
// with no way out. Two defenses: (1) prefer the access token already cached
// from onAuthStateChange events (no lock involved) over calling getSession()
// at all, and (2) if we do need to fall back to getSession() (e.g. nothing
// cached yet on a very first load), never let it block forever — share one
// in-flight attempt across concurrent callers and give up after a few
// seconds, proceeding without a token (the server correctly returns 401,
// a visible, recoverable failure instead of the UI hanging indefinitely).
let inFlightSessionPromise = null;

function getSessionOnce() {
  if (!inFlightSessionPromise) {
    inFlightSessionPromise = supabase.auth
      .getSession()
      .catch(() => ({ data: { session: null } }))
      .finally(() => {
        inFlightSessionPromise = null;
      });
  }
  return inFlightSessionPromise;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve({ data: { session: null }, timedOut: true }), ms)),
  ]);
}

/**
 * fetch() wrapper that attaches the current Supabase session's access token
 * as a Bearer Authorization header. Use this for any /api/* call the server
 * verifies against a real session (i.e. anything that used to trust a
 * client-supplied userId).
 */
export async function authFetch(url, options = {}) {
  let token = null;
  if (supabase) {
    token = getCachedAccessToken();
    if (!token) {
      try {
        const { data } = await withTimeout(getSessionOnce(), 5000);
        token = data?.session?.access_token || null;
      } catch {
        token = null;
      }
    }
  }

  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return fetch(url, { ...options, headers });
}
