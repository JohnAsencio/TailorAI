/**
 * API endpoint for credits: get status or consume a credit.
 * POST body: { action: 'get' | 'consume', userId, creditType? }
 */

import { loadEnvFromLocal } from './utils/loadEnv.js';
import { createClient } from '@supabase/supabase-js';

loadEnvFromLocal();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    setCors(res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    setCors(res);
    return res.status(500).json({ error: 'Supabase service role not configured' });
  }

  const { action = 'get', userId, creditType } = req.body || {};

  if (!userId) {
    setCors(res);
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    if (action === 'consume') {
      if (!creditType) {
        setCors(res);
        return res.status(400).json({ error: 'creditType is required for consume' });
      }

      const { data: userData, error: fetchError } = await supabaseAdmin
        .from('app_users')
        .select('plan_id, plan_status, resume_credits')
        .eq('user_id', userId)
        .single();

      if (fetchError || !userData) {
        setCors(res);
        return res.status(404).json({ error: 'User not found' });
      }

      const planId = userData.plan_id || 'free';
      const planStatus = userData.plan_status || 'free';
      const unlimited = ['unlimited', 'pro'].includes(planId) || planStatus === 'lifetime';

      if (unlimited) {
        setCors(res);
        return res.status(200).json({
          success: true,
          remainingCredits: userData.resume_credits || 0,
          unlimited: true,
        });
      }

      const currentCredits = userData.resume_credits ?? 0;
      if (currentCredits <= 0) {
        setCors(res);
        return res.status(403).json({
          error: 'Insufficient credits',
          remainingCredits: 0,
        });
      }

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
        setCors(res);
        return res.status(500).json({ error: 'Failed to consume credit' });
      }

      setCors(res);
      return res.status(200).json({
        success: true,
        remainingCredits: updatedData.resume_credits || 0,
      });
    }

    // action === 'get' (default)
    const { data, error } = await supabaseAdmin
      .from('app_users')
      .select('plan_id, plan_status, resume_credits')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching credits:', error);
      if (error.code === 'PGRST301' || error.message?.includes('No rows')) {
        setCors(res);
        return res.status(200).json({
          planId: 'free',
          planStatus: 'free',
          resumeCredits: 0,
          unlimited: false,
        });
      }
      setCors(res);
      return res.status(500).json({
        error: 'Failed to fetch credits',
        details: error.message,
      });
    }

    const planId = data?.plan_id || 'free';
    const planStatus = data?.plan_status || 'free';
    const resumeCredits = data?.resume_credits ?? 0;
    const unlimited = ['unlimited', 'pro'].includes(planId) || planStatus === 'lifetime';

    setCors(res);
    return res.status(200).json({
      planId,
      planStatus,
      resumeCredits,
      unlimited,
    });
  } catch (error) {
    console.error('credits API error:', error);
    setCors(res);
    return res.status(500).json({
      error: 'An unexpected error occurred',
      details: error.message,
    });
  }
}
