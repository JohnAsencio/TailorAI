/**
 * Server-side auth verification for API routes.
 * Never trust a client-supplied userId for authorization decisions — every
 * handler that reads/writes user data or spends credits must derive the
 * user id from a verified Supabase session token instead.
 *
 * Verification happens locally (HMAC-SHA256 signature check against
 * SUPABASE_JWT_SECRET) whenever that secret is configured, avoiding a network
 * round-trip to Supabase on every request. If the secret isn't set yet, this
 * falls back to asking Supabase's Auth API directly (slower, but correct) so
 * nothing breaks before the env var is added.
 *
 * SUPABASE_JWT_SECRET comes from the Supabase dashboard: Project Settings →
 * API → JWT Settings → "JWT Secret" (legacy HS256 signing). If your project
 * has migrated to asymmetric JWT signing keys, local verification here won't
 * match and requests will silently fall back to the network path instead.
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

  const localUserId = verifyJwtLocally(token);
  if (localUserId) return localUserId;
  // If the secret is configured and local verification ran but failed, the
  // token is genuinely invalid/expired — no point falling back to the network.
  if (getSupabaseJwtSecret()) return null;

  // SUPABASE_JWT_SECRET not configured yet: fall back to asking Supabase directly.
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
