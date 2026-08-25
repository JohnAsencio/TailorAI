/**
 * Server-side auth verification for API routes.
 * Never trust a client-supplied userId for authorization decisions — every
 * handler that reads/writes user data or spends credits must derive the
 * user id from a verified Supabase session token instead.
 *
 * Verification tries locally first (HMAC-SHA256 signature check against
 * SUPABASE_JWT_SECRET), avoiding a network round-trip to Supabase — but this
 * is purely a speed optimization: whenever it doesn't produce a user id (the
 * secret isn't configured, is the wrong value, the token uses a different
 * signing algorithm, or a genuine failure), this unconditionally falls back
 * to asking Supabase's Auth API directly. Real users must always be able to
 * authenticate correctly even if the fast path is misconfigured or absent.
 *
 * SUPABASE_JWT_SECRET comes from the Supabase dashboard: Project Settings →
 * API → JWT Settings → "JWT Secret" (legacy HS256 signing).
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Read lazily inside the functions below, not at module top-level: ES module
// imports (including this file) are evaluated before the importing api/*.js
// file's own top-level `loadEnvFromLocal()` call runs, so a module-level
// const here would permanently cache an empty string.
function getSupabaseJwtSecret() {
  return process.env.SUPABASE_JWT_SECRET || '';
}
function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
}
function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
}

function base64UrlDecode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/** Verifies an access token's signature locally. Returns the user id (sub claim) or null. */
function verifyJwtLocally(token) {
  const jwtSecret = getSupabaseJwtSecret();
  if (!jwtSecret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;

  let header;
  try {
    header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
  } catch {
    return null;
  }
  // Only the legacy shared-secret scheme can be checked without the network; anything
  // else (e.g. an asymmetric signing key migration) falls through to the network path.
  if (header.alg !== 'HS256') return null;

  const expectedSig = crypto
    .createHmac('sha256', jwtSecret)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const actualSig = base64UrlDecode(signatureB64);
  if (expectedSig.length !== actualSig.length || !crypto.timingSafeEqual(expectedSig, actualSig)) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
  } catch {
    return null;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) return null;
  if (payload.aud !== 'authenticated') return null;
  if (!payload.sub || typeof payload.sub !== 'string') return null;

  return payload.sub;
}

/**
 * Verifies the request's `Authorization: Bearer <access_token>` header and
 * returns the authenticated user's id, or null if missing/invalid/expired.
 */
export async function getAuthedUserId(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  // Fast path: verify the signature locally first (no network call). If this
  // doesn't produce a user id — secret not configured, wrong secret, a
  // signing algorithm other than HS256, or a genuinely invalid/expired token
  // — always fall through to asking Supabase directly instead of assuming
  // the token itself is bad. This makes local verification a pure speed
  // optimization: if SUPABASE_JWT_SECRET is ever missing or wrong, real users
  // still authenticate correctly, just without the latency benefit.
  const localUserId = verifyJwtLocally(token);
  if (localUserId) return localUserId;

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

export function sendUnauthorized(res) {
  return res.status(401).json({ error: 'Unauthorized. Please sign in again.' });
}
