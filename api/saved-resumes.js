/**
 * API endpoint for saved resumes: list all for a user, or get one by ID.
 * GET ?userId=...           → list all saved resumes for that user
 * GET ?userId=...&resumeId=... → get a single resume by ID
 */

import { loadEnvFromLocal } from '../lib/loadEnv.js';
import { createClient } from '@supabase/supabase-js';

loadEnvFromLocal();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    setCors(res);
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    setCors(res);
    return res.status(500).json({ success: false, error: 'Database not configured' });
  }

  const { userId, resumeId } = req.query || {};

  if (!userId) {
    setCors(res);
    return res.status(400).json({ success: false, error: 'userId is required' });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    if (resumeId) {
      // Get single resume
      const { data, error } = await supabaseAdmin
        .from('saved_resumes')
        .select('id, user_id, tailored_resume_text, job_description, job_title, original_resume_text, created_at')
        .eq('id', resumeId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching resume:', error);
        if (error.code === 'PGRST116') {
          setCors(res);
          return res.status(404).json({ success: false, error: 'Resume not found' });
        }
        setCors(res);
        return res.status(500).json({ success: false, error: error.message || 'Failed to fetch resume' });
      }

      if (!data) {
        setCors(res);
        return res.status(404).json({ success: false, error: 'Resume not found' });
      }

      setCors(res);
      return res.status(200).json({ success: true, data });
    }

    // List all resumes for user
    const { data, error } = await supabaseAdmin
      .from('saved_resumes')
      .select('id, user_id, tailored_resume_text, job_description, job_title, original_resume_text, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching resumes:', error);
      setCors(res);
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch resumes' });
    }

    setCors(res);
    return res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    console.error('saved-resumes error:', error);
    setCors(res);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
    });
  }
}
