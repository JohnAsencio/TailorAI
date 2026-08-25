/**
 * API endpoint for saved resumes, scoped to the authenticated caller.
 * GET ?resumeId=...    → list all saved resumes for the caller, or one by ID
 * DELETE ?resumeId=... → delete a resume owned by the caller
 * PATCH ?resumeId=...  → update a resume owned by the caller
 */

import { loadEnvFromLocal } from '../lib/loadEnv.js';
import { createClient } from '@supabase/supabase-js';
import { getAuthedUserId } from '../lib/auth.js';

loadEnvFromLocal();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const UPDATABLE_FIELDS = ['tailored_resume_text', 'job_description', 'job_title', 'original_resume_text'];

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(200).end();
  }

  if (!['GET', 'DELETE', 'PATCH'].includes(req.method)) {
    setCors(res);
    res.setHeader('Allow', 'GET, DELETE, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    setCors(res);
    return res.status(500).json({ success: false, error: 'Database not configured' });
  }

  const userId = await getAuthedUserId(req);
  if (!userId) {
    setCors(res);
    return res.status(401).json({ success: false, error: 'Unauthorized. Please sign in again.' });
  }

  const { resumeId } = req.query || {};

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    if (req.method === 'DELETE') {
      if (!resumeId) {
        setCors(res);
        return res.status(400).json({ success: false, error: 'resumeId is required' });
      }
      const { error } = await supabaseAdmin
        .from('saved_resumes')
        .delete()
        .eq('id', resumeId)
        .eq('user_id', userId);

      if (error) {
        setCors(res);
        return res.status(500).json({ success: false, error: error.message || 'Failed to delete resume' });
      }
      setCors(res);
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PATCH') {
      if (!resumeId) {
        setCors(res);
        return res.status(400).json({ success: false, error: 'resumeId is required' });
      }
      const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const updates = {};
      for (const key of UPDATABLE_FIELDS) {
        if (rawBody[key] !== undefined) updates[key] = rawBody[key];
      }
      if (Object.keys(updates).length === 0) {
        setCors(res);
        return res.status(400).json({ success: false, error: 'No updatable fields provided' });
      }
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('saved_resumes')
        .update(updates)
        .eq('id', resumeId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        setCors(res);
        return res.status(500).json({ success: false, error: error.message || 'Failed to update resume' });
      }
      setCors(res);
      return res.status(200).json({ success: true, data });
    }

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
