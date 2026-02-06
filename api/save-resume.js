/**
 * API endpoint to save a tailored resume.
 * Enforces plan save limits: free=0, basic=3, pro=15, lifetime=unlimited.
 */

import { loadEnvFromLocal } from './utils/loadEnv.js';
import { createClient } from '@supabase/supabase-js';

loadEnvFromLocal();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const SAVE_LIMITS = { free: 0, basic: 3, pro: 15, lifetime: null };

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

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    setCors(res);
    return res.status(500).json({ success: false, error: 'Database not configured' });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { userId, tailoredResumeText, jobDescription, jobTitle, originalResumeText } = body;

    if (!userId || !tailoredResumeText || !jobDescription) {
      setCors(res);
      return res.status(400).json({
        success: false,
        error: 'userId, tailoredResumeText, and jobDescription are required',
      });
    }

    // Get user plan from app_users
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('app_users')
      .select('plan_id')
      .eq('user_id', userId)
      .single();

    const planId = (userRow?.plan_id || 'free').toLowerCase();
    const limit = SAVE_LIMITS[planId] ?? SAVE_LIMITS.free;

    // Free plan: no saves allowed
    if (limit === 0) {
      setCors(res);
      return res.status(403).json({
        success: false,
        error: 'save_not_allowed',
        message: 'Upgrade to Basic or higher to save resumes.',
      });
    }

    // Count existing saved resumes for this user
    const { count, error: countError } = await supabaseAdmin
      .from('saved_resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error counting saved resumes:', countError);
      setCors(res);
      return res.status(500).json({ success: false, error: 'Failed to check save limit' });
    }

    const currentCount = count ?? 0;
    if (limit != null && currentCount >= limit) {
      setCors(res);
      return res.status(403).json({
        success: false,
        error: 'save_limit_reached',
        message: `You've reached your plan limit of ${limit} saved resumes. Upgrade to save more.`,
        limit,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('saved_resumes')
      .insert([
        {
          user_id: userId,
          tailored_resume_text: tailoredResumeText,
          job_description: jobDescription,
          job_title: jobTitle || null,
          original_resume_text: originalResumeText || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving resume:', error);
      setCors(res);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to save resume',
      });
    }

    setCors(res);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('save-resume error:', err);
    setCors(res);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred',
      details: err.message,
    });
  }
}
