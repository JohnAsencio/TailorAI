/**
 * API endpoint to fetch user's credit status
 * Uses service role to bypass RLS policies
 */

import { loadEnvFromLocal } from './utils/loadEnv.js';
import { createClient } from '@supabase/supabase-js';

// Load env vars for local dev
loadEnvFromLocal();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Supabase admin client (service role)
const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      error: 'Supabase service role not configured',
    });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required',
      });
    }

    const { data, error } = await supabaseAdmin
      .from('app_users')
      .select('plan_id, plan_status, resume_credits')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching credits:', error);
      // If user doesn't exist, return default values
      if (error.code === 'PGRST301' || error.message?.includes('No rows')) {
        return res.status(200).json({
          planId: 'free',
          planStatus: 'free',
          resumeCredits: 0,
          unlimited: false,
        });
      }
      return res.status(500).json({
        error: 'Failed to fetch credits',
        details: error.message,
      });
    }

    const planId = data?.plan_id || 'free';
    const planStatus = data?.plan_status || 'free';
    const resumeCredits = data?.resume_credits ?? 0;
    
    // Unlimited plans don't consume credits
    const unlimited = ['unlimited', 'pro'].includes(planId) || planStatus === 'lifetime';

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      planId,
      planStatus,
      resumeCredits,
      unlimited,
    });
  } catch (error) {
    console.error('get-credits error:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred',
      details: error.message,
    });
  }
}

