/**
 * API endpoint to consume a credit for a user
 * This ensures credits are decremented atomically on the server side
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
    const { userId, creditType } = req.body;

    if (!userId || !creditType) {
      return res.status(400).json({
        error: 'userId and creditType are required',
      });
    }

    // Fetch current user data
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('app_users')
      .select('plan_id, plan_status, resume_credits')
      .eq('user_id', userId)
      .single();

    if (fetchError || !userData) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const planId = userData.plan_id || 'free';
    const planStatus = userData.plan_status || 'free';
    
    // Check if user has unlimited plan
    const unlimited = ['unlimited', 'pro'].includes(planId) || planStatus === 'lifetime';

    if (unlimited) {
      // Unlimited plans don't consume credits
      return res.status(200).json({
        success: true,
        remainingCredits: userData.resume_credits || 0,
        unlimited: true,
      });
    }

    // Check if user has credits
    const currentCredits = userData.resume_credits ?? 0;
    
    if (currentCredits <= 0) {
      return res.status(403).json({
        error: 'Insufficient credits',
        remainingCredits: 0,
      });
    }

    // Consume credit atomically
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('app_users')
      .update({
        resume_credits: currentCredits - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('resume_credits')
      .single();

    if (updateError) {
      console.error('Error consuming credit:', updateError);
      return res.status(500).json({
        error: 'Failed to consume credit',
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      remainingCredits: updatedData.resume_credits || 0,
    });
  } catch (error) {
    console.error('consume-credit error:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred',
      details: error.message,
    });
  }
}

