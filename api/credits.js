/**
 * API endpoint for credits: get status or consume credits.
 * POST body: { action: 'get' | 'consume', userId, creditType? }
 * creditType: 'resume' (1 credit) | 'interview' (5 credits)
 * Plans: free (2 credits), basic (10), pro (50), lifetime (unlimited)
 */

import { loadEnvFromLocal } from '../lib/loadEnv.js';
import { createClient } from '@supabase/supabase-js';
import { getAuthedUserId } from '../lib/auth.js';
import { CREDIT_COSTS, getPlanCredits } from '../src/config/pricing.js';

loadEnvFromLocal();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

const CREDIT_COST = { resume: CREDIT_COSTS.oneResume, interview: CREDIT_COSTS.oneMockInterview };
const FREE_PLAN_CREDITS = 2;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function isUnlimited(planId, planStatus) {
  return planId === 'lifetime' || planStatus === 'lifetime';
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

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      setCors(res);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }
  const { action = 'get', creditType } = body || {};

  const userId = await getAuthedUserId(req);
  if (!userId) {
    setCors(res);
    return res.status(401).json({ error: 'Unauthorized. Please sign in again.' });
  }

  try {
    if (action === 'consume') {
      if (!creditType || !['resume', 'interview'].includes(creditType)) {
        setCors(res);
        return res.status(400).json({ error: 'creditType must be "resume" (1 credit) or "interview" (5 credits)' });
      }

      const cost = CREDIT_COST[creditType];
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

      if (isUnlimited(planId, planStatus)) {
        setCors(res);
        return res.status(200).json({
          success: true,
          remainingCredits: userData.resume_credits ?? 0,
          unlimited: true,
        });
      }

      let currentCredits = userData.resume_credits ?? 0;
      const planDefault = getPlanCredits(planId);
      if (planDefault != null && (currentCredits == null || currentCredits === 0)) {
        currentCredits = planDefault;
        await supabaseAdmin
          .from('app_users')
          .update({
            resume_credits: planDefault,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }

      if (currentCredits < cost) {
        setCors(res);
        return res.status(403).json({
          error: `Insufficient credits (need ${cost} for ${creditType})`,
          remainingCredits: currentCredits,
        });
      }

      const newCredits = currentCredits - cost;
      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from('app_users')
        .update({
          resume_credits: newCredits,
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
        remainingCredits: updatedData.resume_credits ?? 0,
      });
    }

    // action === 'get'
    const { data, error } = await supabaseAdmin
      .from('app_users')
      .select('plan_id, plan_status, resume_credits')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        setCors(res);
        return res.status(200).json({
          planId: 'free',
          planStatus: 'free',
          resumeCredits: FREE_PLAN_CREDITS,
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
    const unlimited = isUnlimited(planId, planStatus);
    let resumeCredits = data?.resume_credits;
    if (resumeCredits == null && planId === 'free') {
      resumeCredits = FREE_PLAN_CREDITS;
    }
    const planDefault = getPlanCredits(planId);
    if ((resumeCredits == null || resumeCredits === 0) && planDefault != null) {
      resumeCredits = planDefault;
    }
    resumeCredits = resumeCredits ?? 0;

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
