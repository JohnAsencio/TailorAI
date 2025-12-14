/**
 * API endpoint to get a single saved resume by ID
 */

import { loadEnvFromLocal } from './utils/loadEnv.js';
import { createClient } from '@supabase/supabase-js';

// Load env vars for local dev
loadEnvFromLocal();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { resumeId, userId } = req.query;

    if (!resumeId || !userId) {
      return res.status(400).json({ error: 'resumeId and userId are required' });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Create admin client to bypass RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Query with specific fields
    const { data, error } = await supabaseAdmin
      .from('saved_resumes')
      .select('id, user_id, tailored_resume_text, job_description, job_title, original_resume_text, created_at')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching resume:', error);
      if (error.code === 'PGRST116') {
        // No rows returned
        return res.status(404).json({
          success: false,
          error: 'Resume not found'
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch resume'
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('get-saved-resume error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
    });
  }
}

